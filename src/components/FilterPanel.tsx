function formatFolder(folder: string): string {
    return folder
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

interface FilterPanelProps {
    folders: string[]
    activeFolders: Set<string>
    onToggleFolder: (folder: string) => void
    onToggleAll: () => void
}

export default function FilterPanel({ folders, activeFolders, onToggleFolder, onToggleAll }: FilterPanelProps) {

    const allActive = folders.length > 0 && folders.every((f) => activeFolders.has(f))
    return (
        <div className='fixed top-4 left-4 z-10 bg-white/90 rounded-xl shadow-lg p-3 flex flex-col gap-1.5'>
            <div className='flex items-center justify-between mb-1'>
                <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                    Filter
                </p>
                <button
                    onClick={onToggleAll}
                    className='text-xs text-black hover:text-black transition-colors'
                >
                    {allActive ? 'None' : 'All'}
                </button>
            </div>

            {folders.map((folder) => (
                <button
                    key={folder}
                    onClick={() => onToggleFolder(folder)}
                    className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        activeFolders.has(folder)
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                    }`}
                    >
                        {formatFolder(folder)}
                    </button>
            ))}
        </div>
    )
}