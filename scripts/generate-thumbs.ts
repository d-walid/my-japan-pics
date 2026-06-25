import sharp from "sharp";
import { mkdir } from 'fs/promises';
import { existsSync } from "fs";
import path from "path";

import { getFolders, getImages } from '@/lib/fs-utils'


const ASSETS_DIR = path.join(process.cwd(), 'assets');
const THUMBS_DIR = path.join(process.cwd(), 'public', 'thumbs');
const THUMB_MAX_SIZE = 800

async function generateThumbs(): Promise<void> {
    const folders = await getFolders(ASSETS_DIR)
    let total = 0
    let skipped = 0
    let processed = 0
    let errors = 0

    for (const folder of folders) {
        const inputFolder = path.join(ASSETS_DIR, folder)
        const outputFolder = path.join(THUMBS_DIR, folder)

        if (!existsSync(outputFolder)) {
            await mkdir(outputFolder, { recursive: true})
        }

        const images = await getImages(inputFolder)
        total += images.length

        for (const image of images) {
            const inputPath = path.join(inputFolder, image)
            const outputPath = path.join(outputFolder, image)

            if (existsSync(outputPath)) {
                skipped++
                continue
            }

            try {
                await sharp(inputPath)
                    .resize({
                        width: THUMB_MAX_SIZE,
                        height: THUMB_MAX_SIZE,
                        fit: 'inside',
                        withoutEnlargement: true,
                    })
                    .jpeg({quality: 82 })
                    .toFile(outputPath)

                processed++
                console.log(`[${processed}] ${folder}/${image}`)
            } catch (err) {
                errors++
                console.error(`ERROR: ${folder}/${image} - ${err}`)
            }
        }
    }

    console.log(`\nDone: ${processed} generated, ${skipped} skipped, ${errors} errors (${total} total)`)
}

generateThumbs()