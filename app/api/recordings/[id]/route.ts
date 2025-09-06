import { type NextRequest, NextResponse } from "next/server"
import { mockRecording } from "@/lib/data/mock-data"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Convert params.id to string explicitly to avoid the Next.js warning
    const id = String(params.id)
    const recordingId = Number.parseInt(id)

    if (isNaN(recordingId)) {
      return NextResponse.json({ error: "Invalid recording ID" }, { status: 400 })
    }

    if (recordingId === 1) {
      return NextResponse.json(mockRecording)
    }

    return NextResponse.json({ error: "Recording not found" }, { status: 404 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
