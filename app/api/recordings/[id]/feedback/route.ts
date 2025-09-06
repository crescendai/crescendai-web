import { type NextRequest, NextResponse } from "next/server"
import { mockRecording } from "@/lib/data/mock-data"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const recordingId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const dimensions = searchParams.get("dimensions")?.split(",") || []

    if (isNaN(recordingId)) {
      return NextResponse.json({ error: "Invalid recording ID" }, { status: 400 })
    }

    const feedback = mockRecording.feedback_markers.filter(
      (marker) => dimensions.length === 0 || dimensions.includes(marker.dimension),
    )

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
