// app/recordings/[id]/recording-details-client.tsx
"use client"

import { Suspense, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import Sidebar from "@/components/sidebar"
import { FeedbackItem, formatDimensionKey } from "@/lib/types/feedback-item"
import type { AnalysisResultData } from "@/lib/piano-analysis"
import { FEEDBACK_CATEGORIES, FeedbackCategory, FeedbackFilter } from '@/components/recordings/feedback-filter';
import { PerformanceHeader } from '@/components/recordings/performance-header';
import { AudioPlayer } from '@/components/recordings/audio-player';
import { Timeline } from '@/components/recordings/timeline';
import { TemporalFeedback } from '@/components/recordings/temporal-feedback';
import { PerformanceAnalytics } from '@/components/recordings/performance-analytics';
import { FeedbackModal } from '@/components/recordings/feedback-modal';

// Interface definitions
interface Recording {
  id: number
  name: string
  state: "queued" | "processing" | "processed"
  duration: number
  audioUrl: string
  createdAt: string
  organizationName: string
  organizationId: number
  organizationSlug: string
  hasResult: boolean
  createdBy: {
    firstName: string | null
    lastName: string | null
    username: string
    image: string | null
  }
}

interface Organization {
  id: number
  name: string
  slug: string
  description: string
  memberCount: number
  role: "admin" | "member"
  isPersonal: boolean
  recordingCount: number
  createdAt: string
}

interface RecordingDetailsClientProps {
  user: {
    name: string
    email: string
    image: string | null
  }
  organizations: Organization[]
  recordings: Recording[]
  recording: Recording
  analysisResult: AnalysisResultData | null
}

export default function RecordingDetailsClient({
                                                 user,
                                                 organizations,
                                                 recordings,
                                                 recording,
                                                 analysisResult
                                               }: RecordingDetailsClientProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedFeedback, setSelectedFeedback] = useState<{
    timestamp: number
    items: FeedbackItem[]
  } | null>(null)
  const [activeFilters, setActiveFilters] = useState<FeedbackCategory[]>([])

  // Generate FeedbackItems from analysis result
  const feedbackMarkers = useMemo(() => {
    if (!analysisResult?.temporal_feedback) return []

    const items: FeedbackItem[] = []
    let idCounter = 1

    analysisResult.temporal_feedback.forEach(tf => {
      // Parse timestamp range like "0:00-0:03" to get start time in seconds
      const startTimeStr = tf.timestamp.split('-')[0]
      const [minutes, seconds] = startTimeStr.split(':').map(Number)
      const timestamp = minutes * 60 + seconds

      // Create feedback items from insights
      tf.insights.forEach(insight => {
        // Handle score_reference as string or object
        let scoreReference: Record<string, number> = {}
        let avgScore = 0.5 // Default score
        let dimension = "unknown"

        if (typeof insight.score_reference === 'string') {
          // Parse string format like "pedal_clean_blurred: 1.0"
          try {
            const parts = insight.score_reference.split(':')
            if (parts.length === 2) {
              dimension = parts[0].trim()
              avgScore = parseFloat(parts[1].trim())
              scoreReference = { [dimension]: avgScore }
            }
          } catch (error) {
            console.error('Error parsing score_reference string:', error)
          }
        } else if (typeof insight.score_reference === 'object' && insight.score_reference !== null) {
          // Handle object format
          scoreReference = insight.score_reference as Record<string, number>
          const scoreValues = Object.values(scoreReference)
          avgScore = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length
          dimension = Object.keys(scoreReference)[0] || "unknown"
        }

        const severity = avgScore >= 0.8 ? "positive" : "negative"

        items.push({
          id: idCounter++,
          timestamp,
          dimension: formatDimensionKey(dimension),
          score: avgScore,
          feedbackText: insight.observation,
          severity,
          score_reference: scoreReference
        })
      })
    })

    return items
  }, [analysisResult])

  // Filter markers based on active filters
  const filteredMarkers = activeFilters.length > 0
    ? feedbackMarkers.filter((marker) =>
      activeFilters.some((filter) => {
        const categories = FEEDBACK_CATEGORIES[filter]
        return categories.includes(marker.dimension as string)
      })
    )
    : feedbackMarkers

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  const handleMarkerClick = (timestamp: number, feedback: FeedbackItem[]) => {
    setSelectedFeedback({ timestamp, items: feedback })
  }

  const handleFilterChange = (category: FeedbackCategory) => {
    setActiveFilters((prev) =>
      prev.includes(category)
        ? prev.filter((f) => f !== category)
        : [...prev, category]
    )
  }

  const handleClearFilters = () => {
    setActiveFilters([])
  }

  // Sidebar organizations data
  const sidebarOrganizations = organizations.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    role: org.role,
    isPersonal: org.isPersonal,
    memberCount: org.memberCount,
    recordingCount: org.recordingCount,
  }))

  // Loading state for processing recordings
  if (recording.state === 'processing') {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          user={user}
          organizations={sidebarOrganizations}
          recordings={recordings}
        />
        <div className="flex-1 bg-white flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <ReloadIcon className="w-6 h-6 animate-spin" />
            <span>Processing recording...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state for recordings without results
  if (recording.state === 'processed' && !analysisResult) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          user={user}
          organizations={sidebarOrganizations}
          recordings={recordings}
        />
        <div className="flex-1 bg-white p-6">
          <div className="container mx-auto max-w-2xl">
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                Analysis results are not available for this recording. Please try re-processing or contact support.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        user={user}
        organizations={sidebarOrganizations}
        recordings={recordings}
      />

      {/* Main Content Area */}
      <div className="flex-1 bg-white overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
            <PerformanceHeader recording={{
              id: recording.id,
              title: recording.name,
              duration: recording.duration,
              audioUrl: recording.audioUrl,
              createdAt: recording.createdAt
            }} />

            <div className="grid gap-8 mt-8">
              {/* Audio Player Section */}
              <Card className="p-6 bg-white border-gray-200">
                <AudioPlayer
                  audioUrl={recording.audioUrl.replace("https://9863c39a384de0942d9656f9241489dc.r2.cloudflarestorage.com/crescendai-audio-store/", "https://mp3.liftgate.io/")}
                  duration={recording.duration}
                  onTimeUpdate={handleTimeUpdate}
                  onSeek={handleSeek}
                />
              </Card>

              {/* Feedback Filters */}
              {recording.state === 'processed' && analysisResult && (
                <Card className="p-6 bg-white border-gray-200">
                  <FeedbackFilter
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                </Card>
              )}

              {/* Main Content Tabs */}
              <Tabs defaultValue="timeline" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-[#01172F] border border-[#0471A6]">
                  <TabsTrigger
                    value="timeline"
                    className="text-[#B4D2E7] data-[state=active]:bg-[#0471A6] data-[state=active]:text-white hover:text-[#C3F73A] transition-colors"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="feedback"
                    className="text-[#B4D2E7] data-[state=active]:bg-[#0471A6] data-[state=active]:text-white hover:text-[#C3F73A] transition-colors"
                  >
                    Feedback
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="text-[#B4D2E7] data-[state=active]:bg-[#0471A6] data-[state=active]:text-white hover:text-[#C3F73A] transition-colors"
                  >
                    Analytics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-6">
                  <Card className="p-6 bg-white border-gray-200">
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Performance Timeline</h2>
                      <p className="text-sm text-gray-600 mt-1">Click on markers to view detailed feedback</p>
                    </div>
                    {recording.state === 'processed' && analysisResult ? (
                      <Timeline
                        duration={recording.duration}
                        markers={filteredMarkers}
                        currentTime={currentTime}
                        onSeek={handleSeek}
                        onMarkerClick={handleMarkerClick}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Timeline will be available after analysis is complete</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-6">
                  {recording.state === 'processed' && analysisResult?.temporal_feedback ? (
                    <Card className="p-6 bg-white border-gray-200">
                      <TemporalFeedback
                        feedback={analysisResult.temporal_feedback}
                        onSeek={handleSeek}
                      />
                    </Card>
                  ) : (
                    <Card className="p-6 bg-white border-gray-200">
                      <div className="text-center py-8 text-gray-500">
                        <p>Detailed feedback will be available after analysis is complete</p>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <PerformanceAnalytics
                    markers={feedbackMarkers}
                    advancedFeedback={analysisResult}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Feedback Modal */}
            <FeedbackModal
              isOpen={!!selectedFeedback}
              timestamp={selectedFeedback?.timestamp || 0}
              feedbackItems={selectedFeedback?.items || []}
              onClose={() => setSelectedFeedback(null)}
              onSeek={handleSeek}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
