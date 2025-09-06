// components/sidebar.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Building2, LogOut, Plus, Clock, CheckCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FuturisticAudioInputPanel } from '@/components/audio-input-panel';

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

interface Organization {
  id: number
  name: string
  slug: string
  role: "admin" | "member"
  isPersonal: boolean
  memberCount: number
  recordingCount: number
}

interface AudioData {
  file: File
  url: string
  duration: number
  size: string
  id: string
  name: string
  uploadedAt: Date
  type: 'recording' | 'upload'
  storageUrl?: string
}

interface SidebarProps {
  user: {
    name: string
    email: string
    image: string | null
  }
  organizations: Organization[]
  recordings: Recording[]
  onCreateRecording?: (name: string, organizationId: number, audioData?: AudioData) => Promise<void>
}

export default function Sidebar({ user, organizations, recordings, onCreateRecording }: SidebarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNewRecording, setShowNewRecording] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(organizations[0]?.id || null)
  const [recordingName, setRecordingName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [audioData, setAudioData] = useState<AudioData | null>(null)
  const [currentStep, setCurrentStep] = useState<'audio' | 'details'>('audio')
  const { toast } = useToast()
  const router = useRouter()

  // Group recordings by month
  const groupedRecordings = recordings.reduce(
    (acc, recording) => {
      const month = format(new Date(recording.createdAt), "MMMM yyyy")
      if (!acc[month]) {
        acc[month] = []
      }
      acc[month].push(recording)
      return acc
    },
    {} as Record<string, typeof recordings>,
  )

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  const handleOrganizations = () => {
    router.push("/organizations")
    setShowProfileMenu(false)
  }

  const handleAudioChange = (data: AudioData) => {
    setAudioData(data)
    // Auto-generate a name from the file if not already set
    if (!recordingName && data.name) {
      const baseName = data.name.replace(/\.(mp3|webm|wav)$/i, '')
      setRecordingName(baseName)
    }
    // Move to details step after audio is captured
    setCurrentStep('details')
  }

  const handleAudioAnalyze = async (data: AudioData) => {
    // If analysis is triggered directly, create recording with analyzed flag
    if (!recordingName.trim()) {
      const baseName = data.name.replace(/\.(mp3|webm|wav)$/i, '')
      setRecordingName(`${baseName} - Analysis`)
    }

    setIsCreating(true)
    try {
      if (onCreateRecording && selectedOrg !== null) {
        await onCreateRecording(recordingName || data.name, selectedOrg, data)
        toast({
          title: "Recording created",
          description: "Your audio is being analyzed. Check back soon for results.",
        })
        resetForm()
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create recording",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateRecording = async () => {
    if (!recordingName.trim() || !selectedOrg) return

    if (!onCreateRecording) {
      toast({
        title: "Error",
        description: "Recording creation not available",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      await onCreateRecording(recordingName, selectedOrg, audioData || undefined)
      toast({
        title: "Recording created",
        description: audioData
          ? "Your recording with audio has been created and queued for processing."
          : "Your new recording has been created and queued for processing.",
      })
      resetForm()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create recording",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setShowNewRecording(false)
    setRecordingName("")
    setAudioData(null)
    setCurrentStep('audio')
  }

  const getStateIcon = (state: Recording["state"]) => {
    switch (state) {
      case "queued":
        return <Clock className="h-3 w-3" />
      case "processing":
        return <Loader2 className="h-3 w-3 animate-spin" />
      case "processed":
        return <CheckCircle className="h-3 w-3" />
    }
  }

  const getStateColor = (state: Recording["state"]) => {
    switch (state) {
      case "queued":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "processed":
        return "bg-green-100 text-green-800"
    }
  }

  const getUserInitials = (name: string, email: string) => {
    if (name && name.length > 0) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="w-80 flex flex-col" style={{ backgroundColor: "#01172F" }}>
      {/* Header */}
      <div className="p-6 border-b border-opacity-20" style={{ borderColor: "#B4D2E7" }}>
        <h1 className="text-2xl font-bold text-white">CrescendAI</h1>
      </div>

      {/* New Recording Button - Only show if handler is provided */}
      {onCreateRecording && (
        <div className="p-4">
          <Dialog open={showNewRecording} onOpenChange={(open) => {
            setShowNewRecording(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="w-full justify-start gap-2" style={{ backgroundColor: "#C3F73A", color: "#01172F" }}>
                <Plus className="h-4 w-4" />
                New Recording
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Recording</DialogTitle>
                <DialogDescription>
                  {currentStep === 'audio'
                    ? "Upload an MP3 file or record audio directly from your microphone"
                    : "Provide details for your recording"}
                </DialogDescription>
              </DialogHeader>

              {currentStep === 'audio' ? (
                <div className="py-4">
                  <FuturisticAudioInputPanel
                    onChange={handleAudioChange}
                    onAnalyze={handleAudioAnalyze}
                    onShare={(data) => {
                      toast({
                        title: "Share feature",
                        description: "Audio sharing will be available soon",
                      })
                    }}
                    onSave={(data) => {
                      toast({
                        title: "Audio saved",
                        description: "Your audio has been saved to the recording",
                      })
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {audioData && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Audio attached:</p>
                      <p className="font-medium">{audioData.name}</p>
                      <p className="text-xs text-gray-500">
                        {audioData.type === 'recording' ? 'Recorded' : 'Uploaded'} •
                        Duration: {Math.round(audioData.duration)}s
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Recording Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Beethoven Sonata Practice"
                      value={recordingName}
                      onChange={(e) => setRecordingName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org">Organization</Label>
                    <select
                      id="org"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={selectedOrg || ""}
                      onChange={(e) => setSelectedOrg(Number.parseInt(e.target.value))}
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} {org.isPersonal && "(Personal)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('audio')}
                    >
                      Back to Audio
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRecording}
                      disabled={!recordingName.trim() || !selectedOrg || isCreating}
                      style={{ backgroundColor: "#01172F", color: "white" }}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Recording
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Recordings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recordings</h2>

        {Object.keys(groupedRecordings).length === 0 ? (
          <p className="text-gray-400 text-sm">No recordings yet. Create your first recording!</p>
        ) : (
          Object.entries(groupedRecordings).map(([month, monthRecordings]) => (
            <div key={month} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300 mb-3">{month}</h3>
              {monthRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-opacity-15"
                  style={
                    {
                      backgroundColor: "transparent",
                      "--hover-bg": "#B4D2E7",
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(180, 210, 231, 0.15)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                  onClick={() => router.push(`/recordings/${recording.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm leading-relaxed truncate">{recording.name}</p>
                      <p className="text-gray-400 text-xs mt-1">{recording.organizationName}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {format(new Date(recording.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`ml-2 flex items-center gap-1 ${getStateColor(recording.state)}`}
                    >
                      {getStateIcon(recording.state)}
                      {recording.state}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-opacity-20 relative" style={{ borderColor: "#B4D2E7" }}>
        <div
          className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(180, 210, 231, 0.15)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
          }}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || undefined} alt="Profile" />
            <AvatarFallback style={{ backgroundColor: "#C3F73A", color: "#01172F" }}>
              {getUserInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">{user.name}</p>
            <p className="text-gray-300 text-xs truncate">{user.email}</p>
          </div>
        </div>

        {/* Profile Menu Popup */}
        {showProfileMenu && (
          <Card
            className="absolute bottom-full left-4 right-4 mb-2 p-2 shadow-lg border"
            style={{ backgroundColor: "white" }}
          >
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-sm gap-2" onClick={handleOrganizations}>
                <Building2 className="h-4 w-4" />
                Organizations
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
