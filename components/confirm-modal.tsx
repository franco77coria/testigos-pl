'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  titulo: string
  resumen: { label: string; valor: string }[]
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, titulo, resumen, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-7 max-w-[340px] w-full text-center border border-gray-100"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            {/* Warning icon */}
            <div className="w-11 h-11 rounded-xl mx-auto mb-4 flex items-center justify-center bg-amber-50">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h3 className="text-base font-semibold text-gray-800 mb-1">{titulo}</h3>
            <p className="text-xs text-gray-400 mb-5">Verifique los datos antes de guardar</p>

            {/* Data */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
              {resumen.map((r) => (
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{r.label}</span>
                  <span className="text-base font-bold text-red-600">{r.valor}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm transition-colors hover:bg-gray-200"
              >
                Revisar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
