'use client'

import { useState, useRef } from 'react'
import { Loader2, Camera, CheckCircle2, X } from 'lucide-react'
import { comprimirImagen } from '@/lib/utils'

interface Props {
  label: string
  existingUrl?: string | null
  onCapture: (base64: string) => void
  uploading?: boolean
  uploaded?: boolean
}

export default function PhotoCapture({ label, existingUrl, onCapture, uploading, uploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const b64 = ev.target?.result as string
      setPreview(b64)
      const compressed = await comprimirImagen(b64)
      onCapture(compressed)
    }
    reader.readAsDataURL(file)
  }

  const hasImage = preview || existingUrl

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200">
      <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest pl-1">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="rounded-xl text-center cursor-pointer transition-all duration-300 hover:border-[#E31837] hover:bg-slate-50"
        style={{
          border: hasImage ? '2px solid #10B981' : '2px dashed #CBD5E1',
          padding: hasImage ? '6px' : '20px',
        }}
      >
        {hasImage ? (
          <div className="relative">
            <img
              src={preview || existingUrl || ''}
              alt={label}
              className="w-full h-[180px] object-cover rounded-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="absolute top-2 right-2 p-1.5 rounded-lg flex items-center justify-center text-white bg-black/60 backdrop-blur hover:bg-black/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <Camera size={20} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 font-semibold">Tocar para tomar/subir foto</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {(uploading || uploaded || (existingUrl && !preview)) && (
        <div className={`flex items-center gap-1.5 mt-2.5 text-[11px] font-bold ${uploaded || existingUrl ? 'text-emerald-600' : 'text-amber-600'} pl-1`}>
          {uploading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Subiendo imagen...
            </>
          ) : (
            <>
              <CheckCircle2 size={12} strokeWidth={2.5} />
              {uploaded ? 'Foto subida correctamente' : 'Fotografía ya registrada en el sistema'}
            </>
          )}
        </div>
      )}
    </div>
  )
}
