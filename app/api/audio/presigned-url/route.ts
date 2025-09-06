
// app/api/audio/presigned-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    if (!key) {
      return NextResponse.json({ error: 'No key provided' }, { status: 400 })
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl: signedUrl,
        expiresIn,
      }
    })

  } catch (error) {
    console.error('Presigned URL error:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
