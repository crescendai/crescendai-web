import { NextResponse } from "next/server"
import { mockRecording } from "@/lib/data/mock-data"

export async function GET() {
  try {
    const recordings = [mockRecording]
    return NextResponse.json(recordings)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
