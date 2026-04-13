const CLOUDINARY_CLOUD_NAME = 'ddsqbmut8'
const CLOUDINARY_UPLOAD_PRESET = 'JJStrack'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

export async function uploadImageToCloudinary(file) {
    if (!file) return ''
    if (typeof file === 'string') return file

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} ${errorBody}`)
    }

    const data = await response.json()
    return data.secure_url || data.url || ''
}

export async function uploadFilesToCloudinary(items) {
    if (!Array.isArray(items) || items.length === 0) return []

    const flatItems = items.flat(Infinity)
    const urls = await Promise.all(
        flatItems.map((item) => {
            if (!item) return Promise.resolve('')
            const file = item?.file || item
            if (typeof file === 'string') return Promise.resolve(file)
            if (typeof Blob !== 'undefined' && file instanceof Blob) {
                return uploadImageToCloudinary(file)
            }
            console.warn('Cloudinary upload skipped unsupported item:', item)
            return Promise.resolve('')
        })
    )

    return urls.flat(Infinity).filter((url) => typeof url === 'string' && url.trim() !== '')
}
