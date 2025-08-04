import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageViewer({ open, img, imgName, onClose, onDownload }) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible]);


  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative max-w-full max-h-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <img
              src={img}
              alt="預覽圖片"
              className="max-h-[80vh] max-w-[90vw] rounded shadow-lg border border-white"
              style={{objectFit: 'contain'}}
            />

          </motion.div>
          <div className="fixed bottom-2 left-0 w-full  flex-col items-center justify-center z-50">
            <div className={`w-full flex items-center justify-center`}>
              <button
                  onClick={onDownload}
                  className="pointer-events-auto mt-0 px-4 py-2 bg-white text-darkred rounded shadow hover:bg-gray-100 font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下載圖片
              </button>
            </div>
            <div className={` text-black w-fit mt-4 ml-2`}>{imgName}</div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
