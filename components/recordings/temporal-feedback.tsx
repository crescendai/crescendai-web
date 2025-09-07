// app/recordings/[id]/components/temporal-feedback.tsx
"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Lightbulb } from "lucide-react"
import type { TemporalFeedback } from "@/lib/piano-analysis"

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
  const getAverageScore = (insights: Array<{score_reference: string | Record<string, number>}>) => {
    const allScores: number[] = []

    insights.forEach(insight => {
      if (typeof insight.score_reference === 'string') {
        // Parse string format like "pedal_clean_blurred: 1.0"
        try {
          const parts = insight.score_reference.split(':')
          if (parts.length === 2) {
            const score = parseFloat(parts[1].trim())
            if (!isNaN(score)) {
              allScores.push(score)
            }
          }
        } catch (error) {
          console.error('Error parsing score_reference string:', error)
        }
      } else if (typeof insight.score_reference === 'object' && insight.score_reference !== null) {
        allScores.push(...Object.values(insight.score_reference))
      }
    })

    return allScores.length > 0
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      : 0.5
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
    return avgScore >= 0.8 ? "border-l-[#0471A6]" : "border-l-red-700"
  }

  // Get badge color based on average score
  const getBadgeColor = (avgScore: number) => {
    return avgScore >= 0.8
      ? "bg-[#0471A6]/10 text-[#0471A6] border-[#0471A6]/20"
      : "bg-red-700/10 text-red-700 border-red-700/20"
  }

  // Format score reference for display
  const formatScoreReference = (scoreRef: string | Record<string, number>): string => {
    if (typeof scoreRef === 'string') {
      return scoreRef
    } else if (typeof scoreRef === 'object' && scoreRef !== null) {
      return Object.entries(scoreRef)
        .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
        .join(", ")
    }
    return ""
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
        <Clock className="w-5 h-5 text-[#0471A6]" />
        Detailed Feedback
      </h3>

      <div className="space-y-4">
        {feedback.map((item, index) => {
          const avgScore = getAverageScore(item.insights)
          return (
            <Card key={index} className={`p-4 border-l-4 ${getBorderColor(avgScore)} bg-white border-gray-200`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-[#0471A6]/20 transition-colors border-[#0471A6]/20 text-[#0471A6]"
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
                    <div key={i} className="space-y-2 border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={getCategoryColor(insight.category)}>
                          {insight.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatScoreReference(insight.score_reference)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{insight.observation}</p>
                      <div className="flex items-start gap-2 text-sm text-gray-600">
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

      {feedback.length === 0 && (
        <Card className="p-8 bg-white border-gray-200">
          <div className="text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No detailed feedback available yet.</p>
            <p className="text-sm mt-1">Analysis results will appear here once processing is complete.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
