// lib/piano-analysis.ts
import { eq } from 'drizzle-orm';
import { recordingResults, recordings } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';

interface AnalysisResult {
  success: boolean;
  resultId?: number;
  error?: string;
}

/**
 * Process piano performance analysis for a recording
 * This function:
 * 1. Fetches the recording from the database
 * 2. Downloads the audio file from storage
 * 3. Sends it to the external analysis API
 * 4. Base64 encodes the result
 * 5. Stores the result in the database
 * 6. Updates the recording with the result ID
 */
export async function processPianoAnalysis(
  recordingId: number,
  chunkDuration: number = 3.0
): Promise<AnalysisResult> {
  try {
    // 1. Fetch the recording from database
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, recordingId),
    });

    if (!recording) {
      return {
        success: false,
        error: 'Recording not found'
      };
    }

    // Update recording state to processing
    await db.update(recordings)
      .set({
        state: 'processing',
        updatedAt: new Date()
      })
      .where(eq(recordings.id, recordingId));

    // 2. Get the audio file URL from the recording name
    // Assuming the recording name contains the key or we store it somehow
    // For this example, I'll assume we need to construct the download URL
    const audioFileName = `${recording.name}.mp3`; // Adjust based on your naming convention
    const downloadUrl = `https://mp3.liftgate.io/audio/${audioFileName}`;

    // 3. Download the audio file
    const audioResponse = await fetch(downloadUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // 4. Prepare form data for the analysis API
    const formData = new FormData();
    formData.append('audio', audioBlob, audioFileName);
    formData.append('chunk_duration', chunkDuration.toString());

    // 5. Send to external analysis API
    const analysisResponse = await fetch('https://ai.liftgate.io/api/v1/analyze-piano-performance', {
      method: 'POST',
      body: formData,
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis API failed: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();

    // 6. Base64 encode the result
    const resultString = JSON.stringify(analysisData);
    const base64Result = Buffer.from(resultString).toString('base64');

    // 7. Store the result in the database
    const [newResult] = await db.insert(recordingResults)
      .values({
        result: base64Result,
      })
      .returning({ id: recordingResults.id });

    // 8. Update the recording with the result ID and mark as processed
    await db.update(recordings)
      .set({
        resultId: newResult.id,
        state: 'processed',
        updatedAt: new Date()
      })
      .where(eq(recordings.id, recordingId));

    return {
      success: true,
      resultId: newResult.id
    };

  } catch (error) {
    console.error('Piano analysis processing error:', error);

    // Update recording state to failed (you might want to add a 'failed' state to your enum)
    // For now, we'll keep it as 'queued' so it can be retried
    await db.update(recordings)
      .set({
        state: 'queued',
        updatedAt: new Date()
      })
      .where(eq(recordings.id, recordingId));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get and decode the analysis result for a recording
 */
export async function getAnalysisResult(recordingId: number) {
  try {
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, recordingId),
      with: {
        result: true
      }
    });

    if (!recording || !recording.result) {
      return null;
    }

    // Decode the base64 result
    const decodedResult = Buffer.from(recording.result.result, 'base64').toString('utf-8');
    return JSON.parse(decodedResult);

  } catch (error) {
    console.error('Error getting analysis result:', error);
    return null;
  }
}

/**
 * Helper function to construct the correct audio download URL from storage key
 */
export function getAudioDownloadUrl(storageKey: string): string {
  // Extract filename from the storage key
  // Key format: "audio/timestamp_randomid_filename" or "recordings/timestamp_randomid_filename"
  const parts = storageKey.split('/');
  const filename = parts[parts.length - 1];

  // Remove the timestamp and random ID prefix to get original filename
  const filenameParts = filename.split('_');
  const originalFilename = filenameParts.slice(2).join('_');

  return `https://mp3.liftgate.io/audio/${originalFilename}`;
}

/**
 * Batch process multiple recordings for piano analysis
 */
export async function batchProcessPianoAnalysis(
  recordingIds: number[],
  chunkDuration: number = 3.0,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number; results: AnalysisResult[] }> {
  const results: AnalysisResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recordingIds.length; i++) {
    const recordingId = recordingIds[i];

    try {
      const result = await processPianoAnalysis(recordingId, chunkDuration);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }

      onProgress?.(i + 1, recordingIds.length);

      // Add a small delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      failedCount++;
      onProgress?.(i + 1, recordingIds.length);
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    results
  };
}

/**
 * API route handler for processing piano analysis
 * Usage: POST /api/recordings/[id]/analyze
 */
export async function handlePianoAnalysisRequest(
  recordingId: number,
  chunkDuration?: number
) {
  const result = await processPianoAnalysis(recordingId, chunkDuration);

  if (result.success) {
    return {
      success: true,
      data: {
        resultId: result.resultId,
        message: 'Piano analysis completed successfully'
      }
    };
  } else {
    return {
      success: false,
      error: result.error
    };
  }
}
