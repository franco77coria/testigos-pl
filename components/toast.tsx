'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastItem {
  id: number
  type: 'ok' | 'err' | 'info'
  message: string
}

let toastId = 0
let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null

export function toast(type: ToastItem['type'], message: string) {
  addToastFn?.({ type, message })
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (t) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { ...t, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, 3000)
    }
    return () => { addToastFn = null }
  }, [])

  const styles = {
    ok: { background: '#10B981', color: '#fff' },
    err: { background: '#E31837', color: '#fff' },
    info: { background: '#3B82F6', color: '#fff' },
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[400px] flex flex-col gap-2" style={{ top: 'max(20px, env(safe-area-inset-top, 20px))' }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            className="px-5 py-3.5 rounded-2xl text-[13px] font-medium flex items-center gap-2.5"
            style={{
              ...styles[t.type],
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            {t.type === 'ok' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            )}
            {t.type === 'err' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" /><path d="m9 9 6 6" />
              </svg>
            )}
            {t.type === 'info' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
            )}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
