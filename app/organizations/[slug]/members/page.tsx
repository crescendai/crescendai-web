// app/organizations/[slug]/members/page.tsx
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  checkUserOrgAccess,
  getOrganizationBySlug,
  getOrganizationMembers, getOrganizationRecordings,
  getUserOrganizations
} from '@/lib/db/queries';
import MembersClient from '@/app/organizations/[slug]/members/members-client';

export default async function OrganizationMembersPage({
                                                        params
                                                      }: {
  params: { slug: string }
}) {
  // Get session on the server
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch organization details
  const organization = await getOrganizationBySlug(params.slug);

  if (!organization) {
    notFound();
  }

  // Check if user has access to this organization
  const userAccess = await checkUserOrgAccess(session.user.id, organization.id);

  if (!userAccess) {
    redirect("/organizations");
  }

  // Fetch organization members
  const members = await getOrganizationMembers(organization.id);

  // Transform members data for the client
  const membersData = members.map(member => ({
    id: member.id,
    name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username,
    username: member.username,
    email: member.email,
    avatar: member.image,
    role: member.role as "admin" | "member",
    joinedAt: member.joinedAt instanceof Date ? member.joinedAt.toISOString() : String(member.joinedAt),
  }));

  // Fetch user's organizations for sidebar
  const userOrganizations = await getUserOrganizations(session.user.id);

  // Fetch recordings for sidebar
  const recordingPromises = userOrganizations.map(async (org) => {
    try {
      const orgRecordings = await getOrganizationRecordings(org.id, session.user.id);
      return orgRecordings.map(rec => ({
        id: rec.id,
        name: rec.name,
        state: rec.state,
        createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
        organizationName: org.name,
        organizationSlug: org.slug,
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

  // Sort recordings by date
  allRecordings.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Prepare user data
  const userData = {
    name: session.user.name || session.user.username || session.user.email.split('@')[0],
    email: session.user.email,
    image: session.user.image || null,
  };

  // Transform organizations for sidebar
  const sidebarOrganizations = userOrganizations.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    role: org.role as "admin" | "member",
    isPersonal: org.isPersonal || false,
    memberCount: org.memberCount || 0,
    recordingCount: org.recordingCount || 0,
  }));

  // Render the client component with server-fetched data
  return (
    <MembersClient
      user={userData}
      organization={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        memberCount: organization.memberCount || 0,
        ownerId: organization.ownerId,
      }}
      members={membersData}
      currentUserRole={userAccess.role as "admin" | "member"}
      organizations={sidebarOrganizations}
      recordings={allRecordings}
    />
  );
}
