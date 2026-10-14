Set up a TypeScript quickstart that runs AI-generated code in Vercel Sandbox.
Target Vercel account: anthobads-projects
Target Vercel project: not selected

Project selection:
- Run `npx vercel@latest project ls --scope "anthobads-projects"` and ask me which project to use. Pause for interactive sign-in if required.
- If I want a new project, run `npx vercel@latest project add --scope "anthobads-projects"` and pause for its name.
- Save the selected or created project name as `PROJECT_NAME`. Do not guess or continue while it is empty.
Use this exact sandbox name: my-sandbox-864524

Execution contract:
- If you can access a terminal and files, perform the setup and verify it. Otherwise, return the exact commands and file contents, in order, for me to run.
- Pause for interactive sign-in. Never ask me to paste credentials, tokens, environment values, repository contents, or user code.
- Do not say the setup succeeded unless you ran the final command and observed the expected output.

Vercel CLI access: required only for local OIDC authentication. Use `npx vercel@latest`; no global install is required.

Implementation:
- Work in a new `sandbox-quickstart` folder. Use pnpm and install `@vercel/sandbox@3`, `dotenv`, and `tsx`.
- If the Vercel CLI is signed out, pause and ask me to complete `npx vercel@latest login`. Then run `npx vercel@latest link --yes --scope "anthobads-projects" --project "$PROJECT_NAME"` and `npx vercel@latest env pull .env.local --yes`.
- Confirm that `VERCEL_OIDC_TOKEN` exists without reading or printing its value.
- In `index.ts`, load `.env.local`, use `Sandbox.getOrCreate()` with `persistent: true` and `networkPolicy: 'deny-all'`, then enforce it with `sandbox.update({ networkPolicy: 'deny-all' })`.
- Write `/vercel/generated.mjs` with a Node.js program that prints `Hello from generated code`. Run it, print stdout or stderr, and stop the sandbox in a `finally` block.
- Run the script with `pnpm exec tsx index.ts`. Expected output: `Hello from generated code`.

Authentication recovery:
- If the OIDC token is missing, rejected, or expired, rerun `vercel link` and `vercel env pull`; local OIDC tokens expire after 12 hours.
- If the account or project is forbidden or not found, stop and report the exact target that needs access. Do not switch targets or request a token.

Sources:
- Quickstart: https://vercel.com/docs/sandbox/quickstart
- Authentication: https://vercel.com/docs/sandbox/concepts/authentication
- Vercel CLI: https://vercel.com/docs/cli
- SDK reference: https://vercel.com/docs/sandbox/sdk-reference