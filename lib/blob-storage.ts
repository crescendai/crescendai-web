// lib/blob-storage.ts
/**
 * Client-Side Blob Storage Utilities for Audio Files
 *
 * This module provides public-facing functions that interact with
 * Next.js API routes to handle audio file operations with S3-compatible storage.
 */

interface UploadResult {
  url: string
  publicUrl?: string
  key: string
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
  message?: string
}

interface PresignedUrlData {
  presignedUrl: string
  expiresIn: number
}

interface MetadataData {
  metadata: Record<string, string>
  contentType?: string
  contentLength?: number
  lastModified?: string
  etag?: string
}

/**
 * Upload an audio file (MP3) to blob storage
 */
export async function uploadAudioToBlob(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'file')

    const response = await fetch('/api/audio/upload', {
      method: 'POST',
      body: formData,
    })

    const result: ApiResponse<UploadResult> = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Upload failed with status ${response.status}`)
    }

    return result.data!
  } catch (error) {
    console.error('Error uploading audio file:', error)
    throw new Error(`Failed to upload audio file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload a recorded audio blob to storage
 */
export async function uploadRecordingToBlob(audioBlob: Blob, filename: string): Promise<UploadResult> {
  try {
    // Convert Blob to File for consistent handling
    const file = new File([audioBlob], filename, { type: audioBlob.type })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'recording')

    const response = await fetch('/api/audio/upload', {
      method: 'POST',
      body: formData,
    })

    const result: ApiResponse<UploadResult> = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Upload failed with status ${response.status}`)
    }

    return result.data!
  } catch (error) {
    console.error('Error uploading recording:', error)
    throw new Error(`Failed to upload recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload audio with progress tracking
 */
export async function uploadAudioWithProgress(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'file')

    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      try {
        const result: ApiResponse<UploadResult> = JSON.parse(xhr.responseText)

        if (xhr.status >= 200 && xhr.status < 300 && result.success) {
          resolve(result.data!)
        } else {
          reject(new Error(result.error || `Upload failed with status ${xhr.status}`))
        }
      } catch (error) {
        reject(new Error('Failed to parse upload response'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'))
    })

    xhr.open('POST', '/api/audio/upload')
    xhr.send(formData)
  })
}

/**
 * Generate a shareable link for an audio file
 */
export function generateShareLink(storageUrl: string, audioId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  const shareUrl = `${baseUrl}/shared/${audioId}?src=${encodeURIComponent(storageUrl)}`
  return shareUrl
}

/**
 * Delete an audio file from blob storage
 */
export async function deleteAudioFromBlob(key: string): Promise<void> {
  try {
    const params = new URLSearchParams({ key })

    const response = await fetch(`/api/audio/delete?${params}`, {
      method: 'DELETE',
    })

    const result: ApiResponse = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Delete failed with status ${response.status}`)
    }

    console.log('Successfully deleted audio file:', key)
  } catch (error) {
    console.error('Error deleting audio file:', error)
    throw new Error(`Failed to delete audio file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if a file exists in storage by getting its metadata
 */
export async function checkAudioExists(key: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ key })

    const response = await fetch(`/api/audio/metadata?${params}`)

    if (response.status === 404) {
      return false
    }

    const result: ApiResponse<MetadataData> = await response.json()
    return response.ok && result.success
  } catch (error) {
    console.error('Error checking if audio exists:', error)
    return false
  }
}

/**
 * Get metadata for an audio file
 */
export async function getAudioMetadata(key: string): Promise<MetadataData | null> {
  try {
    const params = new URLSearchParams({ key })

    const response = await fetch(`/api/audio/metadata?${params}`)

    if (response.status === 404) {
      return null
    }

    const result: ApiResponse<MetadataData> = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Failed to get metadata`)
    }

    return result.data!
  } catch (error) {
    console.error('Error getting audio metadata:', error)
    return null
  }
}

/**
 * Batch upload multiple files
 */
export async function uploadMultipleAudioFiles(
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const result = await uploadAudioWithProgress(file, (progress) => {
        onProgress?.(i, progress)
      })
      results.push(result)
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error)
      throw error
    }
  }

  return results
}

/**
 * Get file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate audio file before upload
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg']
  const maxSize = 100 * 1024 * 1024 // 100MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Supported formats: ${validTypes.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${formatFileSize(maxSize)}`
    }
  }

  return { valid: true }
}
