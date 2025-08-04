import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function ImageEditor({ image, onSave, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const originalImageRef = useRef(null); // Store original image
  const drawingHistoryRef = useRef([]); // Store drawing operations
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushWidth, setBrushWidth] = useState(8);
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 }); // Image pan offset

  // Touch/pinch handling
  const [lastTouches, setLastTouches] = useState([]);
  const [isPinching, setIsPinching] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size based on container
    const containerRect = container.getBoundingClientRect();
    const maxWidth = isMobile ? Math.min(containerRect.width - 20, 400) : 800;
    const maxHeight = isMobile ? Math.min(containerRect.height - 20, 400) : 600;

    setCanvasSize({ width: maxWidth, height: maxHeight });

    // Load and store the original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImageRef.current = img;
      redrawCanvas();
    };
    img.src = image;

  }, [image, isMobile]);

  // Function to redraw canvas at proper resolution with image offset
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !originalImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = originalImageRef.current;

    // Set canvas resolution based on current scale for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const renderScale = Math.max(1, scale * devicePixelRatio);

    const displayWidth = canvasSize.width;
    const displayHeight = canvasSize.height;

    // Set actual canvas size (memory) based on render scale
    canvas.width = displayWidth * renderScale;
    canvas.height = displayHeight * renderScale;

    // Set display size (CSS) to original size
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Scale the drawing context so everything draws at the higher resolution
    ctx.scale(renderScale, renderScale);

    // Calculate image positioning to fit in canvas with offset
    const scaleX = displayWidth / img.width;
    const scaleY = displayHeight / img.height;
    const fitScale = Math.min(scaleX, scaleY);

    const scaledWidth = img.width * fitScale;
    const scaledHeight = img.height * fitScale;
    const baseX = (displayWidth - scaledWidth) / 2;
    const baseY = (displayHeight - scaledHeight) / 2;

    // Apply image offset for panning
    const x = baseX + imageOffset.x;
    const y = baseY + imageOffset.y;

    // Clear and draw background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw the original image at high resolution with offset
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Redraw all drawing operations with offset
    drawingHistoryRef.current.forEach(operation => {
      ctx.strokeStyle = operation.color;
      ctx.lineWidth = operation.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      operation.points.forEach((point, index) => {
        const adjustedX = point.x + imageOffset.x;
        const adjustedY = point.y + imageOffset.y;
        if (index === 0) {
          ctx.moveTo(adjustedX, adjustedY);
        } else {
          ctx.lineTo(adjustedX, adjustedY);
        }
      });
      ctx.stroke();
    });
  }, [scale, canvasSize, imageOffset]);

  // Redraw when scale changes
  useEffect(() => {
    redrawCanvas();
  }, [scale, redrawCanvas]);

  // Enhanced drawing functions with offset consideration
  const startDrawing = useCallback((e) => {
    if (!drawingMode || isPinching || isPanning) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (e.touches) {
      if (e.touches.length > 1) return;
      // Calculate coordinates accounting for canvas scale transform
      x = (e.touches[0].clientX - rect.left) / scale;
      y = (e.touches[0].clientY - rect.top) / scale;
    } else {
      // Calculate coordinates accounting for canvas scale transform
      x = (e.clientX - rect.left) / scale;
      y = (e.clientY - rect.top) / scale;
    }

    // Start new drawing operation - store in canvas coordinates
    const newOperation = {
      color: brushColor,
      width: brushWidth,
      points: [{ x, y }]
    };
    drawingHistoryRef.current.push(newOperation);
    
    // Start immediate drawing for responsiveness
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [drawingMode, brushColor, brushWidth, isPinching, isPanning, scale]);

  const draw = useCallback((e) => {
    if (!isDrawing || !drawingMode || isPinching || isPanning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (e.touches) {
      if (e.touches.length > 1) return;
      e.preventDefault();
      // Calculate coordinates accounting for canvas scale transform
      x = (e.touches[0].clientX - rect.left) / scale;
      y = (e.touches[0].clientY - rect.top) / scale;
    } else {
      // Calculate coordinates accounting for canvas scale transform
      x = (e.clientX - rect.left) / scale;
      y = (e.clientY - rect.top) / scale;
    }

    // Add point to current drawing operation
    const currentOperation = drawingHistoryRef.current[drawingHistoryRef.current.length - 1];
    if (currentOperation) {
      currentOperation.points.push({ x, y });
      
      // Draw line segment immediately for smooth drawing
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [isDrawing, drawingMode, isPinching, isPanning, scale]);

  // Pan/drag functions
  const startPanning = useCallback((e) => {
    if (drawingMode || isPinching || scale <= 1) return; // Only allow panning when zoomed in

    setIsPanning(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (e.touches) {
      if (e.touches.length !== 1) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    setLastPanPoint({ x, y });
  }, [drawingMode, isPinching, scale]);

  const panImage = useCallback((e) => {
    if (!isPanning || drawingMode || isPinching) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (e.touches) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const deltaX = x - lastPanPoint.x;
    const deltaY = y - lastPanPoint.y;

    setImageOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastPanPoint({ x, y });
  }, [isPanning, drawingMode, isPinching, lastPanPoint]);

  // Helper function definitions first
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    // Redraw entire canvas to ensure consistency
    if (drawingHistoryRef.current.length > 0) {
      redrawCanvas();
    }
  }, [redrawCanvas]);

  const stopPanning = useCallback(() => {
    setIsPinching(false);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
      setLastTouches([]);
    }
    if (e.touches.length === 0) {
      stopDrawing();
      stopPanning();
    }
  }, [stopDrawing, stopPanning]);

  // Pinch to zoom functions
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Enhanced touch handling with pan support
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      setLastTouches([...e.touches]);
    } else if (e.touches.length === 1) {
      if (drawingMode) {
        startDrawing(e);
      } else if (scale > 1) {
        startPanning(e);
      }
    }
  }, [drawingMode, scale, startDrawing, startPanning]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const lastDistance = getDistance(lastTouches);

      if (lastDistance > 0) {
        const scaleChange = currentDistance / lastDistance;
        const newScale = Math.max(0.5, Math.min(3, scale * scaleChange));
        setScale(newScale);
      }
      setLastTouches([...e.touches]);
    } else if (e.touches.length === 1) {
      if (drawingMode && !isPinching && !isPanning) {
        draw(e);
      } else if (isPanning && !drawingMode && !isPinching) {
        panImage(e);
      }
    }
  }, [isPinching, lastTouches, scale, drawingMode, isPanning, draw, panImage]);

  // Enhanced mouse handlers with pan support
  const handleMouseDown = useCallback((e) => {
    if (drawingMode) {
      startDrawing(e);
    } else if (scale > 1) {
      startPanning(e);
    }
  }, [drawingMode, scale, startDrawing, startPanning]);

  const handleMouseMove = useCallback((e) => {
    if (drawingMode && isDrawing) {
      draw(e);
    } else if (isPanning && !drawingMode) {
      panImage(e);
    }
  }, [drawingMode, isDrawing, isPanning, draw, panImage]);

  const handleMouseUp = useCallback(() => {
    stopDrawing();
    stopPanning();
  }, [stopDrawing, stopPanning]);

  // Save handler
  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    onSave(dataURL);
  };

  const handleUndo = () => {
    // Remove last drawing operation
    if (drawingHistoryRef.current.length > 0) {
      drawingHistoryRef.current.pop();
      redrawCanvas();
    } else {
      // If no drawing operations, reset to original image
      drawingHistoryRef.current = [];
      redrawCanvas();
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3, prev * 1.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev * 0.8));
  };

  // Reset image position when zoom is reset
  const resetZoom = () => {
    setScale(1);
    setImageOffset({ x: 0, y: 0 });
  };

  // Reset image position
  const resetPosition = () => {
    setImageOffset({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(3, scale * delta));
      setScale(newScale);
    }
  }, [scale]);

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'];
  const mobileColors = ['#ff0000', '#0000ff', '#000000', '#ffffff'];

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={`bg-white rounded-lg shadow-xl w-full mx-4 ${
          isMobile ? 'max-h-[95vh] h-full' : 'max-w-6xl max-h-[95vh]'
        } overflow-hidden flex flex-col`}
        initial={{ scale: 0.9, y: isMobile ? 100 : 0 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: isMobile ? 100 : 0 }}
      >
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center shrink-0">
          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            圖片編輯器
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className={`bg-gray-100 px-4 py-3 border-b shrink-0 ${
          isMobile ? 'space-y-3' : 'flex items-center space-x-4 overflow-x-auto'
        }`}>
          {/* Drawing Tools */}
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setDrawingMode(!drawingMode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                drawingMode ? 'bg-darkred text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              ✏️ {drawingMode ? '停止' : '畫筆'}
            </button>
            <button
              onClick={handleUndo}
              className="bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 px-3 py-2 text-sm"
            >
              重設
            </button>
          </div>

          {/* Zoom Controls */}
          <div className={`flex items-center ${isMobile ? 'justify-center' : ''} space-x-2`}>
            <button
              onClick={zoomOut}
              className="bg-white text-gray-700 border rounded-lg px-2 py-1 text-sm hover:bg-gray-50"
            >
              🔍-
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="bg-white text-gray-700 border rounded-lg px-2 py-1 text-sm hover:bg-gray-50"
            >
              🔍+
            </button>
            <button
              onClick={resetZoom}
              className="bg-white text-gray-700 border rounded-lg px-2 py-1 text-sm hover:bg-gray-50"
            >
              100%
            </button>
            {scale > 1 && (
              <button
                onClick={resetPosition}
                className="bg-blue-500 text-white border rounded-lg px-2 py-1 text-sm hover:bg-blue-600"
                title="重設位置"
              >
                📍
              </button>
            )}
          </div>

          {/* Color Picker */}
          <div className={`flex items-center ${isMobile ? 'justify-center' : ''} space-x-2`}>
            <span className="text-sm text-gray-600">顏色:</span>
            <div className="flex space-x-1">
              {(isMobile ? mobileColors : colors).map(color => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    brushColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                  } transition-transform`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Brush Width */}
          <div className={`flex items-center ${isMobile ? 'justify-center' : ''} space-x-2`}>
            <span className="text-sm text-gray-600">粗細:</span>
            <input
              type="range"
              min="2"
              max={isMobile ? "30" : "20"}
              value={brushWidth}
              onChange={(e) => setBrushWidth(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-6">{brushWidth}</span>
          </div>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 flex justify-center items-center overflow-hidden bg-gray-900 p-4"
        >
          <div
            className="relative"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          >
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded bg-white"
              style={{
                cursor: drawingMode ? 'crosshair' :
                       isPinching ? 'grabbing' :
                       isPanning ? 'grabbing' :
                       scale > 1 ? 'grab' : 'default',
                touchAction: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t flex space-x-3 shrink-0">
          <button
            onClick={onClose}
            className={`flex-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 ${
              isMobile ? 'py-3 text-base' : 'px-4 py-2'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 bg-darkred text-white rounded-lg hover:bg-red-700 ${
              isMobile ? 'py-3 text-base font-medium' : 'px-4 py-2'
            }`}
          >
            儲存編輯
          </button>
        </div>
      </motion.div>
    </motion.div>
    );
}
