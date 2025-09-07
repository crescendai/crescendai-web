// pages/api/convert-webm-to-mp3.js
// or app/api/convert-webm-to-mp3/route.js for App Router

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { NextApiRequest, NextApiResponse } from 'next';

// Ensure temp directory exists
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!existsSync(TEMP_DIR)) {
  await mkdir(TEMP_DIR, { recursive: true });
}

// Helper function to run FFmpeg conversion
function convertWebmToMp3(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,           // Input file
      '-vn',                     // Disable video
      '-acodec', 'libmp3lame',   // Use MP3 codec
      '-ab', '192k',             // Audio bitrate
      '-ar', '44100',            // Audio sample rate
      '-y',                      // Overwrite output file
      outputPath                 // Output file
    ]);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}`));
    });
  });
}

// Helper function to clean up files
async function cleanup(...filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      await unlink(filePath);
    } catch (error) {
      // @ts-ignore
      console.warn(`Failed to delete ${filePath}:`, error.message);
    }
  }
}

export async function POST(request: { formData: () => any; }) {
  let inputPath = '';
  let outputPath = '';

  try {
    // Check if FFmpeg is available
    const ffmpegCheck = spawn('ffmpeg', ['-version']);
    await new Promise<void>((resolve, reject) => {
      ffmpegCheck.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('FFmpeg not found. Please install FFmpeg.'));
        } else {
          resolve();
        }
      });
      ffmpegCheck.on('error', () => {
        reject(new Error('FFmpeg not found. Please install FFmpeg.'));
      });
    });

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('webm')) {
      return NextResponse.json(
        { error: 'File must be WebM format' },
        { status: 400 }
      );
    }

    // Generate unique filenames
    const fileId = uuidv4();
    const inputFilename = `${fileId}.webm`;
    const outputFilename = `${fileId}.mp3`;

    inputPath = path.join(TEMP_DIR, inputFilename);
    outputPath = path.join(TEMP_DIR, outputFilename);

    // Convert file to buffer and save to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(inputPath, buffer);

    // Convert WebM to MP3
    await convertWebmToMp3(inputPath, outputPath);

    // Read the converted MP3 file
    const mp3Buffer = await require('fs/promises').readFile(outputPath);

    // Clean up temp files
    await cleanup(inputPath, outputPath);

    // Return the MP3 file
    return new NextResponse(mp3Buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${file.name.replace('.webm', '.mp3')}"`,
      },
    });

  } catch (error) {
    console.error('Conversion error:', error);

    // Clean up any remaining temp files
    await cleanup(inputPath, outputPath);

    // @ts-ignore
    return NextResponse.json(
      { error: `Conversion failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// For Pages Router (alternative implementation)
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Similar implementation as above but using req/res instead of NextRequest/NextResponse
  // You would need to use a library like 'multiparty' or 'formidable' to parse form data

  res.status(501).json({
    error: 'Use the App Router version above for full functionality'
  });
}

// Type definitions for better type safety
interface ConversionError extends Error {
  code?: number;
}

interface ApiResponse {
  error?: string;
  message?: string;
}
