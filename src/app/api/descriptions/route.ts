import { NextResponse } from "next/server";
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const DESCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'descriptions.json')

export async function GET() {
    try {
        const content = await readFile(DESCRIPTIONS_FILE, 'utf-8')
        return NextResponse.json(JSON.parse(content))
    } catch {
        return NextResponse.json({})
    }
}

export async function POST(request: Request) {
    const { key, description } = await request.json()

    let descriptions: Record<string, string> = {}
    try {
        const content = await readFile(DESCRIPTIONS_FILE, 'utf-8')
        descriptions  = JSON.parse(content)
    } catch {}

    if (description.trim() === '') {
        delete descriptions[key]
    } else {
        descriptions[key] = description.trim()
    }

    await writeFile(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
}