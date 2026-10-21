interface BaseMedia {
    folder: string
    filename: string
    lat: number
    lng: number
}
export interface Photo extends BaseMedia {
    kind: 'photo'
    thumbPath: string
    takenAt?: string
}

export interface Video extends BaseMedia {
    kind: 'video'
    takenAt: string
}


export type Media = Photo | Video