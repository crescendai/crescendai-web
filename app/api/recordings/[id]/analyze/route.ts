// app/api/recordings/[id]/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processPianoAnalysis, getAnalysisStatus, retryAnalysis } from '@/lib/piano-analysis';
import { eq } from 'drizzle-orm';
import { recordings } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recordingId = parseInt(params.id);

    // Get request body if any
    const body = await request.json().catch(() => ({}));
    const { audioUrl, chunkDuration = 3.0 } = body;

    // Verify user has access to this recording
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, recordingId),
      with: {
        organization: {
          with: {
            members: true
          }
        }
      }
    });

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Check if user is member of the organization
    const isMember = recording.organization.members.some(
      member => member.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Process the analysis
    const result = await processPianoAnalysis(recordingId, audioUrl, chunkDuration);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          resultId: result.resultId,
          message: 'Piano analysis completed successfully'
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recordingId = parseInt(params.id);

    // Get analysis status
    const status = await getAnalysisStatus(recordingId);

    if (!status) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Retry failed analysis
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recordingId = parseInt(params.id);

    // Retry the analysis
    const result = await retryAnalysis(recordingId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          resultId: result.resultId,
          message: 'Analysis retry initiated successfully'
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Retry API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
