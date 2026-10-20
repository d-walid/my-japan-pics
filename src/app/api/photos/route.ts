import { NextResponse } from "next/server";
import path from "path";
import exifr from 'exifr';
import { open } from 'fs/promises';

import { getFolders, getImages } from "@/lib/fs-utils";
import type { Photo } from "@/types/photo";

const ASSETS_DIR = path.join(process.cwd(), 'assets')
const HEAD_BYTES = 256 * 1024

// EXIF data is stored at the beginning of a JPEG, before the pixels
// Reading only the first 256KB is enough, no need to load the whole file
async function readHead(filePath: string): Promise<Buffer> {
    const file = await open(filePath, 'r')
    try {
        const buffer = Buffer.alloc(HEAD_BYTES)
        const { bytesRead } = await file.read(buffer, 0, HEAD_BYTES, 0)
        return buffer.subarray(0, bytesRead)
    } finally {
        await file.close()
    }
}

// Reads the EXIF of one photo
// Returns null if it has no GPS or can't be read
async function readPhoto(folder: string, filename: string): Promise<Photo | null> {
    try {
        const filePath = path.join(ASSETS_DIR, folder, filename)
        const head = await readHead(filePath)
        const exif = await exifr.parse(head, {
            gps: true,
            DateTimeOriginal: true
        })

        if (!exif?.latitude || !exif?.longitude) return null

        const taken = exif.DateTimeOriginal
        const hasValidDate = taken instanceof Date && !Number.isNaN(
            taken.getTime())

        return {
            kind: 'photo',
            folder,
            filename,
            thumbPath: `/thumbs/${folder}/${filename}`,
            lat: exif.latitude,
            lng: exif.longitude,
            takenAt: hasValidDate ? taken.toISOString() : undefined,
        }
    } catch (error) {
        console.error(`Skipping ${folder}/${filename}: unreadable EXIF`, error)
        return null
    }
}


export async function GET() {
    const folders = await getFolders(ASSETS_DIR)
    const photos: Photo[] = []

    for (const folder of folders) {
        const folderPath = path.join(ASSETS_DIR, folder)
        const images = await getImages(folderPath)

        // Read all the photos of the folder at the same time
        const results = await Promise.all(
            images.map((filename) => readPhoto(folder, filename))
        )

        for (const photo of results) {
            if (photo) photos.push(photo)
        }
    }

    return NextResponse.json(photos)
}