export interface Recording {
  id: number
  title: string
  duration: number
  audio_url: string
  created_at: string
  updated_at?: string
}

export interface FeedbackMarker {
  id: number
  recording_id: number
  timestamp: number
  dimension: string
  score: number
  feedback_text: string
  severity: "positive" | "negative" | "neutral"
  created_at: string
  score_reference?: Record<string, number>
}

export interface Insight {
  category: "Technical" | "Musical" | "Interpretive"
  observation: string
  actionable_advice: string
  score_reference: Record<string, number>
}

export interface TemporalFeedback {
  timestamp: string
  insights: Insight[]
  practice_focus: string
}

export interface PracticeRecommendation {
  skill_area: string
  specific_exercise: string
  expected_outcome: string
}

export interface LongTermDevelopment {
  musical_aspect: string
  development_approach: string
  repertoire_suggestions: string
}

export interface OverallAssessment {
  strengths: string[]
  priority_areas: string[]
  performance_character: string
}

export interface PracticeRecommendations {
  immediate_priorities: PracticeRecommendation[]
  long_term_development: LongTermDevelopment[]
}

export interface AdvancedFeedback {
  overall_assessment: OverallAssessment
  temporal_feedback: TemporalFeedback[]
  practice_recommendations: PracticeRecommendations
  encouragement: string
}

export interface RecordingWithFeedback extends Recording {
  feedback_markers?: FeedbackMarker[]
  advanced_feedback: AdvancedFeedback
}
