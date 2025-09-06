// app/api/audio/upload/route.ts
// Initialize S3 client for Cloudflare R2 (server-side only)
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://9863c39a384de0942d9656f9241489dc.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET_NAME = 'crescendai-audio-store'
const PUBLIC_URL_BASE = 'https://9863c39a384de0942d9656f9241489dc.r2.cloudflarestorage.com/crescendai-audio-store'

function generateAudioKey(filename: string, prefix: string = 'audio'): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${prefix}/${timestamp}_${randomId}_${sanitizedFilename}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'file' or 'recording'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Generate key based on type
    const prefix = type === 'recording' ? 'recordings' : 'audio'
    const key = generateAudioKey(file.name, prefix)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
      ContentLength: file.size,
      Metadata: {
        'original-filename': file.name,
        'upload-timestamp': new Date().toISOString(),
        'upload-type': type || 'file',
      },
    })

    await s3Client.send(command)

    const publicUrl = `${PUBLIC_URL_BASE}/${key}`

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        publicUrl,
        key,
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
