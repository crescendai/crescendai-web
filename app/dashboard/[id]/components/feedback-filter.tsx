"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cross2Icon } from "@radix-ui/react-icons"

// Feedback dimension categories from the technical spec
export const FEEDBACK_CATEGORIES = {
  timing: ["timing_stable_unstable", "music_making_fast_paced_slow_paced"],
  dynamics: ["dynamic_sophisticated_mellow_raw_crude"],
  technique: ["articulation_soft_cushioned_hard_solid", "pedal_sparse_dry_saturated_wet", "pedal_clean_blurred"],
  expression: ["emotion_mood_low_energy_high_energy"],
  timbre: ["timbre_bright_dark"],
} as const

export type FeedbackCategory = keyof typeof FEEDBACK_CATEGORIES

interface FeedbackFilterProps {
  activeFilters: FeedbackCategory[]
  onFilterChange: (category: FeedbackCategory) => void
  onClearFilters: () => void
}

export function FeedbackFilter({ activeFilters, onFilterChange, onClearFilters }: FeedbackFilterProps) {
  const categoryIcons = {
    timing: "⏱️",
    dynamics: "🔊",
    technique: "🎹",
    expression: "🎭",
    timbre: "🎵",
  }

  const categoryDescriptions = {
    timing: "Rhythmic stability and pacing",
    dynamics: "Dynamic sophistication and control",
    technique: "Articulation and pedal technique",
    expression: "Emotional energy and intensity",
    timbre: "Tonal color and character",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filter Feedback</h3>
        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <Cross2Icon className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(FEEDBACK_CATEGORIES).map(([category, dimensions]) => {
          const isActive = activeFilters.includes(category as FeedbackCategory)
          return (
            <button
              key={category}
              onClick={() => onFilterChange(category as FeedbackCategory)}
              className={`p-3 rounded-lg border transition-all duration-200 text-left hover:scale-105 ${
                isActive ? "bg-primary/20 border-primary text-primary" : "bg-card border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{categoryIcons[category as FeedbackCategory]}</span>
                <span className="font-medium capitalize">{category}</span>
              </div>
              <div className="text-xs text-muted-foreground">{categoryDescriptions[category as FeedbackCategory]}</div>
              <div className="text-xs text-muted-foreground mt-1">{dimensions.length} dimensions</div>
            </button>
          )
        })}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30 cursor-pointer"
              onClick={() => onFilterChange(filter)}
            >
              {filter}
              <Cross2Icon className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
