"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Slide-in panel used for every module's create/edit form. */
export function Drawer({ open, title, description, onClose, children, wide }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className={`fixed inset-y-0 right-0 z-[76] flex w-full flex-col border-l border-white/10 bg-[#141413] text-white shadow-2xl ${
              wide ? "max-w-2xl" : "max-w-md"
            }`}
            role="dialog"
            aria-modal
            aria-label={title}
          >
            <div className="flex items-start justify-between border-b border-white/8 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                {description && <p className="mt-1 text-sm text-white/40">{description}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/8 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
