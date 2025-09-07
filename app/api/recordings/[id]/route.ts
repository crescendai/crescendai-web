import { type NextRequest, NextResponse } from "next/server"
import { getAnalysisResult } from '@/lib/piano-analysis';
import { getRecordingById } from '@/lib/db/queries';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recordingId = parseInt(params.id);
    if (isNaN(recordingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recording ID' },
        { status: 400 }
      );
    }

    // Check if user has access to this recording
    const recording = await getRecordingById(recordingId, session.user.id);
    if (!recording) {
      return NextResponse.json(
        { success: false, error: 'Recording not found or access denied' },
        { status: 404 }
      );
    }

    // Check if recording has results
    if (!recording.resultId) {
      return NextResponse.json(
        { success: false, error: 'No analysis results available for this recording' },
        { status: 404 }
      );
    }

    // Get the analysis result
    const analysisResult = await getAnalysisResult(recordingId);
    if (!analysisResult) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve analysis results' },
        { status: 500 }
      );
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
