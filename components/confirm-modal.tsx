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
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-[360px] w-full text-center"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
          >
            {/* Warning icon */}
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#FFFBEB' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">{titulo}</h3>
            <p className="text-sm text-[#6B7280] mb-5">Verifique los datos antes de guardar</p>

            {/* Data */}
            <div className="bg-[#F5F5F7] rounded-2xl p-4 mb-6 space-y-2.5">
              {resumen.map((r) => (
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">{r.label}</span>
                  <span className="text-lg font-extrabold text-[#E31837]">{r.valor}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 bg-[#F3F4F6] text-[#2D2D2D] rounded-xl font-bold text-sm cursor-pointer transition-all duration-300 hover:bg-[#E5E7EB]"
              >
                Revisar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
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
