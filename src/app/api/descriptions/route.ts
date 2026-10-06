import { NextResponse } from "next/server";
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const DESCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'descriptions.json')

// Serializes writes: each POST waits for the previous one to finish
// So two concurrent saves can't overwrite each other
let writeQueue: Promise<unknown> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = writeQueue.then(task)
    writeQueue = result.catch(() => { })
    return result
}

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

    try {
        await enqueue(async () => {
            let descriptions: Record<string, string> = {}

            try {
                const content = await readFile(DESCRIPTIONS_FILE, 'utf-8')
                descriptions = JSON.parse(content)
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                    throw error
                }
            }

            if (description.trim() === '') {
                delete descriptions[key]
            } else {
                descriptions[key] = description.trim()
            }

            await writeFile(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2), 'utf-8')
        })
    } catch (error) {
        console.error('Failed to save description', error)
        return NextResponse.json({ error: 'Could not save description' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}