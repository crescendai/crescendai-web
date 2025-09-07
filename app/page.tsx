"use client"

import { useState, useRef } from "react"
import { MeshGradient, DotOrbit } from "@paper-design/shaders-react"
import { router } from 'next/client';
import { useRouter } from 'next/navigation';

export default function PaperShaderPage() {
  const router = useRouter()
  const [intensity, setIntensity] = useState(1.5)
  const [speed, setSpeed] = useState(1.0)
  const [isInteracting, setIsInteracting] = useState(false)
  const [activeEffect, setActiveEffect] = useState("mesh")
  const [copied, setCopied] = useState(false)
  const [activeKeys, setActiveKeys] = useState<number[]>([])
  const [playingNotes, setPlayingNotes] = useState<string[]>([])
  const [hoveredKey, setHoveredKey] = useState<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }

  const playNote = (note: string) => {
    const audioContext = initAudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Note frequencies (C4 octave)
    const noteFrequencies: { [key: string]: number } = {
      C: 261.63,
      "C#": 277.18,
      D: 293.66,
      "D#": 311.13,
      E: 329.63,
      F: 349.23,
      "F#": 369.99,
      G: 392.0,
      "G#": 415.3,
      A: 440.0,
      "A#": 466.16,
      B: 493.88,
    }

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(noteFrequencies[note] || 440, audioContext.currentTime)
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const handleKeyPress = (keyIndex: number, note: string) => {
    playNote(note)

    setActiveKeys((prev) => [...prev, keyIndex])
    setPlayingNotes((prev) => [...prev, note])

    // Remove active state after animation
    setTimeout(() => {
      setActiveKeys((prev) => prev.filter((k) => k !== keyIndex))
      setPlayingNotes((prev) => prev.filter((n) => n !== note))
    }, 200)
  }

  const pianoKeys = [
    { type: "white", note: "C", index: 0 },
    { type: "black", note: "C#", index: 1 },
    { type: "white", note: "D", index: 2 },
    { type: "black", note: "D#", index: 3 },
    { type: "white", note: "E", index: 4 },
    { type: "white", note: "F", index: 5 },
    { type: "black", note: "F#", index: 6 },
    { type: "white", note: "G", index: 7 },
    { type: "black", note: "G#", index: 8 },
    { type: "white", note: "A", index: 9 },
    { type: "black", note: "A#", index: 10 },
    { type: "white", note: "B", index: 11 },
    { type: "white", note: "C", index: 12 },
    { type: "black", note: "C#", index: 13 },
    { type: "white", note: "D", index: 14 },
    { type: "black", note: "D#", index: 15 },
    { type: "white", note: "E", index: 16 },
  ]

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {activeEffect === "mesh" && (
        <MeshGradient
          className="w-full h-full absolute inset-0"
          colors={["#000000", "#0f0f23", "#1a1a2e", "#16213e", "#ffffff"]}
          speed={speed}
          backgroundColor="#000000"
        />
      )}

      {activeEffect === "dots" && (
        <div className="w-full h-full absolute inset-0 bg-black">
          <DotOrbit
            className="w-full h-full"
            dotColor="#16213e"
            orbitColor="#0f0f23"
            speed={speed}
            intensity={intensity}
          />
        </div>
      )}

      {activeEffect === "combined" && (
        <>
          <MeshGradient
            className="w-full h-full absolute inset-0"
            colors={["#000000", "#0f0f23", "#1a1a2e", "#16213e", "#ffffff"]}
            speed={speed * 0.5}
            wireframe="true"
            backgroundColor="#000000"
          />
          <div className="w-full h-full absolute inset-0 opacity-60">
            <DotOrbit
              className="w-full h-full"
              dotColor="#16213e"
              orbitColor="#0f0f23"
              speed={speed * 1.5}
              intensity={intensity * 0.8}
            />
          </div>
        </>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <div className="absolute top-8 left-8 pointer-events-auto"></div>

        {/* Effect Controls */}
        <div className="absolute bottom-8 left-8 pointer-events-auto"></div>

        {/* Parameter Controls */}
        <div className="absolute bottom-8 right-8 pointer-events-auto space-y-4"></div>

        {/* Status indicator */}
        <div className="absolute top-8 right-8 pointer-events-auto"></div>
      </div>

      {/* Lighting overlay effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 w-32 h-32 bg-gray-800/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: `${3 / speed}s` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-white/2 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: `${2 / speed}s`, animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-20 h-20 bg-gray-900/3 rounded-full blur-xl animate-pulse"
          style={{ animationDuration: `${4 / speed}s`, animationDelay: "0.5s" }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center font-mono mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white/90 mb-4 tracking-wider">CrescendAI</h1>
          <p className="text-lg md:text-xl text-white/60 mb-2">Where AI meets musical mastery</p>
          <p className="text-sm text-white/40">Better than your shitty piano teacher.</p>
        </div>

        <div className="relative mb-8 pointer-events-auto">
          <div className="flex items-end bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
            {/* White keys first */}
            {pianoKeys
              .filter((key) => key.type === "white")
              .map((key) => (
                <button
                  key={key.index}
                  onClick={() => handleKeyPress(key.index, key.note)}
                  onMouseEnter={() => setHoveredKey(key.index)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`
                  relative transition-all duration-150 
                  w-8 h-24 bg-gradient-to-b from-white/95 to-white/85 border border-gray-300/50 rounded-b-lg mx-0.5 shadow-lg
                  ${
                    activeKeys.includes(key.index) || hoveredKey === key.index
                      ? "from-blue-100/90 to-white/70 shadow-xl transform scale-95 translate-y-1"
                      : "hover:from-white to-white/90 hover:shadow-xl hover:transform hover:translate-y-0.5"
                  }
                `}
                >
                  <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-mono font-semibold text-gray-700">
                    {key.note}
                  </span>
                </button>
              ))}

            {/* Black keys positioned absolutely on top */}
            {pianoKeys
              .filter((key) => key.type === "black")
              .map((key, blackIndex) => {
                // Calculate position based on white key positions
                const blackKeyPositions = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13] // Positions relative to white keys
                const position = blackKeyPositions[blackIndex]

                return (
                  <button
                    key={key.index}
                    onClick={() => handleKeyPress(key.index, key.note)}
                    onMouseEnter={() => setHoveredKey(key.index)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className={`
                    absolute transition-all duration-150 z-20
                    w-5 h-16 bg-gradient-to-b from-gray-900 to-black border border-gray-700/50 rounded-b-lg shadow-xl
                    ${
                      activeKeys.includes(key.index) || hoveredKey === key.index
                        ? "from-blue-900/80 to-gray-800 shadow-2xl transform scale-95 translate-y-1"
                        : "hover:from-gray-800 to-gray-900 hover:shadow-2xl hover:transform hover:translate-y-0.5"
                    }
                  `}
                    style={{
                      left: `${24 + (position * 36) - 10}px`, // Adjusted positioning
                      top: "24px",
                    }}
                  >
                    <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-mono font-semibold text-gray-300">
                      {key.note}
                    </span>
                  </button>
                )
              })}
          </div>

          {/* Enhanced Musical Notes Animation */}
          {playingNotes.map((note, index) => (
            <div
              key={`${note}-${index}`}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white/80 font-mono text-lg animate-bounce pointer-events-none"
              style={{
                animationDuration: "0.8s",
                left: `${45 + index * 15}%`,
                textShadow: "0 0 10px rgba(255,255,255,0.5)",
              }}
            >
              ♪ {note}
            </div>
          ))}
        </div>

        <div className="text-center font-mono text-sm text-white/60">
          <div className="mb-4 text-white/40">Experience the future of piano analysis:</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center gap-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm px-12 py-5 rounded-xl border border-white/30 pointer-events-auto shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 mx-auto"
          >
            <span className="text-white font-semibold text-xl">Get Started</span>
            {copied ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-400">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
                <path d="M13 3l3.293 3.293-7 7 1.414 1.414 7-7L21 11V3z" />
                <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs font-mono text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400/50 rounded-full animate-pulse"></span>
            Real-time analysis
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 bg-purple-400/50 rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></span>
            AI-powered feedback
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400/50 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></span>
            Performance insights
          </div>
        </div>
      </div>
    </div>
  )
}
