"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, TrendingUp } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { CalendarIcon } from "@radix-ui/react-icons"

interface Recording {
  id: string
  title: string
  piece_name: string
  composer: string
  duration: number
  created_at: string
  overall_score: number
  audio_url: string
}

export default function DashboardPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await fetch("/api/recordings")
        if (response.ok) {
          const data = await response.json()
          setRecordings(data)
        }
      } catch (error) {
        console.error("Failed to fetch recordings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecordings()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-700 border-green-500/30"
    if (score >= 60) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
    return "bg-red-500/20 text-red-700 border-red-500/30"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Your Recordings</h1>
            <p className="text-muted-foreground mt-2">Analyze your piano performances with AI-powered feedback</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Recordings</h1>
          <p className="text-muted-foreground mt-2">Analyze your piano performances with AI-powered feedback</p>
        </div>

        {recordings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
              <p className="text-muted-foreground mb-4">Start by uploading your first piano performance</p>
              <Button>Upload Recording</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recordings.map((recording) => (
              <Card key={recording.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {recording.piece_name}
                      </CardTitle>
                      <CardDescription className="mt-1">by {recording.composer}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`ml-2 ${getScoreColor(recording.overall_score)}`}>
                      {recording.overall_score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(recording.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{new Date(recording.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>AI Analysis Complete</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href={`/dashboard/${recording.id}`}>
                      <Button className="w-full bg-transparent" variant="outline">
                        View Analysis
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
