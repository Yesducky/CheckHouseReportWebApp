import { useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function FullScreenCamera({ onImageCaptured, onClose }) {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode,
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (onImageCaptured) onImageCaptured(imageSrc);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="w-full h-full object-cover"
        style={{ background: '#000' }}
      />
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black bg-opacity-60 text-white rounded-full p-2 hover:bg-opacity-80 transition-colors"
        aria-label="關閉相機"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="absolute bottom-0 py-5 left-0 right-0 flex justify-center gap-10 bg-black/90">
        <button
          onClick={switchCamera}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={handleCapture}
          className="bg-white rounded-full w-16 h-16 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <div className="bg-orange-400 rounded-full w-12 h-12"></div>
        </button>
        <button
          className="text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}