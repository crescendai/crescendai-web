"use client"

import { Suspense, useState, use, useMemo } from "react"
import { AudioPlayer } from "./components/audio-player"
import { Timeline } from "./components/timeline"
import { PerformanceHeader } from "./components/performance-header"
import { FeedbackModal } from "./components/feedback-modal"
import { FeedbackFilter, type FeedbackCategory, FEEDBACK_CATEGORIES } from "./components/feedback-filter"
import { PerformanceAnalytics } from "./components/performance-analytics"
import { TemporalFeedback } from "./components/temporal-feedback"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRecording } from "@/lib/hooks/use-recording"
import { ReloadIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import type { FeedbackMarker, RecordingWithFeedback } from "@/lib/types/recording"
import { FeedbackItem, formatDimensionKey } from "@/lib/types/feedback-item"

// Helper function to convert FeedbackMarker to FeedbackItem
const mapMarkerToItem = (marker: FeedbackMarker): FeedbackItem => ({
  id: marker.id,
  timestamp: marker.timestamp,
  dimension: marker.dimension,
  score: marker.score,
  feedbackText: marker.feedback_text, // Convert snake_case to camelCase
  severity: marker.severity as "positive" | "negative",
  score_reference: marker.score_reference,
})

// Interface for the component props in PerformanceHeader
interface HeaderRecording {
  id: number
  title: string
  duration: number
  audioUrl: string
  createdAt: string
}

// Helper function to convert RecordingWithFeedback to HeaderRecording
const mapRecordingToHeader = (recording: RecordingWithFeedback): HeaderRecording => ({
  id: recording.id,
  title: recording.title,
  duration: recording.duration,
  audioUrl: recording.audio_url, // Convert snake_case to camelCase
  createdAt: recording.created_at, // Convert snake_case to camelCase
})

interface PageProps {
  params: {
    id: string
  }
}

export default function RecordingDetailsPage({ params }: PageProps) {
  // Access params directly but cast to string to avoid type issues
  const id = String(params.id)
  const { recording, isLoading, error } = useRecording(id)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedFeedback, setSelectedFeedback] = useState<{
    timestamp: number
    items: FeedbackItem[]
  } | null>(null)
  const [activeFilters, setActiveFilters] = useState<FeedbackCategory[]>([])

  // Generate FeedbackItems from advanced_feedback
  const feedbackMarkers = useMemo(() => {
    if (!recording?.advanced_feedback) return []
    
    // Extract feedback items from temporal_feedback
    const items: FeedbackItem[] = []
    let idCounter = 1
    
    recording.advanced_feedback.temporal_feedback.forEach(tf => {
      // Parse timestamp range like "0:00-0:03" to get start time in seconds
      const startTimeStr = tf.timestamp.split('-')[0]
      const [minutes, seconds] = startTimeStr.split(':').map(Number)
      const timestamp = minutes * 60 + seconds
      
      // Create feedback items from insights
      tf.insights.forEach(insight => {
        // Extract first score from score_reference for severity determination
        const scoreValues = Object.values(insight.score_reference)
        const avgScore = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length
        const severity = avgScore >= 0.8 ? "positive" : "negative"
        
        // Get dimension from first key in score_reference
        const dimension = Object.keys(insight.score_reference)[0]
        
        items.push({
          id: idCounter++,
          timestamp,
          dimension: formatDimensionKey(dimension),
          score: avgScore,
          feedbackText: insight.observation,
          severity,
          score_reference: insight.score_reference
        })
      })
    })
    
    return items
  }, [recording?.advanced_feedback])
  

  // Filter markers based on active filters
  const filteredMarkers =
    activeFilters.length > 0
      ? feedbackMarkers.filter((marker) =>
          activeFilters.some((filter) => {
            const categories = FEEDBACK_CATEGORIES[filter]
            return categories.includes(marker.dimension as any as never)
          }),
        )
      : feedbackMarkers

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
    console.log("[v0] Audio time updated:", time)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
    console.log("[v0] Seeking to time:", time)
  }

  const handleMarkerClick = (timestamp: number, feedback: FeedbackItem[]) => {
    setSelectedFeedback({ timestamp, items: feedback })
    console.log("[v0] Marker clicked:", timestamp, feedback)
  }

  const handleFilterChange = (category: FeedbackCategory) => {
    setActiveFilters((prev) => (prev.includes(category) ? prev.filter((f) => f !== category) : [...prev, category]))
  }

  const handleClearFilters = () => {
    setActiveFilters([])
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ReloadIcon className="w-6 h-6 animate-spin" />
          <span>Processing recording...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !recording) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-2xl">
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error || "Recording not found. Please check the URL and try again."}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <PerformanceHeader recording={mapRecordingToHeader(recording)} />

          <div className="grid gap-8 mt-8">
            {/* Audio Player Section */}
            <Card className="p-6 bg-card border-border">
              <AudioPlayer
                audioUrl="https://mp3.liftgate.io/audio/1757195699612_zsdg5x_i-like-your-cut-g-revisited.mp3"
                duration={recording.duration}
                onTimeUpdate={handleTimeUpdate}
                onSeek={handleSeek}
              />
            </Card>

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
                <Card className="p-6 bg-card border-border">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-card-foreground">Performance Timeline</h2>
                    <p className="text-sm text-muted-foreground mt-1">Click on markers to view detailed feedback</p>
                  </div>
                  <Timeline
                    duration={recording.duration}
                    markers={filteredMarkers}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                    onMarkerClick={handleMarkerClick}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-6">
                {recording?.advanced_feedback && (
                  <Card className="p-6 bg-card border-border">
                    <TemporalFeedback 
                      feedback={recording.advanced_feedback.temporal_feedback} 
                      onSeek={handleSeek}
                    />
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <PerformanceAnalytics markers={feedbackMarkers} advancedFeedback={recording?.advanced_feedback} />
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
  )
}
