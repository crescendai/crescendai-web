// app/recordings/[id]/components/performance-analytics.tsx
"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Lightbulb, BookOpen } from "lucide-react"
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "./feedback-filter"
import { FeedbackItem, formatDimensionName } from "@/lib/types/feedback-item"
import type { AnalysisResultData } from "@/lib/piano-analysis"

interface PerformanceAnalyticsProps {
  markers: FeedbackItem[]
  advancedFeedback?: AnalysisResultData | null
}

export function PerformanceAnalytics({ markers, advancedFeedback }: PerformanceAnalyticsProps) {
  // Calculate performance metrics
  const calculateMetrics = () => {
    if (markers.length === 0) {
      return {
        overallScore: 0,
        positiveMarkers: 0,
        negativeMarkers: 0,
        improvementAreas: [],
        strengths: [],
        categoryScores: {},
      }
    }

    const totalMarkers = markers.length
    const positiveMarkers = markers.filter((m) => m.score >= 0.8).length
    const negativeMarkers = totalMarkers - positiveMarkers
    const overallScore = markers.reduce((sum, m) => sum + m.score, 0) / totalMarkers

    // Calculate category scores
    const categoryScores: Record<FeedbackCategory, number> = {} as Record<FeedbackCategory, number>

    Object.entries(FEEDBACK_CATEGORIES).forEach(([category, dimensions]) => {
      const categoryKey = category as FeedbackCategory
      // @ts-ignore
      const categoryMarkers = markers.filter(m =>
        dimensions.includes(m.dimension as string)
      )
      categoryScores[categoryKey] = categoryMarkers.length > 0
        ? categoryMarkers.reduce((sum, m) => sum + m.score, 0) / categoryMarkers.length
        : 0
    })

    // Find improvement areas (lowest scores)
    const improvementAreas = Object.entries(categoryScores)
      .filter(([_, score]) => score < 0.8)
      .sort(([_, a], [__, b]) => a - b)
      .slice(0, 3)
      .map(([category]) => category)

    // Find strengths (highest scores)
    const strengths = Object.entries(categoryScores)
      .filter(([_, score]) => score >= 0.8)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    return {
      overallScore,
      positiveMarkers,
      negativeMarkers,
      improvementAreas,
      strengths,
      categoryScores,
    }
  }

  const metrics = calculateMetrics()

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-700"
    return "text-red-700"
  }

  return (
    <div className="space-y-6">
      {advancedFeedback ? (
        <>
          {/* Performance Character */}
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#0471A6]" />
              <h3 className="text-xl font-semibold text-gray-900">Performance Character</h3>
            </div>
            <p className="text-gray-600">{advancedFeedback.overall_assessment.performance_character}</p>
          </Card>

          {/* Strengths and Priorities */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Award className="w-5 h-5 text-green-700" />
                Key Strengths
              </h3>
              <div className="space-y-3">
                {advancedFeedback.overall_assessment.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-700 mt-2" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Priority Areas */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <AlertTriangle className="w-5 h-5 text-red-700" />
                Priority Areas
              </h3>
              <div className="space-y-3">
                {advancedFeedback.overall_assessment.priority_areas.map((area, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-700 mt-2" />
                    <span className="text-sm text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Practice Recommendations */}
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-semibold text-gray-900">Immediate Practice Priorities</h3>
            </div>
            <div className="space-y-6">
              {advancedFeedback.practice_recommendations.immediate_priorities.map((priority, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-lg text-gray-900">{priority.skill_area}</h4>
                  <p className="text-sm text-gray-600 mt-1">{priority.specific_exercise}</p>
                  <Badge variant="outline" className="mt-2 bg-[#0471A6]/10 text-[#0471A6] border-[#0471A6]/20">
                    Expected outcome: {priority.expected_outcome}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Long-term Development */}
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Long-term Development</h3>
            </div>
            <div className="space-y-6">
              {advancedFeedback.practice_recommendations.long_term_development.map((dev, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-lg text-gray-900">{dev.musical_aspect}</h4>
                  <p className="text-sm text-gray-600 mt-1">{dev.development_approach}</p>
                  <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-600 border-blue-500/20">
                    Repertoire: {dev.repertoire_suggestions}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Encouragement */}
          <Card className="p-6 bg-gradient-to-r from-[#0471A6]/10 to-[#0471A6]/5 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#0471A6]" />
              <h3 className="text-xl font-semibold text-gray-900">Encouragement</h3>
            </div>
            <p className="text-gray-600 italic">{advancedFeedback.encouragement}</p>
          </Card>
        </>
      ) : (
        <>
          {/* Overall Performance */}
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                <Target className="w-5 h-5 text-green-700" />
                Overall Performance
              </h3>
              <div className="flex items-center gap-2">
                {metrics.overallScore >= 0.8 ? (
                  <TrendingUp className="w-5 h-5 text-green-700" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-700" />
                )}
                <span className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{metrics.positiveMarkers}</div>
                <div className="text-sm text-gray-600">Strengths</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">{metrics.negativeMarkers}</div>
                <div className="text-sm text-gray-600">Improvements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{markers.length}</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </div>
            </div>

            <Progress
              value={metrics.overallScore * 100}
              className={`h-3 ${metrics.overallScore >= 0.8 ? "bg-green-200" : "bg-red-200"}`}
            />
          </Card>

          {/* Category Breakdown */}
          <Card className="p-6 bg-white border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Performance by Category</h3>
            <div className="space-y-4">
              {Object.entries(metrics.categoryScores).map(([category, score]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize text-gray-900">{category.replace("_", " ")}</span>
                    <div className="flex items-center gap-2">
                      {score >= 0.8 ? (
                        <TrendingUp className="w-4 h-4 text-green-700" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-700" />
                      )}
                      <span className={`font-bold ${getScoreColor(score)}`}>{score.toFixed(2)}</span>
                    </div>
                  </div>
                  <Progress
                    value={score * 100}
                    className={`h-2 ${score >= 0.8 ? "bg-green-200" : "bg-red-200"}`}
                  />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
