import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { eventAPI } from '../utils/api';
import FullScreenCamera from './FullScreenCamera';

export default function EmailCopy({ onClose, flat, old_house }) {
  const textareaRef = useRef(null);
  const titleRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [emailTitle, setEmailTitle] = useState('懇請重新計算「60天交還公屋期限」及處理新居滲漏問題');
  const [emailContent, setEmailContent] = useState(`尊敬的xxx：\n\n您好！本人為高宏苑${flat}室的業主，同時亦是${old_house}的租戶。感謝房署一直以來對住戶的關懷與支援。\n\n本人近日接獲通知，需於 60 天內交還現時所租住的公屋單位。然而，本人新購的高宏苑單位在檢查後發現多項結構性問題，尤其是浴室出現明顯滲漏，需進行結構檢查及防水處理，導致無法如期進行裝修及入住。\n\n現時情況令本人感到非常無助、無奈及擔心。面對房署的搬遷期限壓力，而新居尚未具備基本居住條件，實在憂慮會陷入無家可歸的困境。\n\n懇請房署體恤住戶的實際處境，協助將「60天交還公屋期限」的首日重新計算，由房委會完成維修並正式交還單位予本人之日起開始計算。此舉將有助本人合理安排裝修及搬遷事宜，亦保障住戶的基本居住權益。\n\n如需進一步資料或安排現場檢查，本人願意全力配合。感謝您抽空閱讀此信，並期盼您的理解與協助。\n\n此致\n敬禮,`);

  const handleCopy = () => {
    const textToCopy = emailTitle + '\n\n' + emailContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } else if (textareaRef.current) {
      textareaRef.current.value = textToCopy;
      textareaRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleCopyTitle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailTitle).then(() => {
        setCopiedTitle('title');
        setTimeout(() => setCopiedTitle(false), 1500);
      });
    } else if (titleRef.current) {
      titleRef.current.select();
      document.execCommand('copy');
      setCopiedTitle('title');
      setTimeout(() => setCopiedTitle(false), 1500);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex bg-black/20 items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Email Text</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">主旨</label>
            <div className="relative mb-2">
              <textarea
                ref={titleRef}
                value={emailTitle}
                onChange={e => setEmailTitle(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md p-3 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-darkred resize-none bg-gray-50"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleCopyTitle}
                  className="bg-darkred text-white px-3 py-2 rounded hover:bg-red transition-colors whitespace-nowrap"
                >
                  {copiedTitle === 'title' ? '已複製' : '複製主旨'}
                </button>
              </div>
            </div>
            <label className="block text-gray-700 font-medium mb-2">內容</label>
            <textarea
              ref={textareaRef}
              value={emailContent}
              onChange={e => setEmailContent(e.target.value)}
              rows={16}
              className="w-full border border-gray-300 rounded-md p-3 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-darkred resize-none bg-gray-50"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleCopy}
              className="bg-darkred text-white px-4 py-2 rounded hover:bg-red transition-colors"
            >
              {copied ? '已複製' : '複製內容'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>

  );
}