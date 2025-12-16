// components/custom-toast.tsx
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toast, ToastPosition } from "react-hot-toast";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warn' | 'info';

const toastVariants: Record<ToastType, any> = {
  success: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  error: {
    initial: { opacity: 0, x: -10, rotate: -3 },
    animate: { opacity: 1, x: 0, rotate: 0 },
    exit: { opacity: 0, x: 10, rotate: 3 },
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
  warn: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  info: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.25 },
  },
};

interface ToastOptions {
  message: string;
  duration?: number;
  position?: ToastPosition
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="text-green-600" size={20} />,
  error: <XCircle className="text-red-600" size={20} />,
  warn: <AlertTriangle className="text-yellow-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-green-50 dark:bg-green-500/10',
  error: 'bg-red-50 dark:bg-red-500/10',
  warn: 'bg-yellow-50 dark:bg-yellow-500/10',
  info: 'bg-blue-50 dark:bg-blue-500/10',
};

function ToastUI({
  t,
  type,
  message,
}: {
  t: any;
  type: ToastType;
  message: string;
}) {
  return (
    <AnimatePresence>
      {t.visible && (
        <motion.div
          key={t.id}
          initial={toastVariants[type].initial}
          animate={toastVariants[type].animate}
          exit={toastVariants[type].exit}
          transition={toastVariants[type].transition}
          className={`flex items-start gap-3 p-4 rounded-lg backdrop-blur border shadow-md dark:shadow-none ${bgColors[type]}`}
        >
          <div className="mt-0.5">{icons[type]}</div>
          <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 flex-1">
            {message}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Public API
export const toastify = {
  success: (message: string, options?: ToastOptions): string =>
    toast.custom((t) => <ToastUI t={t} type="success" message={message} />, {
      duration: options?.duration ?? 4000,
      position: options?.position,
      id: options?.duration === Infinity ? `offline-${Date.now()}` : undefined,
    }),

  error: (message: string, options?: ToastOptions): string =>
    toast.custom((t) => <ToastUI t={t} type="error" message={message} />, {
      duration: options?.duration ?? 4000,
      position: options?.position,
      id: options?.duration === Infinity ? `offline-${Date.now()}` : undefined,
    }),

  warn: (message: string, options?: ToastOptions): string =>
    toast.custom((t) => <ToastUI t={t} type="warn" message={message} />, {
      duration: options?.duration ?? 4000,
    }),

  info: (message: string, options?: ToastOptions): string =>
    toast.custom((t) => <ToastUI t={t} type="info" message={message} />, {
      duration: options?.duration ?? 4000,
    }),

  dismiss: (id: string) => toast.dismiss(id),
};
