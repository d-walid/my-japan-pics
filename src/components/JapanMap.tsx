'use client'

import { useCallback, useEffect, useState } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import type { Photo } from '@/types/photo'
import FilterPanel from '@/components/FilterPanel';

import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE = 'https://tiles.openFreemap.org/styles/liberty'


// Format the date for the popup
function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}


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
    const [isEditingDesc, setIsEditingDesc] = useState(false)
    const [descDraft, setDescDraft] = useState('')

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

    // Reset desc edition when the user changes the picture
    useEffect(() => {
        setIsEditingDesc(false)
        setDescDraft('')
    }, [selected])

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

    // Save the description written in the picture
    const saveDescription = async () => {
        if (!selected) return
        const key = `${selected.folder}/${selected.filename}`
        await fetch('/api/descriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({key, description: descDraft }),
        })
        setDescriptions((prev) => {
            const next = {...prev}
            if (descDraft.trim() === '') delete next[key]
            else next[key] = descDraft.trim()
            return next
        })
        setIsEditingDesc(false)
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
                style={{ width: '100%', height: '100vh'}}
                mapStyle={MAP_STYLE}
                onClick={() => setSelected(null)}
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
                                selected?.filename === photo.filename
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

                {selected && (
                    <Popup
                        longitude={selected.lng}
                        latitude={selected.lat}
                        anchor='bottom'
                        closeButton={true}
                        onClose={() => { setSelected(null); }}
                        offset={16}
                        maxWidth='500px'
                    >
                        <div>
                            <div className='px-3 py-2'>
                                {isEditingDesc ? (
                                    <input
                                        autoFocus
                                        type='text'
                                        value={descDraft}
                                        onChange={(e) => setDescDraft(e.target.value)}
                                        onBlur={saveDescription}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveDescription()
                                            if (e.key === 'Escape') setIsEditingDesc(false)
                                        }}
                                        className='w-full text-sm text-black outline-none border-b border-gray-300 focus:border-gray-600'
                                        placeholder='Add a description...'
                                    />
                                ) : (
                                        <p
                                            className='text-sm text-black cursor-text'
                                            onClick={() => {
                                                const key = `${selected.folder}/${selected.filename}`
                                                setDescDraft(descriptions[key] ?? '')
                                                setIsEditingDesc(true)
                                            }}
                                        >
                                            {descriptions[`${selected.folder}/${selected.filename}`] || (
                                                <span className='text-black italic'>Add a description...</span>
                                            )}
                                        </p>
                                )}
                            </div>
                            <div className='relative'>
                                <a
                                    href={`/api/original/${selected.folder}/${selected.filename}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    <img
                                        src={selected.thumbPath}
                                        alt={selected.filename}
                                        className='w-full max-h-[420px] object-contain cursor-zoom-in'
                                    />
                                </a>
                                {selected.takenAt && (
                                    <span className='absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded'>
                                        {formatDate(selected.takenAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </>
    )
}