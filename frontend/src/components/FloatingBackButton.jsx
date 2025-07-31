import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FloatingBackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Try browser back, fallback to home if no history
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-8 left-8 z-40"
    >
      <button
        onClick={handleBack}
        className="bg-darkred text-white w-14 h-14 rounded-full shadow-lg hover:bg-red transition-all duration-300 hover:shadow-xl flex items-center justify-center active:scale-95"
        aria-label="返回"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </motion.div>
  );
}