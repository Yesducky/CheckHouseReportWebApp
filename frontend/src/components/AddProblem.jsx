import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { eventAPI } from '../utils/api';
import FullScreenCamera from './FullScreenCamera';
import imageCompression from 'browser-image-compression';

export default function AddProblem({ onClose, onProblemAdded }) {
  const { eventId } = useParams();
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const categories = ['廚房', '客廳', '客廁',  '套廁', '房間', '露台', '其他'];


  const handleImageCapture = () => {
    setShowCamera(true);
  };

  const handleImageCaptured = async (dataUrl) => {
    try {
      // Convert dataUrl to blob, then compress using browser-image-compression
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'camera-image.jpg', { type: 'image/jpeg' });
      
      // Compress using browser-image-compression library
      const compressedFile = await compressImageWithLibrary(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing camera image:', error);
      // Fallback to original dataUrl if compression fails
      setImages(prev => [...prev, dataUrl]);
    }
    setShowCamera(false);
  };

  // Enhanced compression function using browser-image-compression library
  const compressImageWithLibrary = async (file) => {
    const options = {
      maxSizeMB: 1, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true, // Use web worker for better performance
      initialQuality: 0.8, // Initial quality (0-1)
      alwaysKeepResolution: false, // Allow resolution reduction if needed
      fileType: 'image/jpeg' // Force JPEG format for consistency
    };

    try {
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = await imageCompression(file, options);
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      return compressedFile;
    } catch (error) {
      console.error('Compression failed:', error);
      return file; // Return original file if compression fails
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      try {
        // Compress using the professional library
        const compressedFile = await compressImageWithLibrary(file);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, e.target.result]);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to original file
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      const problemData = {
        description,
        category: category,
        important: isImportant,
        image: images
      };

      await eventAPI.addProblem(eventId, problemData);
      onProblemAdded();
      onClose();
    } catch (err) {
      console.error('無法新增問題:', err);
    } finally {
      setLoading(false);
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
            <h2 className="text-2xl font-bold text-gray-900">新增問題</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                問題描述
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-darkred focus:border-transparent"
                placeholder="Image Caption"
                required
              />
            </div>
            <div className={`flex justify-between`}>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-fit px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-darkred focus:border-transparent"
                >
                    <option value="">選擇類別</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
              <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="important"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="h-4 w-4 text-darkred focus:ring-darkred border-gray-300 rounded"
                />
                <label htmlFor="important" className="text-sm font-medium text-gray-700">
                  標記為重要
                </label>
              </div>

            </div>



            <div>
              <div className="flex space-x-4 mb-4">

                <label htmlFor="fileInputCamera" className="bg-darkred text-white px-4 py-2 rounded-md hover:bg-white hover:text-darkred transition-colors duration-200 flex items-center space-x-2 active:scale-95 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <button
                  type="button"
                  onClick={handleImageCapture}
                  className="border border-darkred text-darkred px-4 py-2 rounded-md hover:bg-darkred hover:text-white transition-colors duration-200 flex items-center space-x-2 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-darkred text-darkred px-4 py-2 rounded-md hover:bg-darkred hover:text-white transition-colors duration-200 flex items-center space-x-2 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                type={'file'}
                accept={'image/*'}
                id="fileInputCamera"
                capture={"camera"}
                onChange={handleFileSelect}
                className="hidden"
              />
              {images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">已選擇 {images.length} 張圖片</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`圖片 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 active:scale-95"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="bg-darkred text-white px-6 py-2 rounded-md hover:bg-red transition-colors duration-200 disabled:bg-gray active:scale-95"
              >
                {loading ? '新增中...' : '新增問題'}
              </button>
            </div>
          </form>
        </div>
        {/* FullScreenCamera Modal */}
        <AnimatePresence>
          {showCamera && (
              <FullScreenCamera
                  onClose={() => setShowCamera(false)}
                  onImageCaptured={handleImageCaptured}
              />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>


  );
}