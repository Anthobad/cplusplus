import { getCodeRunner, LocalCodeRunner, IsolatedProductionRunner, type CodeRunner } from '../codeRunner.js';
import { evaluateSubmission, type SubmissionPayload } from '../evaluateSubmission.js';
import { HttpError } from './store.js';

// Trusted tests may still instantiate LocalCodeRunner directly. Public API code must
// never execute on the host which now holds Firebase administrative credentials.
export function createSecureEvaluator(select: () => CodeRunner = getCodeRunner) {
  return async (payload: SubmissionPayload) => {
    const runner = select();
    let unsafe = runner instanceof LocalCodeRunner;
    if (runner instanceof IsolatedProductionRunner) {
      try {
        const host = new URL(process.env.ISOLATED_RUNNER_ENDPOINT || '').hostname;
        unsafe = ['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0'].includes(host) || host.startsWith('127.');
      } catch { unsafe = true; }
    }
    if (unsafe) throw new HttpError(503, 'API execution requires a separate sandbox/provider; application-host execution is disabled.');
    return evaluateSubmission(payload, runner);
  };
}
