"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon: ReactNode;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'rose' | 'emerald';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  icon,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "rose",
}: ConfirmDialogProps) {
  const colorStyles = {
    rose: {
      iconBg: "bg-rose-50 border-rose-100",
      button: "bg-rose-500 shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_20px_rgba(244,63,94,0.4)]",
    },
    emerald: {
      iconBg: "bg-emerald-50 border-emerald-100",
      button: "bg-emerald-500 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.4)]",
    },
  };

  const styles = colorStyles[confirmColor];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-[0_20px_80px_rgba(59,58,98,0.2)] border border-[#fcfcfd] text-center relative overflow-hidden"
          >
            <div className={`w-16 h-16 rounded-[1.2rem] ${styles.iconBg} border mx-auto flex items-center justify-center mb-6 shadow-sm`}>
              {icon}
            </div>
            <h3 className="text-xl font-medium text-[#3b3a62] mb-2">{title}</h3>
            <div className="text-[14px] text-[#a0a0b2] font-light mb-8">{message}</div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl font-medium text-[#a0a0b2] bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3.5 rounded-2xl font-medium text-white transition-all shadow-sm active:scale-95 ${styles.button}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
