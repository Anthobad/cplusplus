import type { Unit } from '../types';
import { getUnitById } from './curriculumSummary';

const domains: Record<string, () => Promise<Unit[]>> = {
  'phase-1': () => import('../generated/curriculum/domain-1.json').then(module => module.default as Unit[]),
  'phase-2': () => import('../generated/curriculum/domain-2.json').then(module => module.default as Unit[]),
  'phase-3': () => import('../generated/curriculum/domain-3.json').then(module => module.default as Unit[]),
  'phase-4': () => import('../generated/curriculum/domain-4.json').then(module => module.default as Unit[]),
};

export function createDomainLoader(loaders: Record<string, () => Promise<Unit[]>>) {
  const cache = new Map<string, Promise<Unit[]>>();
  return (phaseId: string): Promise<Unit[]> => {
    if (!loaders[phaseId]) return Promise.reject(new Error('Unknown curriculum domain.'));
    const cached = cache.get(phaseId);
    if (cached) return cached;
    const pending = Promise.resolve().then(loaders[phaseId]).catch(error => {
      cache.delete(phaseId);
      throw error;
    });
    cache.set(phaseId, pending);
    return pending;
  };
}

export const loadCurriculumDomain = createDomainLoader(domains);

export async function loadUnit(id: string): Promise<Unit> {
  const summary = getUnitById(id);
  if (!summary) throw new Error('Unknown curriculum topic.');
  const units = await loadCurriculumDomain(summary.phaseId);
  const unit = units.find(item => item.id === summary.id);
  if (!unit) throw new Error('Topic content is unavailable.');
  return unit;
}
