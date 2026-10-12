import { useEffect, useMemo } from 'react';
import type { Photo } from '@/types/photo'


export function usePhotoNavigation(
    photos: Photo[],
    selected: Photo | null,
    onNavigate: (photo: Photo) => void
) {
    const orderedPhotos = useMemo(() => {
        return [...photos].sort((a, b) => {
            if (a.takenAt && b.takenAt) return a.takenAt.localeCompare(b.takenAt)
                return `${a.folder}/${a.filename}`.localeCompare(`${b.folder}/${b.filename}`)
        })
    }, [photos])

    useEffect(() => {
        if (!selected) return

        const handleKey = (e: KeyboardEvent) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return

            // Don't navigate when the user write in the description field
            const target = e.target

            if (
                target instanceof HTMLElement &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable)
            ) return

            const index = orderedPhotos.findIndex(
                (p) => p.folder === selected.folder && p.filename === selected.filename)
                if (index === -1) return

                const nextIndex = e.key === 'ArrowRight'
                    ? (index + 1) % orderedPhotos.length
                    : (index - 1 + orderedPhotos.length) % orderedPhotos.length

                onNavigate(orderedPhotos[nextIndex])
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [selected, orderedPhotos, onNavigate])
}