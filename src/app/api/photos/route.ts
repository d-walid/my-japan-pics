import { NextResponse } from "next/server";
import path from "path";
import exifr from 'exifr';
import { readFile } from 'fs/promises';

import { getFolders, getImages } from "@/lib/fs-utils";
import type { Photo } from "@/types/photo";

const ASSETS_DIR = path.join(process.cwd(), 'assets')

export async function GET() {
    const folders = await getFolders(ASSETS_DIR)
    const photos: Photo[] = []

    for (const folder of folders) {
        const folderPath = path.join(ASSETS_DIR, folder)
        const images = await getImages(folderPath)

        for (const filename of images) {
            const filePath = path.join(folderPath, filename)
            const buffer = await readFile(filePath)
            const exif = await exifr.parse(buffer, {
                gps: true,
                DateTimeOriginal: true
            })

            if (!exif?.latitude || !exif?.longitude) continue

            photos.push({
                folder,
                filename,
                thumbPath: `/thumbs/${folder}/${filename}`,
                lat: exif.latitude,
                lng: exif.longitude,
                takenAt: exif.DateTimeOriginal
                    ? (exif.DateTimeOriginal as Date).toISOString()
                    : undefined,
            })
        }
    }

    return NextResponse.json(photos)
}