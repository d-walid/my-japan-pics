import { NextResponse } from "next/server";
import { readFile } from 'fs/promises';
import path from 'path';


const ASSETS_DIR = path.join(process.cwd(), 'assets')

export async function GET(
    request: Request,
    { params }: {
        params: Promise<{ folder: string; filename: string }>
    }
) {
    const { folder, filename } = await params
    const filePath = path.join(ASSETS_DIR, folder, filename)

    // Refuse any path that escapes the assets directory
    if (!filePath.startsWith(ASSETS_DIR + path.sep)) {
        return new NextResponse('Not found', { status: 404 })
    }

    try {
        const buffer = await readFile(filePath)

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'private, max-age=31536000',
            },
        })
    } catch {
        return new NextResponse('Not found', { status: 404 })
    }
}