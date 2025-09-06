
// app/api/audio/metadata/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'No key provided' }, { status: 400 })
    }

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)

    return NextResponse.json({
      success: true,
      data: {
        metadata: response.Metadata || {},
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
      }
    })

  } catch (error) {
    if (error instanceof Error && 'name' in error && error.name === 'NotFound') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    console.error('Metadata error:', error)
    return NextResponse.json(
      { error: 'Failed to get metadata', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
