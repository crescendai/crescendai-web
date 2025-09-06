"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Lightbulb } from "lucide-react"
import type { TemporalFeedback } from "@/lib/types/recording"

interface TemporalFeedbackProps {
  feedback: TemporalFeedback[]
  onSeek?: (time: number) => void
}

export function TemporalFeedback({ feedback, onSeek }: TemporalFeedbackProps) {
  // Helper function to convert timestamp string (e.g., "0:00-0:03") to seconds
  const getStartTimeInSeconds = (timestamp: string): number => {
    const start = timestamp.split("-")[0]
    const [minutes, seconds] = start.split(":").map(Number)
    return minutes * 60 + seconds
  }

  // Calculate average score for a feedback item
  const getAverageScore = (insights: Array<{score_reference: Record<string, number>}>) => {
    const allScores = insights.flatMap(insight => Object.values(insight.score_reference))
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length
  }

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Musical":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "Interpretive":
        return "bg-amber-100 text-amber-800 border-amber-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }
  
  // Get border color based on average score
  const getBorderColor = (avgScore: number) => {
    return avgScore >= 0.8 ? "border-l-primary" : "border-l-red-700"
  }
  
  // Get badge color based on average score
  const getBadgeColor = (avgScore: number) => {
    return avgScore >= 0.8 
      ? "bg-primary/10 text-primary" 
      : "bg-red-700/10 text-red-700"
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
          Feedback
      </h3>

      <div className="space-y-4">
        {feedback.map((item, index) => {
          const avgScore = getAverageScore(item.insights)
          return (
            <Card key={index} className={`p-4 border-l-4 ${getBorderColor(avgScore)}`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => onSeek?.(getStartTimeInSeconds(item.timestamp))}
                  >
                    {item.timestamp}
                  </Badge>
                  <Badge variant="secondary" className={getBadgeColor(avgScore)}>
                    {item.practice_focus}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {item.insights.map((insight, i) => (
                    <div key={i} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={getCategoryColor(insight.category)}>
                          {insight.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Object.entries(insight.score_reference)
                            .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
                            .join(", ")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{insight.observation}</p>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                        <p>{insight.actionable_advice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  )
}
