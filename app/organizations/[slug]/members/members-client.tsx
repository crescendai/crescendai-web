// app/organizations/[slug]/members/members-client.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  MoreHorizontal,
  Shield,
  Users,
  UserPlus,
  UserX,
  AlertTriangle,
  Settings,
  Download,
  Mail,
  ArrowLeft
} from "lucide-react"
import { inviteMemberAction, removeMemberAction } from '@/lib/db/actions';

interface Member {
  id: number
  name: string
  username: string
  email: string
  avatar: string | null
  role: "admin" | "member"
  joinedAt: string
}

interface Organization {
  id: number
  name: string
  slug: string
  memberCount: number
  ownerId: number
}

interface Recording {
  id: number
  name: string
  state: "queued" | "processing" | "processed"
  createdAt: string
  organizationName: string
  organizationSlug: string
  hasResult: boolean
  createdBy: {
    firstName: string | null
    lastName: string | null
    username: string
  }
}

interface SidebarOrganization {
  id: number
  name: string
  slug: string
  role: "admin" | "member"
  isPersonal: boolean
  memberCount: number
  recordingCount: number
}

interface MembersClientProps {
  user: {
    name: string
    email: string
    image: string | null
  }
  organization: Organization
  members: Member[]
  currentUserRole: "admin" | "member"
  organizations: SidebarOrganization[]
  recordings: Recording[]
}

export default function MembersClient({
                                        user,
                                        organization,
                                        members: initialMembers,
                                        currentUserRole,
                                        organizations,
                                        recordings
                                      }: MembersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [members, setMembers] = useState(initialMembers)
  const [selectedRole, setSelectedRole] = useState("all")
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
  const [isInviting, setIsInviting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const isAdmin = currentUserRole === "admin"

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    const formData = new FormData()
    formData.append("organizationId", organization.id.toString())
    formData.append("email", inviteEmail)
    formData.append("role", inviteRole)

    try {
      const result = await inviteMemberAction(null, formData)
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Member invited",
          description: `${inviteEmail} has been invited to ${organization.name}.`,
        })
        setShowInviteDialog(false)
        setInviteEmail("")
        setInviteRole("member")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to Add Member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from ${organization.name}?`)) {
      return
    }

    const formData = new FormData()
    formData.append("organizationId", organization.id.toString())
    formData.append("memberId", memberId.toString())

    try {
      const result = await removeMemberAction(null, formData)
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Member removed",
          description: `${memberName} has been removed from the organization.`,
        })
        setMembers(prev => prev.filter(m => m.id !== memberId))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || member.role === selectedRole
    return matchesSearch && matchesRole
  })

  const adminCount = members.filter(m => m.role === "admin").length
  const memberCount = members.filter(m => m.role === "member").length
  const ownerMember = members.find(m => m.id === organization.ownerId)

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        user={user}
        organizations={organizations}
        recordings={recordings}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar - Organization Stats */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-6">
          <Button
            variant="ghost"
            className="mb-6 -ml-2"
            onClick={() => router.push("/organizations")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{organization.name}</h3>
            <p className="text-sm text-gray-600">Organization Members</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#0471A6]" />
                <span className="font-medium text-gray-900">All Members</span>
              </div>
              <Badge variant="secondary" className="bg-[#0471A6] text-white">
                {members.length}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                 onClick={() => setSelectedRole("admin")}>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Administrators</span>
              </div>
              <Badge variant="outline">{adminCount}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                 onClick={() => setSelectedRole("member")}>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Members</span>
              </div>
              <Badge variant="outline">{memberCount}</Badge>
            </div>

            {ownerMember && (
              <div className="flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700">Owner</span>
                </div>
                <span className="text-sm text-gray-600">{ownerMember.name}</span>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mt-8">
              <Button
                className="w-full bg-[#C3F73A] hover:bg-[#C3F73A]/90 text-[#01172F]"
                onClick={() => setShowInviteDialog(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          )}

          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Total Members:</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Administrators:</span>
                <span className="font-medium">{adminCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Regular Members:</span>
                <span className="font-medium">{memberCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Members of {organization.name}</h1>
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: "Export not implemented",
                  description: "Member export functionality coming soon.",
                })
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="member">Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Organization Members</span>
                <div className="flex items-center gap-8 text-sm font-medium text-gray-700">
                  <span>Role</span>
                  <span>Joined</span>
                  {isAdmin && <span className="w-8"></span>}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredMembers.map((member) => {
                const isOwner = member.id === organization.ownerId
                return (
                  <div key={member.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#C3F73A] flex items-center justify-center">
                            <span className="text-[#01172F] font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.name}
                            {isOwner && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Owner
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">@{member.username} · {member.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="min-w-[100px]">
                          {isOwner ? (
                            <Badge className="bg-yellow-100 text-yellow-800">Owner</Badge>
                          ) : (
                            <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                              {member.role === "admin" ? "Admin" : "Member"}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 min-w-[100px]">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>

                        {isAdmin && !isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="w-4 h-4 mr-2" />
                                Change role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleRemoveMember(member.id, member.name)}
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Remove from organization
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedRole !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "This organization has no members yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {organization.name}</DialogTitle>
            <DialogDescription>
              Send an invitation to a new member to join your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInviteMember}
                disabled={!inviteEmail.trim() || isInviting}
                className="bg-[#0471A6] hover:bg-[#01172F]"
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
