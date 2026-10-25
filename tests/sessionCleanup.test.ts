import { describe, expect, it, vi } from 'vitest';
import { cleanupExpiredSessions } from '../server/security/sessionCleanup.js';

function database(count: number) {
  const docs = Array.from({ length: count }, (_, id) => ({ ref: { path: `_assessmentSessions/${id}` }, updateTime: { seconds: id } }));
  const query: any = { where: vi.fn(() => query), limit: vi.fn(() => query), get: vi.fn(async () => ({ docs, size: count })) };
  const batches: any[] = [];
  const db: any = { collection: vi.fn(() => query), batch: vi.fn(() => {
    const batch = { delete: vi.fn(), commit: vi.fn(async () => {}) }; batches.push(batch); return batch;
  }) };
  return { db, query, batches, docs };
}

describe('Expired assessment session maintenance', () => {
  it('defaults to a bounded dry-run of expired temporary sessions only', async () => {
    const { db, query } = database(3);
    expect(await cleanupExpiredSessions(db, { cutoff: 1000, apply: false })).toEqual({ mode: 'dry-run', eligible: 3, deleted: 0, bounded: false });
    expect(db.collection).toHaveBeenCalledExactlyOnceWith('_assessmentSessions');
    expect(query.where).toHaveBeenCalledExactlyOnceWith('expiresAt', '<=', 1000);
    expect(query.limit).toHaveBeenCalledExactlyOnceWith(500);
    expect(db.batch).not.toHaveBeenCalled();
  });
  it('deletes in bounded batches with concurrency preconditions and never targets history', async () => {
    const { db, batches, docs } = database(201);
    expect((await cleanupExpiredSessions(db, { cutoff: 1000, apply: true, maxDocuments: 201 })).deleted).toBe(201);
    expect(batches.map(batch => batch.delete.mock.calls.length)).toEqual([100, 100, 1]);
    expect(batches[0].delete).toHaveBeenNthCalledWith(1, docs[0].ref, { lastUpdateTime: docs[0].updateTime });
    expect(db.collection).toHaveBeenCalledExactlyOnceWith('_assessmentSessions');
    for (const batch of batches) expect(batch.commit).toHaveBeenCalledOnce();
  });
  it('stops on a conflicting or failed batch instead of claiming deletion succeeded', async () => {
    const { db, batches } = database(101);
    const first = { delete: vi.fn(), commit: vi.fn(async () => { throw new Error('changed'); }) };
    db.batch.mockReturnValueOnce(first);
    await expect(cleanupExpiredSessions(db, { cutoff: 1000, apply: true })).rejects.toThrow('changed');
    expect(db.batch).toHaveBeenCalledOnce();
    expect(batches).toHaveLength(0);
  });
  it('rejects unbounded maintenance requests before reading the database', async () => {
    const { db } = database(0);
    for (const maxDocuments of [0, 5001, NaN, 1.5]) {
      await expect(cleanupExpiredSessions(db, { cutoff: 1000, apply: true, maxDocuments })).rejects.toThrow();
    }
    expect(db.collection).not.toHaveBeenCalled();
  });
});
