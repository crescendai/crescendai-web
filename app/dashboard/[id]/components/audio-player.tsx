"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  audioUrl: string
  duration: number
  onTimeUpdate?: (currentTime: number) => void
  onSeek?: (time: number) => void
}

export function AudioPlayer({ audioUrl, duration, onTimeUpdate, onSeek }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [audioDuration, setAudioDuration] = useState(duration)

  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }, [])

  // Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error)
      })
    }
  }, [isPlaying])

  // Seek functionality
  const handleSeek = useCallback(
    (newTime: number) => {
      if (!audioRef.current) return
      
      const clampedTime = Math.max(0, Math.min(newTime, audioDuration))
      audioRef.current.currentTime = clampedTime
      setCurrentTime(clampedTime)
      onSeek?.(clampedTime)
    },
    [audioDuration, onSeek],
  )

  // Progress bar click handler
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !audioRef.current) return

      const rect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * audioDuration
      handleSeek(newTime)
    },
    [audioDuration, handleSeek],
  )

  // Skip forward/backward
  const skipForward = () => handleSeek(Math.min(currentTime + 10, audioDuration))
  const skipBackward = () => handleSeek(Math.max(currentTime - 10, 0))

  // Volume control
  const handleVolumeChange = (newVolume: number[]) => {
    if (!audioRef.current) return
    
    const vol = newVolume[0]
    audioRef.current.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    
    const newMutedState = !isMuted
    audioRef.current.muted = newMutedState
    setIsMuted(newMutedState)
  }

  // Playback speed control
  const handleSpeedChange = (speed: number) => {
    if (!audioRef.current) return
    
    audioRef.current.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      const newTime = audio.currentTime
      setCurrentTime(newTime)
      onTimeUpdate?.(newTime)
    }
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration)
      }
    }
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onTimeUpdate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return

      switch (e.code) {
        case "Space":
          e.preventDefault()
          togglePlayPause()
          break
        case "ArrowLeft":
          e.preventDefault()
          skipBackward()
          break
        case "ArrowRight":
          e.preventDefault()
          skipForward()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [togglePlayPause])

  // Progress percentage
  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5]

  return (
    <div className="space-y-4">
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
            setAudioDuration(e.currentTarget.duration)
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          ref={progressRef}
          className="relative h-2 bg-muted rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ left: `${progressPercentage}%`, transform: "translateX(-50%) translateY(-50%)" }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center gap-1">
          {speedOptions.map((speed) => (
            <Button
              key={speed}
              variant="ghost"
              size="sm"
              onClick={() => handleSpeedChange(speed)}
              className={cn(
                "text-xs px-2 py-1 h-auto",
                playbackSpeed === speed ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {speed}x
            </Button>
          ))}
        </div>

        {/* Center - Playback Speed */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipBackward}
            className="text-muted-foreground hover:text-foreground"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={skipForward}
            className="text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Right Controls - Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.1}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
