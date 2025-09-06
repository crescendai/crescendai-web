import { Badge } from "@/components/ui/badge"
import { Clock, Music } from "lucide-react"
import { CalendarIcon } from "@radix-ui/react-icons"

interface Recording {
  id: number
  title: string
  duration: number
  audioUrl: string
  createdAt: string
}

interface PerformanceHeaderProps {
  recording: Recording
}

export function PerformanceHeader({ recording }: PerformanceHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <Music className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance">{recording.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm">{formatDate(recording.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatDuration(recording.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
          Piano Performance
        </Badge>
        <Badge variant="outline" className="border-border text-muted-foreground">
          AI Analysis Complete
        </Badge>
      </div>
    </div>
  )
}
