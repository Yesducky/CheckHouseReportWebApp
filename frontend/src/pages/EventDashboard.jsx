import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventAPI } from '../utils/api';
import { useParams } from 'react-router-dom';
import AddProblem from '../components/AddProblem';
import EmailCopy from "../components/EmailCopy.jsx";
import ImageViewer from '../components/ImageViewer';

export default function EventDashboard() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [showEmailCopy, setShowEmailCopy] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImg, setViewerImg] = useState(null);
  const [viewerImgName, setViewerImgName] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getEvent(eventId);
      if (response.data.success) {
        setEvent(response.data.event);
        console.log('Fetched event:', response.data.event);
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDocx = async () => {
    if (event) {
      try {
        const response = await eventAPI.generateReport(eventId);
        
        // Create a download link for the Word document
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `查驗報告_${eventId}_${new Date().toISOString().slice(0, 10)}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
      } catch (error) {
        console.error('Failed to generate report:', error);
        alert('生成報告失敗，請稍後再試');
      }
    }
  };

  const handleOpenCopy = () => {
    setShowEmailCopy(true)
  }

  const downloadAllImages = async (problem) => {
    if (!problem.image || problem.image.length === 0) {
      alert('此問題沒有圖片可下載');
      return;
    }

    try {
      for (let i = 0; i < problem.image.length; i++) {
        const imageUrl = problem.image[i];

        // Create a temporary link element
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${eventId}_圖片_${i + 1}.jpg`;
        link.target = '_blank';

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Add a small delay between downloads to avoid browser blocking
        if (i < problem.image.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error('下載圖片時發生錯誤:', error);
      alert('下載圖片失敗，請稍後再試');
    }
  };

  // Image viewer handlers
  const openImageViewer = (img, name) => {
    setViewerImg(img);
    setViewerImgName(name);
    setViewerOpen(true);
  };
  const closeImageViewer = () => {
    setViewerOpen(false);
    setViewerImg(null);
    setViewerImgName('');
  };

  const downloadCurrentImage = () => {
    if (!viewerImg) return;
    const link = document.createElement('a');
    link.href = viewerImg;
    link.download = viewerImgName || '圖片.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-darkred"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center w-full py-12">
        <h2 className="text-xl font-bold text-red-600">
          Event not found
        </h2>
      </div>
    );
  }

  return (
    <div className={`w-full pb-20 `}>
      <div className="mb-8 h-full w-full ">
        <div className="bg-white shadow-lg rounded-lg w-full">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center w-full">
            <h3 className="text-lg font-medium text-gray-900">項目資訊</h3>
            <div className={`flex space-x-2`}>
            <button
                onClick={handleOpenCopy}
                className="bg-darkred text-white px-4 py-2 cursor-pointer rounded shadow hover:bg-red transition-colors"
            >
              Email
            </button>
              <button
                  onClick={handleExportDocx}
                  className="bg-darkred text-white px-4 py-2 cursor-pointer rounded shadow hover:bg-red transition-colors"
              >
                Report
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm text-gray-600">屋苑</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{event.house.name}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm text-gray-600">單位</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{event.flat}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">現住屋苑</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{event.old_house_id|| "未設定"}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-gray-600">客戶</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{event.customer_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          問題列表 ({event.problems?.length})
        </h2>

        {event.problems.length === 0 ? (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">尚未回報問題</h3>
            <p className="text-gray-600">點擊右下角的 + 按鈕新增問題</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {event.problems.map((problem, index) => (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white shadow-lg rounded-lg overflow-hidden h-full"
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">{problem.description}</h3>
                      {problem.important && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium p-2 rounded-full flex items-center space-x-1">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-2">分類: {problem.category}</p>

                    {problem.image.length > 0 && (
                      <div>
                        <div className="grid grid-cols-2 gap-2">
                          {problem.image.map((img, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={img}
                              alt={`圖片 ${imgIndex + 1}`}
                              className="w-full object-cover rounded-md border border-gray-200 cursor-pointer"
                              onClick={() => openImageViewer(img, `${eventId}_圖片_${imgIndex + 1}.jpg`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={`flex justify-between`}>
                      {problem.image && problem.image.length > 0 && (
                          <button
                              onClick={() => downloadAllImages(problem)}
                              className="mt-2 inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkred transition-colors"
                              title="下載所有圖片"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            下載所有圖片
                          </button>
                      )}

                      <div className="text-xs text-gray-500 mt-4">
                        {problem.created_at ?
                          (() => {
                            const date = new Date(problem.created_at);
                            // Add 8 hours for HK time if not already in HK
                            date.setHours(date.getHours() + 8);
                            return date.toLocaleString('zh-HK', { hour12: false });
                          })()
                          : '無'}
                      </div>

                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 浮動新增按鈕 */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setShowAddProblem(true)}
        className="fixed bottom-8 cursor-pointer right-8 z-50 bg-darkred text-white w-14 h-14 rounded-full shadow-lg hover:bg-red transition-all duration-300 hover:shadow-xl flex items-center justify-center active:scale-95"
        aria-label="新增問題"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>

      {/* AddProblem Modal */}
      <AnimatePresence>
        {showAddProblem && (
          <AddProblem
            onClose={() => setShowAddProblem(false)}
            onProblemAdded={() => {
              setShowAddProblem(false);
              fetchEvent();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEmailCopy && (
            <EmailCopy onClose={() => setShowEmailCopy(false)} flat={event.flat} old_house={event.old_house_id} />
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <ImageViewer
        open={viewerOpen}
        img={viewerImg}
        imgName={viewerImgName}
        onClose={closeImageViewer}
        onDownload={downloadCurrentImage}
      />
    </div>
  );
}