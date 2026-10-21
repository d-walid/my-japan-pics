import { readdir } from 'fs/promises';


// Returns only the sub-folder names inside a given directory
export async function getFolders(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
}

// Returns only .jpg/.jpeg file names inside a given directory
export async function getImages(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
        .filter((entry) => entry.isFile() && /\.(jpg|jpeg)$/i.test(entry.name))
        .map((entry) => entry.name)
}

// Returns only .mp4 file names inside a given directory
export async function getVideos(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
        .filter((entry) => entry.isFile() && /\.mp4$/i.test(entry.name))
        .map((entry) => entry.name)
}