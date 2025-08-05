import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { eventAPI, socketConfig } from '../utils/api';
import { AnimatePresence, motion } from 'framer-motion';

export default function ChatRoom({ eventUrl, user, onClose, open = true }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch chat messages
  useEffect(() => {
    if (!eventUrl) return;
    setLoading(true);
    eventAPI.getChatMessages(eventUrl)
      .then(res => {
        setMessages(res.data.messages || []);
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load chat messages');
        setLoading(false);
      });
  }, [eventUrl]);

  // Socket.IO setup for real-time chat
  useEffect(() => {
    if (!eventUrl) return;

    // Create socket connection using centralized config
    socketRef.current = io(socketConfig.url, socketConfig.options);

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to chat server');
      setConnected(true);
      // Join the chat room for this event
      socket.emit('join_chat', { event_url: eventUrl });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setConnected(false);
    });

    socket.on('joined_chat', (data) => {
      console.log('Joined chat room:', data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('Connection error');
    });

    // Listen for new chat messages
    socket.on('chat_message', (message) => {
      console.log('Received chat message:', message);
      // Only add messages for this event
      if (message.event_url === eventUrl) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave_chat', { event_url: eventUrl });
        socket.disconnect();
      }
    };
  }, [eventUrl]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await eventAPI.sendChatMessage(eventUrl, {
        sender_name: user || 'Anonymous',
        content: input.trim(),
      });
      setInput('');
    } catch {
      setError('Failed to send message');
    }
  };

  return (
      <motion.div
          className="fixed inset-0 flex bg-black/30 backdrop-blur-xs items-center justify-center z-50 p-4"
          onClick={onClose}
      >
        <motion.div
          key="chatroom-modal-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-lg mx-auto bg-white shadow-lg rounded-lg flex flex-col h-150 border border-gray-200 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="關閉聊天室"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <span className="text-lg font-bold text-gray-900">聊天室</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold mr-5 ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {connected ? '● 已連線' : '○ 離線'}
            </span>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3 space-y-2">
            {loading ? (
              <div className="text-gray-400 text-center">載入中...</div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : (
              messages.length === 0 ? (
                <div className="text-gray-400 text-center">暫無訊息</div>
              ) : (
                messages.map((msg, index) => (
                  <div key={msg.id || msg.timestamp || index} className="flex flex-col bg-white border border-gray-200 rounded p-2 shadow-sm">
                    <div className="flex items-center mb-1">
                      <span className="font-semibold text-blue-700 mr-2">{msg.sender_name || msg.user}：</span>
                      <span className="text-xs text-gray-400 ml-auto">{
                        (() => {
                          const date = new Date(msg.timestamp);
                          return date.toLocaleString('zh-HK', { hour12: false });
                        })()
                      }</span>
                    </div>
                    <span className="text-gray-800 break-words">{msg.content || msg.message}</span>
                  </div>
                ))
              )
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <input
              className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-darkred"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="輸入訊息..."
              disabled={!connected}
            />
            <button
              type="submit"
              className={`px-4 py-1 rounded text-white font-semibold shadow transition-colors duration-150 ${
                connected && input.trim()
                  ? 'bg-darkred hover:bg-red-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!connected || !input.trim()}
            >
              發送
            </button>
          </form>
        </motion.div>
      </motion.div>
  );
}
