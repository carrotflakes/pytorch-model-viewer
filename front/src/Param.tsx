import { useEffect, useMemo, useRef, useState } from "react"
import './Param.css'

const cache = new Map<string, Float32Array>()

export function Param({ modelName, meta }: { modelName: string, meta: { name: string, shape: number[], type: string } }) {
  const paramPath = `${modelName}/${meta.name}`
  const [value, setValue] = useState<Float32Array | null>(null)
  const [scale, setScale] = useState(1)
  const [vScale, setVScale] = useState(1)

  useEffect(() => {
    const cached = cache.get(paramPath) ?? null
    setValue(cached)

    if (cached) {
      return
    }

    fetch(`/models/${modelName}/params/${meta.name}`)
      .then((res) => res.blob())
      .then((data) => {
        const reader = new FileReader()
        reader.onload = () => {
          const array = new Float32Array(reader.result as ArrayBuffer)
          cache.set(paramPath, array)
          setValue(array)
        }
        reader.readAsArrayBuffer(data)
      })
  }, [meta.name, modelName, paramPath])

  const minMax = useMemo(() => {
    if (!value)
      return null

    let min = value[0]
    let max = value[0]
    for (let i = 1; i < value.length; i++) {
      min = Math.min(min, value[i])
      max = Math.max(max, value[i])
    }
    return { min, max }
  }, [value])

  const [pos, setPos] = useState<{ x: number, y: number } | null>(null)

  return (
    <div className="Param">
      <div>{meta.name} {JSON.stringify(meta.shape)} type: {meta.type}</div>
      <div>min: {minMax?.min} max: {minMax?.max}</div>
      <input type='range' min='1' max='10' value={scale} onChange={(e) => setScale(parseInt(e.target.value))} />
      <input type='range' min='1' max='10' value={vScale} onChange={(e) => setVScale(parseInt(e.target.value))} />
      <br />
      {
        value && (
          <TensorCanvas shape={meta.shape} data={value} scale={scale} vScale={vScale} onMove={setPos} />
        )
      }
      {
        value && pos && (
          <div className="paramInfo">[{pos.y}, {pos.x}] value: {value[pos.y * meta.shape[1] + pos.x]}</div>
        )
      }
    </div>
  )
}

function TensorCanvas({
  shape, data, scale = 1, vScale = 1, onMove,
}: {
  shape: number[], data: Float32Array, scale?: number, vScale?: number, onMove?: (pos: { x: number, y: number } | null) => void
}) {
  const [h, w] = shape.length === 1 ? [1, shape[0]] : [shape[0], shape.slice(1).reduce((a, b) => a * b)]
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current)
      return

    const ctx = ref.current.getContext('2d')
    if (!ctx)
      return

    let absMax = 0.e-10
    for (let i = 0; i < data.length; i++)
      absMax = Math.max(absMax, Math.abs(data[i]))

    const imgData = ctx.createImageData(w, h)
    for (let i = 0; i < data.length; i++) {
      const p = Math.max(0.0, data[i]) / absMax
      const n = Math.max(0.0, -data[i]) / absMax
      imgData.data[i * 4] = 255 * Math.min(1, p * vScale)
      imgData.data[i * 4 + 1] = 255 * Math.min(1, Math.max(0, p * vScale - 1, n * vScale - 1))
      imgData.data[i * 4 + 2] = 255 * Math.min(1, n * vScale)
      imgData.data[i * 4 + 3] = 255
    }
    ctx.putImageData(imgData, 0, 0)
  }, [shape, data, w, h, vScale])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!onMove || !ref.current)
        return

      const borderSize = 4
      const rect = ref.current.getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left - borderSize) / scale)
      const y = Math.floor((e.clientY - rect.top - borderSize) / scale)
      if (x < 0 || x >= w || y < 0 || y >= h)
        onMove(null)
      else
        onMove({ x, y })
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [h, onMove, scale, w])

  return (
    <canvas
      width={w} height={h} ref={ref}
      style={{ width: w * scale, imageRendering: "pixelated", border: "4px solid rgb(218 218 218)", borderRadius: 4 }}
    />
  )
}
