// app/recordings/[id]/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getRecordingById, getUserOrganizations, getOrganizationRecordings } from '@/lib/db/queries';
import { getAnalysisResult } from '@/lib/piano-analysis';
import RecordingDetailsClient from '@/app/recordings/[id]/recordings-client';

export default async function RecordingDetailsPage({ params }: { params: { id: string } }) {
  // Get session on the server
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const recordingId = parseInt(params.id);

  // Fetch the recording with analysis result
  const recording = await getRecordingById(recordingId, session.user.id);

  if (!recording) {
    redirect("/recordings");
  }

  // Get analysis result if available
  let analysisResult = null;
  if (recording.state === 'processed' && recording.resultId) {
    analysisResult = await getAnalysisResult(recordingId);
  }

  // Fetch organizations for sidebar
  const organizations = await getUserOrganizations(session.user.id);

  // Fetch all recordings for sidebar
  const recordingPromises = organizations.map(async (org) => {
    try {
      const orgRecordings = await getOrganizationRecordings(org.id, session.user.id);
      return orgRecordings.map(rec => ({
        id: rec.id,
        name: rec.name,
        state: rec.state,
        createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
        organizationName: org.name,
        organizationId: org.id,
        audioUrl: rec.audioUrl,
        hasResult: rec.hasResult || false,
        createdBy: rec.createdBy,
      }));
    } catch (error) {
      console.error(`Error fetching recordings for org ${org.id}:`, error);
      return [];
    }
  });

  const recordingArrays = await Promise.all(recordingPromises);
  const allRecordings = recordingArrays.flat();

  // Sort recordings by date (most recent first)
  allRecordings.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Prepare user data
  const userData = {
    name: session.user.name || session.user.username || session.user.email.split('@')[0],
    email: session.user.email,
    image: session.user.image || null,
  };

  // Transform organizations data for the client
  const organizationsData = organizations.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description || "",
    memberCount: org.memberCount || 0,
    role: org.role as "admin" | "member",
    isPersonal: org.isPersonal || false,
    recordingCount: org.recordingCount || 0,
    createdAt: org.joinedAt instanceof Date ? org.joinedAt.toISOString() : String(org.joinedAt || new Date()),
  }));

  // Transform recording data for the client
  const recordingData = {
    id: recording.id,
    name: recording.name,
    state: recording.state as "queued" | "processing" | "processed",
    duration: 30, // Default duration - you might want to add this to your schema
    createdAt: recording.createdAt instanceof Date ? recording.createdAt.toISOString() : String(recording.createdAt),
    organizationName: recording.organization?.name || "",
    organizationId: recording.organizationId,
    organizationSlug: recording.organization?.name || "",
    audioUrl: recording.audioUrl,
    createdBy: {
      firstName: recording.createdByUser?.firstName || null,
      lastName: recording.createdByUser?.lastName || null,
      username: recording.createdByUser?.username || "",
      image: recording.createdByUser?.image || null,
    },
    hasResult: !!recording.resultId,
  };

  // Transform recordings data for sidebar
  const recordingsData = allRecordings.map(recording => ({
    id: recording.id,
    name: recording.name,
    state: recording.state as "queued" | "processing" | "processed",
    createdAt: recording.createdAt,
    updatedAt: recording.createdAt, // Use createdAt as updatedAt fallback
    hasResult: recording.hasResult,
    organizationName: recording.organizationName,
    organizationId: recording.organizationId,
    audioUrl: recording.audioUrl,
    organizationSlug: recording.name,
    createdBy: {
      firstName: recording.createdBy.firstName,
      lastName: recording.createdBy.lastName,
      username: recording.createdBy.username,
      image: recording.createdBy.image,
    },
  }));

  // Render the client component with server-fetched data
  return (
    <RecordingDetailsClient
      user={userData}
      organizations={organizationsData}
      recordings={recordingsData}
      recording={recordingData}
      analysisResult={analysisResult}
    />
  );
}
