'use client'

import { useCallback, useEffect, useState } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import type { Photo } from '@/types/photo'

import FilterPanel from '@/components/FilterPanel'
import PhotoPanel from '@/components/PhotoPanel'
import { usePhotoNavigation } from '@/hooks/usePhotoNavigation'

import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE = 'https://tiles.openFreemap.org/styles/liberty'


// Japan initial view
const INITIAL_VIEW = {
    longitude: 137.0,
    latitude: 37.0,
    zoom: 5.5,
}


export default function JapanMap() {
    const [photos, setPhotos] = useState<Photo[]>([])
    const [selected, setSelected] = useState<Photo | null>(null)
    const [activeFolders, setActiveFolders] = useState<Set<string>>(new Set())
    const [descriptions, setDescriptions] = useState<Record<string, string>>({})

    useEffect(() => {
        fetch('/api/photos')
            .then((r) => r.json())
            .then((data: Photo[]) => {
                setPhotos(data)
                // All folders active by default once photos are loaded
                setActiveFolders(new Set(data.map((p) => p.folder)))
            })

        fetch('/api/descriptions').then((r) => r.json()).then(setDescriptions)
    }, [])

    const folders = [...new Set(photos.map((p) => p.folder))].sort()

    // Toggles a folder's visibily in the filter
    const toggleFolder = useCallback((folder: string) => {
        setActiveFolders((prev) => {
            const next = new Set(prev)
            next.has(folder) ? next.delete(folder) : next.add(folder)
            return next
        })
    }, [])

    const toggleAll = useCallback(() => {
        const allActive = folders.every((f) => activeFolders.has(f))
        setActiveFolders(allActive ? new Set() : new Set(folders))
    }, [folders, activeFolders])

    const visiblePhotos = photos.filter((p) => activeFolders.has(p.folder))
    usePhotoNavigation(visiblePhotos, selected, setSelected)

    // Save the description written in the picture
    const saveDescription = async (description: string) => {
        if (!selected) return
        const key = `${selected.folder}/${selected.filename}`
        await fetch('/api/descriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, description }),
        })
        setDescriptions((prev) => {
            const next = { ...prev }
            if (description.trim() === '') delete next[key]
            else next[key] = description.trim()
            return next
        })
    }

    return (
        <>
            {/* Filter panel - floats above the map */}
            <FilterPanel
                folders={folders}
                activeFolders={activeFolders}
                onToggleFolder={toggleFolder}
                onToggleAll={toggleAll}
            />

            <Map
                initialViewState={INITIAL_VIEW}
                style={{ width: '100%', height: '100vh' }}
                mapStyle={MAP_STYLE}
                onClick={() => setSelected(null)}
                keyboard={false}
            >
                <NavigationControl position='bottom-right' />

                {visiblePhotos.map((photo) => (
                    <Marker
                        key={`${photo.folder}-${photo.filename}`}
                        longitude={photo.lng}
                        latitude={photo.lat}
                        anchor='bottom'
                    >
                        <div
                            className={`w-3 h-3 rounded-full border-2 border-white cursor-pointer shadow-md transition-transform hover:scale-125 ${
                                selected?.folder === photo.folder && selected?.filename === photo.filename
                                    ? 'bg-blue-600 scale-125'
                                    : 'bg-red-500'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelected(photo)
                            }}
                        />
                    </Marker>
                ))}
            </Map>

            {selected && (
                <PhotoPanel
                    photo={selected}
                    description={descriptions[`${selected.folder}/${selected.filename}`] ?? ''}
                    onClose={() => setSelected(null)}
                    onSaveDescription={saveDescription}
                />
            )}
        </>
    )
}
