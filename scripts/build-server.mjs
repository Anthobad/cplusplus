import { build } from 'esbuild';
import { createRequire, isBuiltin } from 'node:module';
import path from 'node:path';

// Keep the supported SDK versions. Compile their mixed CJS/ESM boundary together
// so production does not depend on Node's optional synchronous require(ESM).
const bundled = /^(firebase-admin|jwks-rsa|jose|@vercel\/sandbox|@workflow\/serde)(\/|$)/;
const result = await build({
  entryPoints: ['server.ts'], outfile: 'server-build/server.cjs',
  bundle: true, platform: 'node', target: 'node24', format: 'cjs',
  packages: 'external', sourcemap: true, metafile: true,
  // Vercel's ESM entrypoint must receive the Express function as the CJS default.
  footer: { js: 'module.exports = module.exports.default;' },
  plugins: [{ name: 'bundle-auth-and-sandbox', setup(builder) {
    builder.onResolve({ filter: /^[^./]/ }, args => {
      if (args.kind === 'entry-point' || isBuiltin(args.path)) return;
      const resolved = createRequire(path.join(args.resolveDir, 'package.json')).resolve(args.path);
      if (bundled.test(args.path)) return { path: resolved };
      // Preserve each importer's nested dependency version when moving its code
      // into the bundle (e.g. Admin's google-auth-library 11 vs the root's 10).
      return { path: `./${path.relative(path.resolve('server-build'), resolved).split(path.sep).join('/')}`, external: true };
    });
  } }],
});
for (const name of ['firebase-admin/lib/utils/jwt.js', 'jwks-rsa/src/utils.js', 'jose/dist/webapi/index.js', '@vercel/sandbox/dist/index.cjs']) {
  if (!Object.keys(result.metafile.inputs).some(input => input.endsWith(`node_modules/${name}`))) {
    throw new Error(`Required server dependency was not bundled: ${name}`);
  }
}
for (const output of Object.values(result.metafile.outputs)) {
  if (output.imports.some(entry => entry.external && bundled.test(entry.path))) {
    throw new Error('An incompatible authentication/sandbox module boundary remains external.');
  }
}
console.log('Server bundle: Firebase Admin, JWKS, JOSE and Sandbox module boundaries compiled together.');
