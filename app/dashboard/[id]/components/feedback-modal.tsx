"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Clock, TrendingUp, TrendingDown, Target } from "lucide-react"
import { FeedbackItem, formatDimensionName } from "@/lib/types/feedback-item"

interface FeedbackModalProps {
  isOpen: boolean
  timestamp: number
  feedbackItems: FeedbackItem[]
  onClose: () => void
  onSeek?: (time: number) => void
}

export function FeedbackModal({ isOpen, timestamp, feedbackItems, onClose, onSeek }: FeedbackModalProps) {
  if (!isOpen || !feedbackItems.length) return null

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDimension = (dimension: string) => {
    return formatDimensionName(dimension)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-700"
    return "text-red-700"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <TrendingUp className="w-4 h-4 text-green-700" />
    return <TrendingDown className="w-4 h-4 text-red-700" />
  }
  
  const getLabelPair = (dimension: string) => {
    // Extract labels based on dimension name
    const dimensionParts = dimension.split('_');
    
    // Default labels
    let leftLabel = "Poor";
    let rightLabel = "Excellent";
    
    // Special handling for dimensions with specific labels in their name
    if (dimension.includes('soft_cushioned_hard_solid')) {
      return (
        <>
          <span>Soft/Cushioned</span>
          <span>Hard/Solid</span>
        </>
      );
    } else if (dimension.includes('sparse_dry_saturated_wet')) {
      return (
        <>
          <span>Sparse/Dry</span>
          <span>Saturated/Wet</span>
        </>
      );
    } else if (dimension.includes('clean_blurred')) {
      return (
        <>
          <span>Blurred</span>
          <span>Clean</span>
        </>
      );
    } else if (dimension.includes('stable_unstable')) {
      return (
        <>
          <span>Unstable</span>
          <span>Stable</span>
        </>
      );
    } else if (dimension.includes('low_energy_high_energy')) {
      return (
        <>
          <span>Low Energy</span>
          <span>High Energy</span>
        </>
      );
    } else if (dimension.includes('sophisticated_mellow_raw_crude')) {
      return (
        <>
          <span>Raw/Crude</span>
          <span>Sophisticated/Mellow</span>
        </>
      );
    } else if (dimension.includes('bright_dark')) {
      return (
        <>
          <span>Dark</span>
          <span>Bright</span>
        </>
      );
    } else if (dimension.includes('fast_paced_slow_paced')) {
      return (
        <>
          <span>Slow Paced</span>
          <span>Fast Paced</span>
        </>
      );
    }
    
    return (
      <>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </>
    );
  }

  const averageScore = feedbackItems.reduce((sum, item) => sum + item.score, 0) / feedbackItems.length
  console.log("feedbackItems:", feedbackItems)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Feedback at {formatTime(timestamp)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              <div>
                <div className="font-semibold">Overall Performance</div>
                <div className="text-sm text-muted-foreground">Average score at this timestamp</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getScoreIcon(averageScore)}
              <span className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>{averageScore.toFixed(2)}</span>
            </div>
          </div>

          {/* Individual Feedback Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detailed Feedback</h3>
            
            {/* Feedback Text as italic quote */}
            {feedbackItems.length > 0 && feedbackItems[0].feedbackText && (
              <blockquote className="italic text-muted-foreground border-l-4 border-primary/30 pl-4 py-2">
                "{feedbackItems[0].feedbackText}"
              </blockquote>
            )}
            
            {feedbackItems.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.severity === "positive" ? "default" : "destructive"}
                      className={
                        item.severity === "positive"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      }
                    >
                      {formatDimension(item.dimension)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getScoreIcon(item.score)}
                    <span className={`font-bold ${getScoreColor(item.score)}`}>{item.score.toFixed(2)}</span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {getLabelPair(item.dimension)}
                  </div>
                  <Progress
                    value={((item.score + 1) / 2) * 100}
                    className={`h-2 ${item.score >= 0.8 ? "bg-green-200" : "bg-red-200"}`}
                    indicatorClassName={item.score >= 0.8 ? "bg-green-700" : "bg-red-700"}
                  />
                  {item.score_reference && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Object.entries(item.score_reference)
                        .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="hover:bg-transparent !text-white cursor-pointer">
              Close
            </Button>
            <div className="flex gap-2">
              {onSeek && (
                <Button
                  variant="default"
                  onClick={() => {
                    onSeek(timestamp)
                    onClose()
                  }}
                  className="bg-primary hover:bg-primary/90 cursor-pointer"
                >
                  Play from Here
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
