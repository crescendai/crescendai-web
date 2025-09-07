// app/recordings/[id]/components/timeline.tsx
"use client"

import React, { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FeedbackItem, formatDimensionName } from "@/lib/types/feedback-item"

interface ProcessedMarker {
  timestamp: number
  severity: "positive" | "negative"
  avgScore: number
  feedbackItems: FeedbackItem[]
}

interface TimelineProps {
  duration: number
  markers: FeedbackItem[]
  currentTime?: number
  onSeek?: (time: number) => void
  onMarkerClick?: (timestamp: number, feedback: FeedbackItem[]) => void
}

export function Timeline({ duration, markers, currentTime = 0, onSeek, onMarkerClick }: TimelineProps) {
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null)

  // Generate marker positions every 2 seconds for 30-second timeline
  const markerPositions = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => (i + 1) * 2)
  }, [])

  // Process markers to aggregate feedback at each position
  const processedMarkers = useMemo(() => {
    return markerPositions
      .map((timestamp) => {
        const feedbackAtTime = markers.filter(
          (m) => Math.abs(m.timestamp - timestamp) < 1.5, // Within 1.5 seconds
        )

        if (feedbackAtTime.length === 0) return null

        // Calculate average score and determine severity
        const avgScore = feedbackAtTime.reduce((sum, f) => sum + f.score, 0) / feedbackAtTime.length
        const severity = avgScore >= 0.8 ? "positive" : "negative"

        return {
          timestamp,
          severity,
          avgScore,
          feedbackItems: feedbackAtTime,
        } as ProcessedMarker
      })
      .filter(Boolean) as ProcessedMarker[]
  }, [markers, markerPositions])

  // Handle timeline click for seeking
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek) return

      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      onSeek(newTime)
    },
    [duration, onSeek],
  )

  // Handle marker click
  const handleMarkerClick = useCallback(
    (e: React.MouseEvent, marker: ProcessedMarker) => {
      e.stopPropagation()
      onMarkerClick?.(marker.timestamp, marker.feedbackItems)
      onSeek?.(marker.timestamp)
    },
    [onMarkerClick, onSeek],
  )

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Timeline Container */}
        <div
          className="relative h-16 bg-gray-100 rounded-lg cursor-pointer group overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex">
            {markerPositions.map((timestamp, index) => (
              <div
                key={timestamp}
                className="flex-1 border-r border-gray-300/20 last:border-r-0"
                style={{ width: `${100 / markerPositions.length}%` }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div
            className="absolute top-0 left-0 h-full bg-[#0471A6]/20 transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 w-0.5 h-full bg-[#0471A6] transition-all duration-150"
            style={{ left: `${progressPercentage}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-[#0471A6] rounded-full" />
          </div>

          {/* Feedback Markers */}
          {processedMarkers.map((marker) => {
            const markerPosition = (marker.timestamp / duration) * 100

            return (
              <Tooltip key={marker.timestamp}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white transition-all duration-200 hover:scale-125 focus:scale-125 focus:outline-none focus:ring-2 focus:ring-[#0471A6]/50",
                      marker.severity === "positive"
                        ? "bg-[#0471A6] hover:bg-[#0471A6]/80"
                        : "bg-red-600 hover:bg-red-600/80",
                    )}
                    style={{ left: `${markerPosition}%`, transform: "translateX(-50%) translateY(-50%)" }}
                    onClick={(e) => handleMarkerClick(e, marker)}
                    onMouseEnter={() => setHoveredMarker(marker.timestamp)}
                    onMouseLeave={() => setHoveredMarker(null)}
                  >
                    <span className="sr-only">Feedback marker at {formatTime(marker.timestamp)}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-white border-gray-200">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">
                      {formatTime(marker.timestamp)} - Score: {marker.avgScore.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDimensionName(marker.feedbackItems[0]?.dimension || "")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {marker.feedbackItems[0]?.feedbackText?.slice(0, 80)}
                      {(marker.feedbackItems[0]?.feedbackText?.length || 0) > 80 ? "..." : ""}
                    </div>
                    {marker.feedbackItems[0]?.score_reference && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(marker.feedbackItems[0].score_reference)
                          .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0:00</span>
          <span>0:06</span>
          <span>0:12</span>
          <span>0:18</span>
          <span>0:24</span>
          <span>0:30</span>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0471A6]" />
            <span className="text-gray-600">Positive Feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-gray-600">Areas for Improvement</span>
          </div>
        </div>

        {/* Marker Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-[#0471A6]">
              {processedMarkers.filter((m) => m.severity === "positive").length}
            </div>
            <div className="text-xs text-gray-600">Strengths</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">
              {processedMarkers.filter((m) => m.severity === "negative").length}
            </div>
            <div className="text-xs text-gray-600">Improvements</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {processedMarkers.length > 0
                ? (processedMarkers.reduce((sum, m) => sum + m.avgScore, 0) / processedMarkers.length).toFixed(1)
                : "0.0"}
            </div>
            <div className="text-xs text-gray-600">Avg Score</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-700">{markers.length}</div>
            <div className="text-xs text-gray-600">Total Feedback</div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
