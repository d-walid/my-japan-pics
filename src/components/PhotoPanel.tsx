'use client'

import { useEffect, useState } from 'react'
import type { Media } from '@/types/photo'

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

interface PhotoPanelProps {
    media: Media
    description: string
    onClose: () => void
    onSaveDescription: (description: string) => void
}

export default function PhotoPanel({ media, description, onClose, onSaveDescription }: PhotoPanelProps) {
    const [isEditingDesc, setIsEditingDesc] = useState(false)
    const [descDraft, setDescDraft] = useState('')

    // Reset desc edition when the user changes the picture
    useEffect(() => {
        setIsEditingDesc(false)
        setDescDraft('')
    }, [media])

    const saveDescription = () => {
        onSaveDescription(descDraft)
        setIsEditingDesc(false)
    }

    return (
        <div className='fixed top-4 right-4 z-10 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden max-w-[600px]'>
            <div className='flex items-start justify-between px-3 py-2'>
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
                        className='flex-1 text-sm text-black outline-none border-b border-gray-300 focus:border-gray-600'
                        placeholder='Add a description...'
                    />
                ) : (
                    <p
                        className='flex-1 text-sm text-black cursor-text'
                        onClick={() => {
                            setDescDraft(description)
                            setIsEditingDesc(true)
                        }}
                    >
                        {description || <span className='text-gray-600 italic'>Add a description...</span>}
                    </p>
                )}
                <button
                    onClick={onClose}
                    aria-label='Close'
                    className='ml-2 text-gray-500 hover:text-black'>
                    ✕
                </button>
            </div>
            <div className='relative'>
                {media.kind === 'photo' ? (
                    <a
                        href={`/api/original/${media.folder}/${media.filename}`}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        <img
                            src={media.thumbPath}
                            alt={media.filename}
                            className='max-h-[600px] cursor-zoom-in'
                        />
                    </a>
                ) : (
                    <div className='flex h-[300px] w-[500px] items-center justify-center bg-black text-sm text-white'>
                        Video: {media.filename}
                    </div>
                )}
                {media.takenAt && (
                    <span className='absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded'>
                        {formatDate(media.takenAt)}
                    </span>
                )}
            </div>
        </div>
    )
}
