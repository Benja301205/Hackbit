import stampUrl from '../assets/hackbit_stamp.png'

const STAMP_WIDTH_PERCENT = 0.35 // 35% of image width
const BRIGHTNESS_THRESHOLD = 80 // Threshold for dark vs light background (0-255)
const QUALITY = 0.8 // JPEG quality
const MAX_WIDTH = 1200 // Reasonable max width for uploads to avoid massive canvas operations

/**
 * Applies the Hackbit stamp to an image file.
 * Returns a Promise that resolves to { blob, meta }.
 */
export async function applyStamp(file) {
    // 1. Load the user image
    const img = await loadImageFromFile(file)

    // 2. Prepare canvas with reasonable dimensions
    // We utilize a similar resizing logic to compressImage to avoid processing massive images
    let width = img.width
    let height = img.height

    if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // Draw original image
    ctx.drawImage(img, 0, 0, width, height)

    // 3. Calculate Stamp Dimensions & Position
    const stampWidth = width * STAMP_WIDTH_PERCENT

    // Load stamp to get aspect ratio
    const stampImgRaw = await loadImageFromUrl(stampUrl)
    const stampAspectRatio = stampImgRaw.height / stampImgRaw.width
    const stampHeight = stampWidth * stampAspectRatio

    // Position: Bottom Right with 5% margin
    const margin = width * 0.05
    const x = width - stampWidth - margin
    const y = height - stampHeight - margin

    // 4. Analyze Brightness at the stamp location
    // Get pixel data from that region
    const imageData = ctx.getImageData(x, y, stampWidth, stampHeight)
    const brightness = calculateAverageBrightness(imageData.data)

    // Decision: Dark background -> White stamp; Light background -> Red stamp
    const isDark = brightness < BRIGHTNESS_THRESHOLD
    const stampColor = isDark ? 'white' : 'red'

    // 5. Create Colored Stamp
    const coloredStamp = await createColoredStamp(stampImgRaw, stampColor)

    // 6. Draw Stamp on main canvas
    if (stampColor === 'red') {
        ctx.globalCompositeOperation = 'multiply' // Simulate ink blend
        ctx.globalAlpha = 0.9
    } else {
        ctx.globalCompositeOperation = 'source-over' // White just sits on top
        // Add shadow for white stamp
        ctx.shadowColor = "rgba(0,0,0,0.5)"
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 2
    }

    ctx.drawImage(coloredStamp, x, y, stampWidth, stampHeight)

    // Reset context
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1.0
    ctx.shadowColor = "transparent"

    // 7. Convert to Blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve({
                        blob,
                        meta: {
                            color: stampColor,
                            aspectRatio: stampAspectRatio
                        }
                    })
                }
                else reject(new Error('Error al generar el sello'))
            },
            'image/jpeg',
            QUALITY
        )
    })
}

// Helpers

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Error al cargar la imagen'))
        }
        img.src = url
    })
}

function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "Anonymous" // Important if assets are served from different origin, though usually local for assets
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

function calculateAverageBrightness(data) {
    let sum = 0
    const step = 4 * 10 // check every 10th pixel for speed
    let count = 0

    for (let i = 0; i < data.length; i += step) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3] || 255

        if (a < 128) continue // ignore transparent pixels

        // Luma formula
        const luma = 0.299 * r + 0.587 * g + 0.114 * b
        sum += luma
        count++
    }

    return count > 0 ? sum / count : 255
}

function createColoredStamp(img, color) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height

    // Draw original
    ctx.drawImage(img, 0, 0)

    // Composite operation to tint
    ctx.globalCompositeOperation = 'source-in'

    if (color === 'white') {
        ctx.fillStyle = '#ffffff'
    } else {
        // HACKBIT Red
        ctx.fillStyle = '#ff3b3b'
    }

    ctx.fillRect(0, 0, canvas.width, canvas.height)

    return new Promise((resolve, reject) => {
        const newImg = new Image()
        newImg.onload = () => resolve(newImg)
        newImg.onerror = reject
        newImg.src = canvas.toDataURL('image/png')
    })
}
