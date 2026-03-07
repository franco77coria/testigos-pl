'use client'

import { useState, useRef } from 'react'
import { Loader2, Camera, CheckCircle2, X, Lock } from 'lucide-react'
import { comprimirImagen } from '@/lib/utils'

interface Props {
  label: string
  existingUrl?: string | null
  onCapture: (base64: string) => void
  uploading?: boolean
  uploaded?: boolean
  disabled?: boolean
}

export default function PhotoCapture({ label, existingUrl, onCapture, uploading, uploaded, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
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
    <div className="p-3.5 rounded-xl" style={{
      border: '1px solid #E2E8F0',
      background: disabled ? '#F9FAFB' : '#FFFFFF',
      opacity: disabled && !hasImage ? 0.5 : 1,
    }}>
      <label className="block text-[10px] font-bold text-[#718096] mb-2 uppercase tracking-widest pl-0.5">
        {label}
        {disabled && (
          <span style={{ marginLeft: '6px', color: '#9CA3AF', fontSize: '9px', fontWeight: 600 }}>
            (bloqueado)
          </span>
        )}
      </label>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className="rounded-xl text-center transition-all duration-200"
        style={{
          border: hasImage ? '2px solid #10B981' : disabled ? '2px dashed #D1D5DB' : '2px dashed #CBD5E1',
          padding: hasImage ? '6px' : '20px',
          background: hasImage ? 'transparent' : disabled ? '#F3F4F6' : '#FAFBFC',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
        }}
      >
        {/* Disabled overlay */}
        {disabled && !hasImage && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(243,244,246,0.7)', borderRadius: '10px', zIndex: 2,
          }}>
            <Lock size={20} className="text-[#9CA3AF]" />
          </div>
        )}

        {hasImage ? (
          <div className="relative">
            <img
              src={preview || existingUrl || ''}
              alt={label}
              className="w-full h-[180px] object-cover rounded-lg"
              style={{ filter: disabled ? 'grayscale(30%)' : 'none' }}
            />
            {disabled && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px',
                  borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <Lock size={12} /> Bloqueado
                </div>
              </div>
            )}
            {!disabled && (
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
            )}
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center" style={{ position: 'relative', zIndex: 1 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{
              background: disabled ? 'rgba(156,163,175,0.1)' : 'rgba(227,24,55,0.08)'
            }}>
              {disabled ? (
                <Lock size={20} className="text-[#9CA3AF]" />
              ) : (
                <Camera size={20} className="text-[#E31837]" />
              )}
            </div>
            <p className="text-xs font-semibold" style={{ color: disabled ? '#9CA3AF' : '#718096' }}>
              {disabled ? 'Registro bloqueado' : 'Tocar para tomar o subir foto'}
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {(uploading || uploaded || (existingUrl && !preview)) && (
        <div className={`flex items-center gap-1.5 mt-2.5 text-[11px] font-bold ${uploaded || existingUrl ? 'text-emerald-600' : 'text-amber-600'} pl-0.5`}>
          {uploading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Subiendo imagen...
            </>
          ) : (
            <>
              <CheckCircle2 size={12} strokeWidth={2.5} />
              {uploaded ? 'Foto subida correctamente' : 'Foto ya registrada'}
            </>
          )}
        </div>
      )}
    </div>
  )
}
