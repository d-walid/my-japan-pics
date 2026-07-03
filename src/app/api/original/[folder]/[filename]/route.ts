import { NextResponse } from "next/server";
import { readFile } from 'fs/promises';
import path from 'path';
import { cp } from "fs";

const ASSETS_DIR = path.join(process.cwd(), 'assets')

export async function GET(
    request: Request,
    { params }: {
        params: Promise<{ folder: string; filename: string }> }
) {
    const { folder, filename } = await params
    const filePath = path.join(ASSETS_DIR, folder, filename)
    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
        headers: {
            'Content-Type' : 'image/jpeg',
            'Cache-Control': 'private, max-age=31536000',
        },
    })
}