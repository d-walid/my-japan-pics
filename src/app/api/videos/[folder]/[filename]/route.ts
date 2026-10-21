import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";


const ASSETS_DIR = path.join(process.cwd(), 'assets')

type ByteRange = { start: number, end: number }

// Parses a "Range: bytes=start-end" header
// Returns null without header, 'invalid' if the range can't be satisfied
function parseRange(header: string | null, size: number): ByteRange | null | 'invalid' {
    if (!header) return null

    const match = /^bytes=(\d*)-(\d*)$/.exec(header)
    if (!match) return 'invalid'

    const [, startText, endText] = match
    let start: number
    let end: number

    if (startText === '') {
        // "bytes=-500" means the last 500 bytes
        if (endText === '') return 'invalid'
        start = Math.max(size - Number(endText), 0)
        end = size - 1
    } else {
        start = Number(startText)
        end = endText === '' ? size - 1 : Math.min(Number(endText), size - 1)
    }

    if (start > end || start >= size) return 'invalid'
    return { start, end }
}


export async function GET(
    request: Request,
    { params }: {
        params: Promise<{ folder: string; filename: string }>
    }
) {
    const { folder, filename } = await params
    const filePath = path.join(ASSETS_DIR, folder, filename)

    // Refuse any path that escapes the assets directory and anything that isn't an .mp4
    if (!filePath.startsWith(ASSETS_DIR + path.sep) || !/\.mp4$/i.test(filename)) {
        return new NextResponse('Not found', { status: 404 })
    }

    let size: number
    try {
        const info = await stat(filePath)
        if (!info.isFile()) throw new Error('Not a file')
        size = info.size
    } catch {
        return new NextResponse('Not found', { status: 404 })
    }

    const range = parseRange(request.headers.get('range'), size)
    if (range === 'invalid') {
        return new NextResponse(null, {
            status: 416,
            headers: { 'Content-Range': `bytes */${size}` },
        })
    }

    const start = range?.start ?? 0
    const end = range?.end ?? size - 1
    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream

    const headers: Record<string, string> = {
        'Content-Type': 'video/mp4',
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=31536000',
    }
    if (range) headers['Content-Range'] = `bytes ${start}-${end}/${size}`
    return new NextResponse(stream, { status: range ? 206 : 200, headers })
}