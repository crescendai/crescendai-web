// lib/piano-analysis.ts
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { recordingResults, recordings } from '@/lib/db/schema';

interface AnalysisResult {
  success: boolean;
  resultId?: number;
  error?: string;
}

/**
 * Process piano performance analysis for a recording with audio URL
 */
export async function processPianoAnalysis(
  recordingId: number,
  audioUrl?: string,
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

    // 2. Determine the audio URL
    let downloadUrl: string;
    console.log(audioUrl)

    if (audioUrl) {
      // Use provided audio URL (from storage)
      downloadUrl = audioUrl;
    } else {
      // Fallback to constructing URL from recording name
      // This is for backward compatibility
      const audioFileName = `${recording.name}.mp3`;
      downloadUrl = `https://mp3.liftgate.io/audio/${audioFileName}`;
    }

    console.log(`Fetching audio from: ${downloadUrl}`);

    // 3. Download the audio file
    const audioResponse = await fetch(downloadUrl.replace("https://9863c39a384de0942d9656f9241489dc.r2.cloudflarestorage.com/crescendai-audio-store/", "https://mp3.liftgate.io/"));
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // 4. Prepare form data for the analysis API
    const formData = new FormData();
    const fileName = recording.name.replace(/[^a-zA-Z0-9]/g, '_') + '.mp3';
    formData.append('audio', audioBlob, fileName);
    formData.append('chunk_duration', chunkDuration.toString());

    // 5. Send to external analysis API
    console.log(`Sending to analysis API for recording ${recordingId}`);

    const analysisResponse = await fetch('https://ai.liftgate.io/api/v1/analyze-piano-performance', {
      method: 'POST',
      body: formData,
      headers: {
        // Add any required API keys or authentication here
        // 'X-API-Key': process.env.PIANO_ANALYSIS_API_KEY || '',
      }
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      throw new Error(`Analysis API failed: ${analysisResponse.status} - ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    console.log(`Analysis completed for recording ${recordingId}`);

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

    console.log(`Recording ${recordingId} marked as processed with result ${newResult.id}`);

    return {
      success: true,
      resultId: newResult.id
    };

  } catch (error) {
    console.error('Piano analysis processing error:', error);

    // Update recording state to queued so it can be retried
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
// Analysis Result Type Definitions
export interface AnalysisResultData {
  overall_assessment: {
    strengths: string[];
    priority_areas: string[];
    performance_character: string;
  };
  temporal_feedback: TemporalFeedback[];
  practice_recommendations: {
    immediate_priorities: ImmediatePriority[];
    long_term_development: LongTermDevelopment[];
  };
  encouragement: string;
  _metadata: {
    generated_at: string;
    model_used: string;
    filtered_dimensions: number;
    score_distribution: {
      low: number;
      moderate: number;
      good: number;
    };
  };
}

export interface TemporalFeedback {
  timestamp: string;
  insights: Insight[];
  practice_focus: string;
}

export interface Insight {
  category: string;
  observation: string;
  actionable_advice: string;
  score_reference: string;
}

export interface ImmediatePriority {
  skill_area: string;
  specific_exercise: string;
  expected_outcome: string;
}

export interface LongTermDevelopment {
  musical_aspect: string;
  development_approach: string;
  repertoire_suggestions: string;
}

// Updated function with proper typing
export async function getAnalysisResult(recordingId: number): Promise<AnalysisResultData | null> {
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
    return JSON.parse(decodedResult) as AnalysisResultData;

  } catch (error) {
    console.error('Error getting analysis result:', error);
    return null;
  }
}

/**
 * Queue a recording for piano analysis
 * This can be called immediately after upload
 */
export async function queueRecordingForAnalysis(
  recordingId: number,
  audioUrl: string
): Promise<void> {
  // Update the recording to include the audio URL
  // You might want to add an audioUrl field to your schema
  await db.update(recordings)
    .set({
      state: 'queued',
      updatedAt: new Date(),
      // If you add an audioUrl field to schema:
      // audioUrl: audioUrl,
    })
    .where(eq(recordings.id, recordingId));

  // Process analysis asynchronously
  // In production, you might want to use a job queue like BullMQ or similar
  setImmediate(async () => {
    try {
      await processPianoAnalysis(recordingId, audioUrl);
    } catch (error) {
      console.error(`Failed to process analysis for recording ${recordingId}:`, error);
    }
  });
}

/**
 * Retry failed analysis for a recording
 */
export async function retryAnalysis(recordingId: number): Promise<AnalysisResult> {
  const recording = await db.query.recordings.findFirst({
    where: eq(recordings.id, recordingId),
  });

  if (!recording) {
    return {
      success: false,
      error: 'Recording not found'
    };
  }

  if (recording.state === 'processed') {
    return {
      success: false,
      error: 'Recording already processed'
    };
  }

  // Reset state and retry
  await db.update(recordings)
    .set({
      state: 'queued',
      updatedAt: new Date()
    })
    .where(eq(recordings.id, recordingId));

  return processPianoAnalysis(recordingId);
}

/**
 * Get analysis status for a recording
 */
export async function getAnalysisStatus(recordingId: number) {
  const recording = await db.query.recordings.findFirst({
    where: eq(recordings.id, recordingId),
    with: {
      result: true
    }
  });

  if (!recording) {
    return null;
  }

  return {
    id: recording.id,
    name: recording.name,
    state: recording.state,
    hasResult: !!recording.result,
    createdAt: recording.createdAt,
    updatedAt: recording.updatedAt,
  };
}
