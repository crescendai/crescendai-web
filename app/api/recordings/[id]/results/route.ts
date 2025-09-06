// app/api/recordings/[id]/results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRecordingById } from '@/lib/db/queries';
import { getAnalysisResult } from '@/lib/piano-analysis';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Get current session
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

    return NextResponse.json({
      success: true,
      data: {
        recordingId: recording.id,
        recordingName: recording.name,
        analysisResult: analysisResult,
        resultId: recording.resultId,
        createdAt: recording.result?.createdAt
      }
    });

  } catch (error) {
    console.error('Analysis results API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
