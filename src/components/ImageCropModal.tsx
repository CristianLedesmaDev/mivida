import { useEffect, useMemo, useState } from 'react'
import { Check, Move, RotateCcw, Sparkles, X, ZoomIn } from 'lucide-react'

type CropImage = {
  src: string
  name: string
} | null

type ImageDimensions = {
  width: number
  height: number
}

type CropModalProps = {
  open: boolean
  image: CropImage
  onClose: () => void
  onSave: (croppedSrc: string) => void
}

type DragState = {
  startX: number
  startY: number
  originX: number
  originY: number
} | null

const VIEWPORT_SIZE = 320
const OUTPUT_SIZE = 900

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const imageElement = new Image()
    imageElement.crossOrigin = 'anonymous'
    imageElement.onload = () => resolve(imageElement)
    imageElement.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    imageElement.src = src
  })

export function ImageCropModal({ open, image, onClose, onSave }: CropModalProps) {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1.08)
  const [dragState, setDragState] = useState<DragState>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open || !image) {
      return
    }

    let active = true
    const imageElement = new Image()
    imageElement.crossOrigin = 'anonymous'
    imageElement.onload = () => {
      if (!active) {
        return
      }

      setDimensions({ width: imageElement.naturalWidth, height: imageElement.naturalHeight })
      setPosition({ x: 0, y: 0 })
      setScale(1.08)
    }
    imageElement.src = image.src

    return () => {
      active = false
    }
  }, [image, open])

  useEffect(() => {
    if (!open) {
      setDragState(null)
    }
  }, [open])

  const metrics = useMemo(() => {
    if (!dimensions) {
      return null
    }

    const baseScale = Math.max(VIEWPORT_SIZE / dimensions.width, VIEWPORT_SIZE / dimensions.height)
    const renderWidth = dimensions.width * baseScale * scale
    const renderHeight = dimensions.height * baseScale * scale

    const minX = Math.min(0, VIEWPORT_SIZE - renderWidth)
    const maxX = Math.max(0, VIEWPORT_SIZE - renderWidth)
    const minY = Math.min(0, VIEWPORT_SIZE - renderHeight)
    const maxY = Math.max(0, VIEWPORT_SIZE - renderHeight)

    const x = clamp(position.x, minX, maxX)
    const y = clamp(position.y, minY, maxY)

    return {
      baseScale,
      renderWidth,
      renderHeight,
      left: (VIEWPORT_SIZE - renderWidth) / 2 + x,
      top: (VIEWPORT_SIZE - renderHeight) / 2 + y,
      x,
      y,
      minX,
      maxX,
      minY,
      maxY,
    }
  }, [dimensions, position.x, position.y, scale])

  const updateFromPointer = (clientX: number, clientY: number) => {
    if (!dragState || !metrics) {
      return
    }

    const nextX = clamp(dragState.originX + (clientX - dragState.startX), metrics.minX, metrics.maxX)
    const nextY = clamp(dragState.originY + (clientY - dragState.startY), metrics.minY, metrics.maxY)

    setPosition({ x: nextX, y: nextY })
  }

  const handleSave = async () => {
    if (!image || !metrics) {
      return
    }

    setIsSaving(true)

    try {
      const sourceImage = await loadImage(image.src)
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('No se pudo crear el canvas')
      }

      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      const scaleFactor = OUTPUT_SIZE / VIEWPORT_SIZE
      context.drawImage(
        sourceImage,
        metrics.left * scaleFactor,
        metrics.top * scaleFactor,
        metrics.renderWidth * scaleFactor,
        metrics.renderHeight * scaleFactor
      )

      onSave(canvas.toDataURL('image/jpeg', 0.85))
    } catch {
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!open || !image) {
    return null
  }

  return (
    <div className="crop-backdrop" role="presentation" onClick={onClose}>
      <div className="crop-modal glass-card" onClick={(event) => event.stopPropagation()}>
        <div className="crop-modal-header">
          <div>
            <span className="panel-label">Recorte</span>
            <h3>{image.name}</h3>
          </div>

          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar recorte">
            <X size={18} />
          </button>
        </div>

        <div className="crop-stage">
          <div
            className="crop-viewport"
            onPointerDown={(event) => {
              if (!metrics) {
                return
              }

              event.currentTarget.setPointerCapture(event.pointerId)
              setDragState({
                startX: event.clientX,
                startY: event.clientY,
                originX: metrics.x,
                originY: metrics.y,
              })
            }}
            onPointerMove={(event) => updateFromPointer(event.clientX, event.clientY)}
            onPointerUp={() => setDragState(null)}
            onPointerCancel={() => setDragState(null)}
          >
            <div className="crop-frame" />
            <img
              src={image.src}
              alt={image.name}
              draggable={false}
              style={{
                width: `${metrics?.renderWidth ?? VIEWPORT_SIZE}px`,
                height: `${metrics?.renderHeight ?? VIEWPORT_SIZE}px`,
                left: `${metrics?.left ?? 0}px`,
                top: `${metrics?.top ?? 0}px`,
              }}
              className={`crop-image ${dragState ? 'dragging' : ''}`}
            />
            <div className="crop-hint">
              <Move size={16} />
              <span>Arrastra la imagen y ajusta el zoom</span>
            </div>
          </div>

          <div className="crop-controls">
            <label className="field-group compact">
              <span>
                <ZoomIn size={14} />
                Zoom
              </span>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.01"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
              />
            </label>

            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setPosition({ x: 0, y: 0 })
                setScale(1.08)
              }}
            >
              <RotateCcw size={16} />
              Reiniciar
            </button>

            <button className="primary-button" type="button" onClick={handleSave} disabled={isSaving}>
              <Check size={16} />
              {isSaving ? 'Guardando...' : 'Guardar recorte'}
            </button>
          </div>

          <div className="crop-note">
            <Sparkles size={14} />
            <span>El recorte queda cuadrado, perfecto para las polaroids.</span>
          </div>
        </div>
      </div>
    </div>
  )
}