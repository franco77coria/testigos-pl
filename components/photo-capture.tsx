'use client'

import { useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
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
    <div className="mb-2">
      <label className="block text-[10px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded-lg text-center cursor-pointer transition-colors hover:border-pl-red ${
          hasImage ? 'border-solid border-success p-2' : 'border-border p-4'
        }`}
      >
        {hasImage ? (
          <div className="relative">
            <img
              src={preview || existingUrl || ''}
              alt={label}
              className="w-full max-h-[160px] object-contain rounded"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded flex items-center justify-center text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="py-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1.5">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <p className="text-xs text-text-secondary/60">Toca para tomar foto</p>
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
        <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-medium ${uploaded || existingUrl ? 'text-success' : 'text-warning'}`}>
          {uploading ? (
            <>
              <Loader2 size={11} className="animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
              {uploaded ? 'Foto subida' : 'Foto ya registrada'}
            </>
          )}
        </div>
      )}
    </div>
  )
}
