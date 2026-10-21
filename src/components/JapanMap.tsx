'use client'

import { useCallback, useEffect, useState } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import type { Media } from '@/types/photo'

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

function loadJson(url: string) {
    return fetch(url).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
    })
}

export default function JapanMap() {
    const [media, setMedia] = useState<Media[]>([])
    const [selected, setSelected] = useState<Media | null>(null)
    const [activeFolders, setActiveFolders] = useState<Set<string>>(new Set())
    const [descriptions, setDescriptions] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)

    useEffect(() => {
        Promise.all([
            loadJson('/api/photos'),
            loadJson('/api/videos').catch((err) => {
                console.error('Could not load videos', err)
                return []
            })
        ])
            .then(([photos, videos]: Media[][]) => {
                const all = [...photos, ...videos]
                setMedia(all)
                setActiveFolders(new Set(all.map((m) => m.folder)))
            })
            .catch((err) => {
                console.error('Could not load photos', err)
                setLoadError('Could not load the photos. Reload the page and try again.')
            })
            .finally(() => setIsLoading(false))

        // Descriptions are optional: the map stays usable if they fail to load
        fetch('/api/descriptions')
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then(setDescriptions)
            .catch((err) => console.error('Could not load descriptions', err))
    }, [])

    const folders = [...new Set(media.map((p) => p.folder))].sort()
    const visibleMedia = media.filter((m) => activeFolders.has(m.folder))
    usePhotoNavigation(visibleMedia, selected, setSelected)

    // Toggles a folder's visibility in the filter
    const toggleFolder = useCallback((folder: string) => {
        setActiveFolders((prev) => {
            const next = new Set(prev)
            if (next.has(folder)) {
                next.delete(folder)
            } else {
                next.add(folder)
            }
            return next
        })
    }, [])

    const toggleAll = useCallback(() => {
        const allActive = folders.every((f) => activeFolders.has(f))
        setActiveFolders(allActive ? new Set() : new Set(folders))
    }, [folders, activeFolders])

    // Save the description written in the picture
    const saveDescription = async (description: string) => {
        if (!selected) return
        const key = `${selected.folder}/${selected.filename}`

        try {
            const res = await fetch('/api/descriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, description }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
        } catch (err) {
            console.error('Could not save description', err)
            setSaveError('Could not save the description.')
            setTimeout(() => setSaveError(null), 4000)
            return
        }

        setDescriptions((prev) => {
            const next = { ...prev }
            if (description.trim() === '') delete next[key]
            else next[key] = description.trim()
            return next
        })
    }

    const errorMessage = loadError ?? saveError

    return (
        <>
            {/* Filter panel - floats above the map */}
            <FilterPanel
                folders={folders}
                activeFolders={activeFolders}
                onToggleFolder={toggleFolder}
                onToggleAll={toggleAll}
            />

            {/* Loading/error message - floats at the top center*/}
            {(isLoading || errorMessage) && (
                <div
                    className='fixed top-4 left-1/2 -translate-x-1/2 z-10 rounded-xl bg-white px-4 py-2 text-sm shadow-lg'>
                    {errorMessage ? (
                        <span className='text-red-600'>{errorMessage}</span>
                    ) : (
                        'Loading photos...'
                    )}
                </div>
            )}

            <Map
                initialViewState={INITIAL_VIEW}
                style={{ width: '100%', height: '100vh' }}
                mapStyle={MAP_STYLE}
                onClick={() => setSelected(null)}
                keyboard={false}
            >
                <NavigationControl position='bottom-right' />

                {visibleMedia.map((item) => {
                    const isSelected = selected?.folder === item.folder && selected?.filename === item.filename
                    const shape = 'rounded-full'
                    let color = item.kind === 'video' ? 'bg-violet-600' : 'bg-red-500'
                    if (isSelected) color = 'bg-blue-600 scale-125'

                    return (
                        <Marker
                            key={`${item.folder}-${item.filename}`}
                            longitude={item.lng}
                            latitude={item.lat}
                            anchor='bottom'
                        >
                            <div
                                className={`w-3 h-3 border-2 border-white cursor-pointer shadow-md
                                            transition-transform hover:scale-125 ${shape} ${color}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelected(item)
                                }}
                            />
                        </Marker>
                    )
                })}
            </Map>

            {selected && (
                <PhotoPanel
                    media={selected}
                    description={descriptions[`${selected.folder}/${selected.filename}`] ?? ''}
                    onClose={() => setSelected(null)}
                    onSaveDescription={saveDescription}
                />
            )}
        </>
    )
}
