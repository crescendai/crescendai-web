"use client"

import { useState, useEffect } from "react"
import type { RecordingWithFeedback } from "@/lib/types/recording"

export function useRecording(recordingId: string) {
  const [recording, setRecording] = useState<RecordingWithFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecording() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/recordings/${recordingId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch recording")
        }

        const data = await response.json()
        setRecording(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (recordingId) {
      fetchRecording()
    }
  }, [recordingId])

  return { recording, isLoading, error }
}
