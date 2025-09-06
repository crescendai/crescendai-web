// Shared FeedbackItem interface for components
export interface FeedbackItem {
  id: number
  timestamp: number
  dimension: string
  score: number
  feedbackText: string
  severity: "positive" | "negative"
  score_reference?: Record<string, number>
}

// Helper function to convert UI-friendly dimension names to technical keys
export const formatDimensionKey = (uiName: string): string => {
  const keyMap: Record<string, string> = {
    "Tonal Brightness": "timbre_bright_dark",
    "Articulation Firmness": "articulation_soft_cushioned_hard_solid",
    "Dynamic Sophistication": "dynamic_sophisticated_mellow_raw_crude",
    "Pedal Saturation": "pedal_sparse_dry_saturated_wet",
    "Pedal Clarity": "pedal_clean_blurred",
    "Rhythmic Stability": "timing_stable_unstable",
    "Emotional Energy": "emotion_mood_low_energy_high_energy",
    "Musical Pacing": "music_making_fast_paced_slow_paced"
  }
  
  return keyMap[uiName] || uiName.toLowerCase().replace(/\s+/g, '_')
}

// Helper function to convert technical keys to UI-friendly dimension names
export const formatDimensionName = (technicalKey: string): string => {
  const nameMap: Record<string, string> = {
    "timbre_bright_dark": "Tonal Brightness",
    "articulation_soft_cushioned_hard_solid": "Articulation Firmness",
    "dynamic_sophisticated_mellow_raw_crude": "Dynamic Sophistication",
    "pedal_sparse_dry_saturated_wet": "Pedal Saturation",
    "pedal_clean_blurred": "Pedal Clarity",
    "timing_stable_unstable": "Rhythmic Stability",
    "emotion_mood_low_energy_high_energy": "Emotional Energy",
    "music_making_fast_paced_slow_paced": "Musical Pacing"
  }
  
  return nameMap[technicalKey] || technicalKey.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}
