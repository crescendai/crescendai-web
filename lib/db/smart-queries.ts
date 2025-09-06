// lib/queries-extended.ts
// Additional query functions to complement the existing queries.ts file

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { recordings, recordingResults } from './schema';

/**
 * Create a new recording result
 */
export async function createRecordingResult(base64Result: string) {
  const [result] = await db.insert(recordingResults)
    .values({
      result: base64Result,
    })
    .returning({
      id: recordingResults.id,
      createdAt: recordingResults.createdAt
    });

  return result;
}

/**
 * Update recording with result ID and set state to processed
 */
export async function updateRecordingWithResult(recordingId: number, resultId: number) {
  await db.update(recordings)
    .set({
      resultId: resultId,
      state: 'processed',
      updatedAt: new Date()
    })
    .where(eq(recordings.id, recordingId));
}

/**
 * Update recording state
 */
export async function updateRecordingState(recordingId: number, state: 'queued' | 'processing' | 'processed') {
  await db.update(recordings)
    .set({
      state: state,
      updatedAt: new Date()
    })
    .where(eq(recordings.id, recordingId));
}

/**
 * Get recordings that are ready for processing (queued state)
 */
export async function getQueuedRecordings(limit: number = 10) {
  return db
    .select({
      id: recordings.id,
      name: recordings.name,
      organizationId: recordings.organizationId,
      createdAt: recordings.createdAt,
    })
    .from(recordings)
    .where(eq(recordings.state, 'queued'))
    .orderBy(recordings.createdAt) // FIFO processing
    .limit(limit);
}

/**
 * Get recordings by organization that have results
 */
export async function getProcessedRecordingsByOrg(organizationId: number) {
  return db
    .select({
      id: recordings.id,
      name: recordings.name,
      state: recordings.state,
      createdAt: recordings.createdAt,
      updatedAt: recordings.updatedAt,
      resultId: recordings.resultId,
      result: {
        id: recordingResults.id,
        createdAt: recordingResults.createdAt,
      }
    })
    .from(recordings)
    .innerJoin(recordingResults, eq(recordings.resultId, recordingResults.id))
    .where(
      and(
        eq(recordings.organizationId, organizationId),
        eq(recordings.state, 'processed')
      )
    )
    .orderBy(desc(recordings.updatedAt));
}

/**
 * Get recording with full result data
 */
export async function getRecordingWithResult(recordingId: number) {
  const recording = await db.query.recordings.findFirst({
    where: eq(recordings.id, recordingId),
    with: {
      organization: true,
      createdByUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          image: true,
        }
      },
      result: true,
    },
  });

  return recording;
}

/**
 * Delete a recording result
 */
export async function deleteRecordingResult(resultId: number) {
  // First, remove the reference from any recordings
  await db.update(recordings)
    .set({ resultId: null })
    .where(eq(recordings.resultId, resultId));

  // Then delete the result
  await db.delete(recordingResults)
    .where(eq(recordingResults.id, resultId));
}

/**
 * Get statistics about processing
 */
export async function getProcessingStats() {
  const stats = await db
    .select({
      state: recordings.state,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(recordings)
    .groupBy(recordings.state);

  const statsByState = stats.reduce((acc, stat) => {
    acc[stat.state] = stat.count;
    return acc;
  }, {} as Record<string, number>);

  return {
    queued: statsByState.queued || 0,
    processing: statsByState.processing || 0,
    processed: statsByState.processed || 0,
    total: Object.values(statsByState).reduce((sum, count) => sum + count, 0)
  };
}
