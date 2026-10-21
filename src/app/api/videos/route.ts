import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

import { getFolders, getVideos } from "@/lib/fs-utils";
import type { Video } from "@/types/photo";

const ASSETS_DIR = path.join(process.cwd(), "assets")
const COORDINATES_FILE = path.join(process.cwd(), "data", "video-coordinates.json")

type Coordinates = Record<string, { lat: number, lng: number }>

// Phone videos are named VID_YYYYMMDD_HHMMSS.mp4 (local time of the phone)
function parseTakenAt(filename: string): string | null {
    const match = /^VID_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\./.exec(filename)
    if (!match) return null

    const [year, month, day, hour, minute, second] = match.slice(1).map(Number)
    // Local-time constructor (month is 0-based), same behaviour as exifr for the photos
    return new Date(year, month - 1, day, hour, minute, second).toISOString()
}

export async function GET() {
    let coordinates: Coordinates

    try {
        coordinates = JSON.parse(await readFile(COORDINATES_FILE, 'utf-8'))
    } catch (error) {
        console.error('Could not read video-coordinates.json', error)
        return NextResponse.json([])
    }

    const videos: Video[] = []

    for (const folder of await getFolders(ASSETS_DIR)) {
        const filenames = await getVideos(path.join(ASSETS_DIR, folder))

        for (const filename of filenames) {
            const position = coordinates[`${folder}/${filename}`]
            const takenAt = parseTakenAt(filename)

            if (!position || !takenAt) {
                console.warn(`Skipping ${folder}/${filename}: no coordinates or unreadable data`)
                continue
            }

            videos.push({
                kind: 'video',
                folder,
                filename,
                lat: position.lat,
                lng: position.lng,
                takenAt
            })
        }
    }

    return NextResponse.json(videos)
}