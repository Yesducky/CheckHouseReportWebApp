import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventAPI } from '../utils/api';

export default function EventEntry() {
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newEventUrl, setNewEventUrl] = useState('');
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with ID:', eventId);
    if (!eventId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await eventAPI.getEvent(eventId);
      console.log('Response:', response.data);
      if (response.data.success) {
        const event = response.data.event;
        if (event.house_id && event.old_house_id && event.flat && event.customer_name) {
          navigate(`/dashboard/${eventId}`);
        } else {
          navigate(`/setup/${eventId}`);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError('找不到項目。請檢查 ID 並重試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div >
          <h2 className="mt-[-50px] text-center text-3xl font-extrabold text-gray-900">
            歡迎使用 Lemma 驗樓
          </h2>
          <p className="mt-2 text-center text-md text-gray-600">
            輸入您的驗樓項目 ID 以繼續
          </p>
        </div>

        <form className="mt-8 space-y-6 p-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-2">
              驗樓ID
            </label>
            
            <div className="relative">
              <input
                id="eventId"
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="輸入驗樓ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-darkred focus:border-transparent pl-10"
              />
              
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

            <button
              type="submit"
              disabled={loading || !eventId.trim()}
              className="bg-darkred text-white w-full rounded py-3 disabled:bg-gray hover:bg-red transition-colors duration-200 active:scale-95"
            >
              {loading ? '載入中...' : '繼續'}
            </button>
        </form>

        <div className="text-center">
          <div
            className="text-darkred hover:text-red transition-colors duration-200"
            onClick={async () => {
              try {
                const response = await eventAPI.createEvent();
                if (response.data.success) {
                  setNewEventUrl(`${window.location.origin}/setup/${response.data.url}`);
                }
              } catch (err) {
                console.log(err)
                setError('無法建立新項目');
              }
            }}
          >
            建立新項目
          </div>
        </div>

        {newEventUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-center text-green-800 mb-2">新項目已建立！</p>
            <div className="flex items-center justify-center space-x-2">
              <input
                type="text"
                value={newEventUrl}
                readOnly
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full max-w-md"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newEventUrl);
                  alert('已複製到剪貼簿！');
                }}
                className="bg-darkred text-white px-4 py-2 rounded-md text-sm hover:bg-red transition-colors duration-200 active:scale-95"
              >
                複製
              </button>
              <button
                onClick={() => window.location.href = newEventUrl}
                className="border border-darkred text-darkred px-4 py-2 rounded-md text-sm hover:bg-darkred hover:text-white transition-colors duration-200 active:scale-95"
              >
                前往
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}