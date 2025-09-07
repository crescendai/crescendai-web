"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FeedbackItem, formatDimensionName } from "@/lib/types/feedback-item"

interface FeedbackMarkerProps {
  timestamp: number
  severity: "positive" | "negative"
  avgScore: number
  feedbackItems: FeedbackItem[]
  onMarkerClick: (timestamp: number, feedback: FeedbackItem[]) => void
}

export function FeedbackMarker({ timestamp, severity, avgScore, feedbackItems, onMarkerClick }: FeedbackMarkerProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const hoverText = feedbackItems[0]
    ? `${formatDimensionName(feedbackItems[0].dimension)}: ${feedbackItems[0].feedbackText.slice(0, 50)}...${
      feedbackItems[0].score_reference
        ? ` (${Object.entries(feedbackItems[0].score_reference)
          .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
          .join(", ")})`
        : ''
    }`
    : ""

  return (
    <div className="relative">
      <button
        className={cn(
          "w-4 h-4 rounded-full border-2 border-background transition-all duration-200 hover:scale-125 focus:scale-125 focus:outline-none focus:ring-2 focus:ring-ring",
          severity === "positive" ? "bg-primary hover:bg-primary/80" : "bg-destructive hover:bg-destructive/80",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onMarkerClick(timestamp, feedbackItems)}
        aria-label={`Feedback marker at ${formatTime(timestamp)}`}
      >
        <span className="sr-only">
          Score: {avgScore.toFixed(2)} - {hoverText}
        </span>
      </button>
    </div>
  )
}
