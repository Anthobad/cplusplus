import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/** Administrative scripts only. Never selects a paid project or changes its plan. */
export async function confirmHobbyProject() {
  const project = JSON.parse(await readFile('.vercel/project.json', 'utf8'));
  if (project.projectName !== 'cplusplus') throw new Error('Expected the existing anthobads-projects/cplusplus project.');
  if ((process.env.VERCEL_PROJECT_ID && process.env.VERCEL_PROJECT_ID !== project.projectId) ||
    (process.env.VERCEL_TEAM_ID && process.env.VERCEL_TEAM_ID !== project.orgId)) throw new Error('SDK credentials target a different project/team.');
  const cli = process.env.VERCEL_MAINTENANCE_CLI;
  const { stdout } = await promisify(execFile)(cli ? process.execPath : 'npx', [
    ...(cli ? [cli] : ['--yes', 'vercel@latest']), 'api', `/v2/teams/${project.orgId}`, '--scope', 'anthobads-projects',
  ], { maxBuffer: 1024 * 1024, timeout: 45000 });
  const response = JSON.parse(stdout), team = response.team || response;
  if (team.billing?.plan !== 'hobby') throw new Error('Real sandbox maintenance is restricted to the confirmed Hobby account. No resources were created.');
}
