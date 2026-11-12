import { rejectDuplicateJsonKeys } from './server/security/json.js';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createAccess } from './server/security/access.js';
import { firestoreStore, verifyFirebaseToken } from './server/security/firebaseAdmin.js';
import { createProgressService } from './server/security/progress.js';
import { createTrustedRoutes, validateCode } from './server/security/routes.js';
import { createSecureEvaluator } from './server/security/evaluator.js';
import { submissionPerformance, measureSubmissionPhase, submissionTimingHeaders } from './server/submissionPerformance.js';

dotenv.config();
const app = express();
const PORT = 3000;
app.use(express.json({ limit: '256kb', verify: (_req,_res,buffer)=>rejectDuplicateJsonKeys(buffer.toString('utf8')) }));
app.use((error: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error) { res.status(400).json({ error: 'Invalid JSON request.' }); return; } next();
});
app.use('/api/evaluate-code', submissionPerformance);
const access = createAccess(firestoreStore, verifyFirebaseToken);
const trustedProgress = createProgressService(firestoreStore);
const secureEvaluate = createSecureEvaluator();
app.use('/api', createTrustedRoutes({ access, progress: trustedProgress, evaluate: secureEvaluate }));
app.get('/api/health', (_req,res)=>res.json({status:'ok',timestamp:new Date().toISOString()}));
app.post('/api/evaluate-code', access.authenticate, access.limited('execution', async(req,res)=>{
  validateCode(req.body);
  const {status,result}=await measureSubmissionPhase('evaluation',()=>secureEvaluate(req.body));
  if(status===200&&result.passed) await measureSubmissionPhase('progressPersistence',()=>trustedProgress.coding(res.locals.principal,req.body.challengeId,result));
  submissionTimingHeaders(res);res.status(status).json(result);
}));
// Removed features and unknown API paths must never fall through to the SPA.
app.use('/api', (_req,res)=>res.status(404).json({error:'API endpoint not found.'}));
// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  const RUNNER_PORT = parseInt(process.env.RUNNER_PORT || "8088", 10);

  if (!isProduction) {
    // Development convenience: start local sandbox runner daemon on loopback port if unconfigured
    if (!process.env.ISOLATED_RUNNER_ENDPOINT) {
      try {
        const { createRunnerServer } = await import("./runner/server.js");
        const runnerServer = createRunnerServer();
        runnerServer.on("error", (err: any) => {
          if (err.code === "EADDRINUSE") {
            console.log(`[Isolated C++ Runner] Dev sandbox daemon already active on port ${RUNNER_PORT}`);
          } else {
            console.warn("[Isolated C++ Runner] Runner server notice:", err.message);
          }
        });
        runnerServer.listen(RUNNER_PORT, "127.0.0.1", () => {
          console.log(`[Isolated C++ Runner] Local dev sandbox daemon listening on http://127.0.0.1:${RUNNER_PORT}`);
        });
        process.env.ISOLATED_RUNNER_ENDPOINT = `http://127.0.0.1:${RUNNER_PORT}`;
      } catch (runnerErr: any) {
        console.warn("[Isolated C++ Runner] Could not start local daemon:", runnerErr.message);
      }
    }
  } else {
    // Production Security: in-container C++ execution is strictly prohibited.
    if (process.env.ISOLATED_RUNNER_ENDPOINT) {
      console.log(
        `[Production Architecture] Delegating to authenticated external Cloud Run runner: ${process.env.ISOLATED_RUNNER_ENDPOINT}`
      );
    } else {
      console.log(
        "[Production Architecture] No external Cloud Run runner configured. " +
        "Delegating to zero-cost Wandbox C++20 execution provider ($0, no billing required)."
      );
    }
  }

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`C++ Roadmap server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

// Vercel imports the Express handler without starting listeners or a local compiler daemon.
if (process.env.VERCEL !== "1") void startServer();
