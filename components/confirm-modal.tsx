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
          className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center p-5"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-[360px] w-full border border-border shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">{titulo}</h3>
                <p className="text-xs text-text-secondary">Verifique los datos antes de guardar</p>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-3.5 mb-5 space-y-2">
              {resumen.map((r) => (
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-xs text-text-secondary">{r.label}</span>
                  <span className="text-base font-bold text-text-primary">{r.valor}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 bg-surface border border-border text-text-primary rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-locked-light"
              >
                Revisar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 bg-success text-white rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-emerald-700"
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
