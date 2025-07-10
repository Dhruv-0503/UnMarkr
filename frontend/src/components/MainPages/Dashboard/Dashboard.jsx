import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiImage, FiDownload, FiEdit, FiType, FiDroplet, FiTrash2, FiSquare, FiCircle, FiMinus, FiSmile, FiArrowUp, FiArrowDown, FiChevronsUp, FiChevronsDown } from 'react-icons/fi';
import { Rnd } from 'react-rnd';
import { toPng } from 'html-to-image';

const Dashboard = () => {
  const [image, setImage] = useState(null);
  const [cleanedImage, setCleanedImage] = useState(null);
  const [textCoordinates, setTextCoordinates] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [textFields, setTextFields] = useState([]);
  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 1, height: 1 });
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 1, height: 1 });

  // Overlays for shapes and emojis
  const [overlays, setOverlays] = useState([]); // { id, type: 'shape'|'emoji', shapeType, emoji, ... }
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);
  // For color/opacity/layer toolbar
  const activeOverlay = overlays.find(o => o.isActive);

  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setCleanedImage(null);
        setTextCoordinates([]);
        setTextFields([]);
        setActiveField(null);
        setUploadStatus(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send image to backend for text removal
  const handleSendToBackend = async () => {
    if (!image) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // Convert base64 to blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'upload.jpg');

      // Send to backend
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log(data);
      if (res.ok) {
        setUploadStatus({
          type: 'success',
          message: `Text removal completed! Found ${data.text_coordinates.length} text regions.`
        });
        
        // Set the cleaned image
        if (data.cleaned_image) {
          setCleanedImage(`data:image/jpeg;base64,${data.cleaned_image}`);
        }
        
        // Set the text coordinates and create text fields
        if (data.text_coordinates) {
          setTextCoordinates(data.text_coordinates);
          createTextFields(data.text_coordinates);
        }
      } else {
        setUploadStatus({
          type: 'error',
          message: data.error || 'Text removal failed'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to connect to server. Make sure the backend is running.'
      });
    }

    setIsUploading(false);
  };

  // Create text fields from coordinates
  const createTextFields = (coordinates) => {
    const fields = coordinates.map((coordObj, index) => {
      const coords = coordObj.coordinates;
      const text = coordObj.text;

      // Calculate bounding box dimensions
      const xCoords = [coords[0], coords[2], coords[4], coords[6]];
      const yCoords = [coords[1], coords[3], coords[5], coords[7]];

      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);

      const width = maxX - minX;
      const height = maxY - minY;

      // Calculate font size based on height (roughly 70% of box height)
      const fontSize = Math.max(12, Math.floor(height * 0.7));

      return {
        id: index,
        text: text,
        x: minX,
        y: minY,
        width: width,
        height: height,
        fontSize: fontSize,
        fontColor: '#000000',
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        isActive: false
      };
    });
    setTextFields(fields);
  };

  // Update text field
  const updateTextField = (id, updates) => {
    setTextFields(prev => prev.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // Delete text field
  const deleteTextField = (id) => {
    setTextFields(prev => prev.filter(field => field.id !== id));
    if (activeField === id) {
      setActiveField(null);
    }
  };

  // Toggle field active state
  const toggleFieldActive = (id) => {
    setActiveField(activeField === id ? null : id);
    setTextFields(prev => prev.map(field => ({
      ...field,
      isActive: field.id === id ? !field.isActive : false
    })));
  };

  // Find the active field object
  const activeFieldObj = textFields.find(f => f.id === activeField);

  // Add Shape Overlay
  const handleAddShape = (shapeType) => {
    setOverlays(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: 'shape',
        shapeType,
        x: originalImageSize.width / 2 - 50,
        y: originalImageSize.height / 2 - 50,
        width: 100,
        height: 100,
        fill: '#fbbf24', // amber-400
        stroke: '#f59e42', // orange-400
        strokeWidth: 2,
        isActive: false
      }
    ]);
    setShowShapeDropdown(false);
  };

  // Add Emoji Overlay
  const handleAddEmoji = (emoji) => {
    setOverlays(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: 'emoji',
        emoji,
        x: originalImageSize.width / 2 - 40,
        y: originalImageSize.height / 2 - 40,
        width: 80,
        height: 80,
        isActive: false
      }
    ]);
    setShowEmojiDropdown(false);
  };

  // Update overlay
  const updateOverlay = (id, updates) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  // Layer position controls
  const bringForward = (id) => {
    setOverlays(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx < prev.length - 1) {
        const newArr = [...prev];
        [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
        return newArr;
      }
      return prev;
    });
  };
  const sendBackward = (id) => {
    setOverlays(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx > 0) {
        const newArr = [...prev];
        [newArr[idx], newArr[idx - 1]] = [newArr[idx - 1], newArr[idx]];
        return newArr;
      }
      return prev;
    });
  };
  const bringToFront = (id) => {
    setOverlays(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx < prev.length - 1) {
        const newArr = [...prev];
        const [item] = newArr.splice(idx, 1);
        newArr.push(item);
        return newArr;
      }
      return prev;
    });
  };
  const sendToBack = (id) => {
    setOverlays(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx > 0) {
        const newArr = [...prev];
        const [item] = newArr.splice(idx, 1);
        newArr.unshift(item);
        return newArr;
      }
      return prev;
    });
  };

  // Delete overlay
  const deleteOverlay = (id) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
  };

  // Toggle overlay active state
  const toggleOverlayActive = (id) => {
    setOverlays(prev => prev.map(o => ({ ...o, isActive: o.id === id ? !o.isActive : false })));
  };

  // Download the final image with text overlays
  const handleDownloadFinalImage = async () => {
    if (!cleanedImage || !imageContainerRef.current) return;
    try {
      const dataUrl = await toPng(imageContainerRef.current, {
        cacheBust: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = 'final_image.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
    }
  };
  

  // Remove image and reset states
  const removeImage = () => {
    setImage(null);
    setCleanedImage(null);
    setTextCoordinates([]);
    setTextFields([]);
    setActiveField(null);
    setUploadStatus(null);
  };

  // Update text field position and size on drag/resize
  const handleRndChange = (id, data, isDisplayCoords = true) => {
    setTextFields(prev => prev.map(field => {
      if (field.id !== id) return field;
      // No scaling needed, use data as is
      let x = data.x, y = data.y, width = data.width, height = data.height;
      return { ...field, x, y, width, height };
    }));
  };

  // Add Text Field
  const handleAddTextField = () => {
    // Place in center of image
    const defaultWidth = 200;
    const defaultHeight = 50;
    const centerX = (originalImageSize.width - defaultWidth) / 2;
    const centerY = (originalImageSize.height - defaultHeight) / 2;
    setTextFields(prev => [
      ...prev,
      {
        id: Date.now(),
        text: 'New Text',
        x: centerX,
        y: centerY,
        width: defaultWidth,
        height: defaultHeight,
        fontSize: 32,
        fontFamily: 'Roboto, sans-serif',
        fontColor: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        isActive: false
      }
    ]);
  };

  // When cleanedImage is set, get original image size from backend response or image
  useEffect(() => {
    if (cleanedImage) {
      const img = new window.Image();
      img.onload = () => {
        setOriginalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = cleanedImage;
    }
  }, [cleanedImage]);

  // Get displayed image size after render
  useEffect(() => {
    if (cleanedImage && imageContainerRef.current) {
      const img = imageContainerRef.current.querySelector('img');
      if (img) {
        setDisplayedImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    }
  }, [cleanedImage, textFields]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📸 Text Remover</h1>
        <p className="text-gray-600">Upload an image to remove text and add custom overlays</p>
      </motion.header>

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
      >
        {/* Image Display Area */}
        <div className="p-6">
          {cleanedImage ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Cleaned Image with Text Overlays</h3>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadFinalImage}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    <FiDownload /> Download Final Image
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={removeImage}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    <FiX /> Remove Image
                  </motion.button>
                </div>
              </div>
              {/* Centered Image Container with Text Overlays */}
              <div className="w-full flex justify-center items-center relative" style={{ minHeight: '400px' }}>
                {/* Add Buttons and Dropdowns */}
                <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 items-end">
                  <button
                    onClick={handleAddTextField}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
                  >
                    + Add Text
                  </button>
                  {/* Add Shape Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowShapeDropdown(s => !s)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium flex items-center gap-2"
                    >
                      <FiSquare /> Add Shape
                    </button>
                    {showShapeDropdown && (
                      <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-40 min-w-[120px]">
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full" onClick={() => handleAddShape('rectangle')}><FiSquare /> Rectangle</button>
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full" onClick={() => handleAddShape('ellipse')}><FiCircle /> Ellipse</button>
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full" onClick={() => handleAddShape('line')}><FiMinus /> Line</button>
                      </div>
                    )}
                  </div>
                  {/* Add Emoji Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiDropdown(s => !s)}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium flex items-center gap-2"
                    >
                      <FiSmile /> Add Emoji
                    </button>
                    {showEmojiDropdown && (
                      <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-40 min-w-[200px] p-2">
                        <div className="grid grid-cols-5 gap-2">
                          {['😀','❤️','⭐','🎉','👍','🔥','😂','😎','🥳','🚀'].map(emoji => (
                            <button key={emoji} className="text-2xl hover:bg-gray-100 rounded p-1" style={{ width: 36, height: 36 }} onClick={() => handleAddEmoji(emoji)}>{emoji}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div 
                  ref={imageContainerRef}
                  className="relative bg-gray-100 rounded-lg overflow-auto"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    minHeight: '400px',
                    display: 'inline-block',
                    background: '#f3f4f6', // Use hex color to avoid oklch
                    color: '#222', // Fallback text color
                  }}
                >
                  <img 
                    src={cleanedImage} 
                    alt="Cleaned" 
                    style={{
                      width: originalImageSize.width,
                      height: originalImageSize.height,
                      display: 'block',
                      maxWidth: '100%',
                      maxHeight: '80vh',
                    }}
                    onLoad={e => {
                      setDisplayedImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                    }}
                    onClick={(e) => {
                      // Close active field when clicking on the image itself
                      setActiveField(null);
                      setTextFields(prev => prev.map(field => ({ ...field, isActive: false })));
                    }}
                  />
                  {/* Text Overlays */}
                  {textFields.map((field) => {
                    // No scaling needed, use original coordinates
                    const left = field.x;
                    const top = field.y;
                    const width = field.width;
                    const height = field.height;
                    const fontSize = field.fontSize;
                    return (
                      <Rnd
                        key={field.id}
                        bounds="parent"
                        size={{ width, height }}
                        position={{ x: left, y: top }}
                        onDragStop={(e, d) => {
                          handleRndChange(field.id, { x: d.x, y: d.y, width, height }, false);
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          handleRndChange(field.id, {
                            x: position.x,
                            y: position.y,
                            width: ref.offsetWidth,
                            height: ref.offsetHeight,
                          }, false);
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          toggleFieldActive(field.id);
                        }}
                        style={{ 
                          zIndex: field.isActive ? 20 : 10,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => {
                          // Show hover effect
                          if (!field.isActive) {
                            setTextFields(prev => prev.map(f => 
                              f.id === field.id ? { ...f, isHovered: true } : f
                            ));
                          }
                        }}
                        onMouseLeave={() => {
                          // Remove hover effect
                          setTextFields(prev => prev.map(f => 
                            f.id === field.id ? { ...f, isHovered: false } : f
                          ));
                        }}
                      >
                        <div
                          className={`select-none transition-all duration-200 w-full h-full ${
                            field.isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : 
                            field.isHovered ? 'ring-1 ring-gray-400 ring-opacity-30' : ''
                          }`}
                          style={{
                            width: '100%',
                            height: '100%',
                            cursor: 'move',
                            border: field.isActive ? '2px solid #3b82f6' : 'none',
                            background: 'transparent',
                            position: 'relative',
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            toggleFieldActive(field.id);
                          }}
                        >
                          {/* Delete icon (top-right) */}
                          {(field.isActive || field.isHovered) && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                deleteTextField(field.id);
                              }}
                              className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full shadow p-1 z-30 hover:bg-red-100 transition-all duration-150"
                              title="Delete text field"
                            >
                              <FiX size={14} className="text-red-600" />
                            </button>
                          )}
                          {/* Text Input */}
                          <input
                            type="text"
                            value={field.text}
                            onChange={e => updateTextField(field.id, { text: e.target.value })}
                            className={`w-full h-full bg-transparent border-none outline-none resize-none text-center transition-all duration-150 ${
                              field.isActive ? '' : 'pointer-events-none'
                            }`}
                            style={{
                              fontSize: `${fontSize}px`,
                              color: field.fontColor,
                              fontFamily: field.fontFamily,
                              fontWeight: field.fontWeight,
                              fontStyle: field.fontStyle,
                              textAlign: field.textAlign,
                              lineHeight: `${height}px`,
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              boxShadow: 'none',
                              padding: 0,
                              margin: 0,
                              cursor: field.isActive ? 'text' : 'move',
                            }}
                            onClick={e => e.stopPropagation()}
                            spellCheck={false}
                            readOnly={!field.isActive}
                          />
                        </div>
                      </Rnd>
                    );
                  })}
                  {/* Shape & Emoji Overlays */}
                  {overlays.map((overlay, idx) => {
                    const left = overlay.x;
                    const top = overlay.y;
                    const width = overlay.width;
                    const height = overlay.height;
                 return (
                   <Rnd
                     key={overlay.id}
                     bounds="parent"
                     size={{ width, height }}
                     position={{ x: left, y: top }}
                     onDragStop={(e, d) => {
                       updateOverlay(overlay.id, { x: d.x, y: d.y });
                     }}
                     onResizeStop={(e, direction, ref, delta, position) => {
                       updateOverlay(overlay.id, {
                         x: position.x,
                         y: position.y,
                         width: ref.offsetWidth,
                         height: ref.offsetHeight,
                       });
                     }}
                     onClick={e => {
                       e.stopPropagation();
                       toggleOverlayActive(overlay.id);
                     }}
                     style={{ zIndex: overlay.isActive ? 19 : 9, cursor: 'pointer', opacity: overlay.opacity ?? 1 }}
                   >
                     <div
                       className={`select-none transition-all duration-200 w-full h-full ${overlay.isActive ? 'ring-2 ring-pink-500 ring-opacity-50' : ''}`}
                       style={{
                         width: '100%',
                         height: '100%',
                         cursor: 'move',
                         border: overlay.isActive ? '2px solid #ec4899' : 'none',
                         background: 'transparent',
                         position: 'relative',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         opacity: overlay.opacity ?? 1,
                       }}
                       onClick={e => {
                         e.stopPropagation();
                         toggleOverlayActive(overlay.id);
                       }}
                     >
                       {/* Delete icon (top-right) */}
                       {overlay.isActive && (
                         <button
                           onClick={e => {
                             e.stopPropagation();
                             deleteOverlay(overlay.id);
                           }}
                           className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full shadow p-1 z-30 hover:bg-red-100"
                           title="Delete overlay"
                         >
                           <FiX size={14} className="text-red-600" />
                         </button>
                       )}
                       {/* Render shape or emoji */}
                       {overlay.type === 'shape' && overlay.shapeType === 'rectangle' && (
                         <div style={{ width: '100%', height: '100%', background: overlay.fill, border: `${overlay.strokeWidth}px solid ${overlay.stroke}`, borderRadius: 6, opacity: overlay.opacity ?? 1 }} />
                       )}
                       {overlay.type === 'shape' && overlay.shapeType === 'ellipse' && (
                         <div style={{ width: '100%', height: '100%', background: overlay.fill, border: `${overlay.strokeWidth}px solid ${overlay.stroke}`, borderRadius: '50%', opacity: overlay.opacity ?? 1 }} />
                       )}
                       {overlay.type === 'shape' && overlay.shapeType === 'line' && (
                         <svg width={width} height={height} style={{ width: '100%', height: '100%', opacity: overlay.opacity ?? 1 }}>
                           <line x1={0} y1={height/2} x2={width} y2={height/2} stroke={overlay.stroke} strokeWidth={overlay.strokeWidth} />
                         </svg>
                       )}
                       {overlay.type === 'emoji' && (
                         <span style={{ fontSize: Math.min(width, height) * 0.8, userSelect: 'none', opacity: overlay.opacity ?? 1, background: overlay.fill || 'transparent', borderRadius: 8, padding: 2 }}>{overlay.emoji}</span>
                       )}
                     </div>
                   </Rnd>
                 );
                })}
                </div>
              </div>
            </div>
          ) : image ? (
            <div className="flex flex-col items-center">
              <img src={image} alt="Uploaded" className="max-w-full max-h-[400px] rounded-lg shadow" />
              <p className="text-gray-500 mt-4">Click "Remove Text" to process the image</p>
            </div>
          ) : (
            <div className="text-center p-12">
              <FiImage className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-gray-500 mb-6">Upload an image to get started</p>
            </div>
          )}
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mx-6 mb-6 p-4 rounded-lg ${
              uploadStatus.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {uploadStatus.message}
          </motion.div>
        )}

        {/* Upload Controls */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium"
            >
              <FiUpload /> Upload Image
            </motion.button>

            {image && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendToBackend}
                disabled={isUploading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium ${
                  isUploading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Remove Text'
                )}
              </motion.button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Floating Toolbar for Text Styling */}
        {activeFieldObj && (
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-white shadow-lg rounded-xl border border-gray-200 px-6 py-4 flex flex-col gap-4 items-start"
          >
            <div className="flex items-center w-full justify-between mb-2">
              <span className="text-xs text-gray-600">Text Field {activeFieldObj.id}</span>
              <button
                onClick={() => setActiveField(null)}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                title="Close toolbar"
              >
                <FiX size={18} />
              </button>
            </div>
            {/* Font Family */}
            <div className="flex items-center gap-2 w-full">
              <label className="text-xs text-gray-500">Font</label>
              <select
                value={activeFieldObj.fontFamily}
                onChange={e => updateTextField(activeFieldObj.id, { fontFamily: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                style={{ fontFamily: activeFieldObj.fontFamily }}
              >
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Lato, sans-serif">Lato</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Playfair Display, serif">Playfair Display</option>
                <option value="Montserrat, sans-serif">Montserrat</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
                {/* Widely used system fonts */}
                <option value="Arial, sans-serif">Arial</option>
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Courier New, monospace">Courier New</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Verdana, sans-serif">Verdana</option>
              </select>
            </div>
            {/* Font Size */}
            <div className="flex items-center gap-2 w-full">
              <FiType size={14} className="text-gray-500" />
              <input
                type="range"
                min="8"
                max="72"
                value={activeFieldObj.fontSize}
                onChange={e => updateTextField(activeFieldObj.id, { fontSize: parseInt(e.target.value) })}
                className="w-24"
              />
              <span className="text-xs text-gray-600 w-8">{activeFieldObj.fontSize}px</span>
            </div>
            {/* Font Color */}
            <div className="flex items-center gap-2 w-full">
              <FiDroplet size={14} className="text-gray-500" />
              <input
                type="color"
                value={activeFieldObj.fontColor}
                onChange={e => updateTextField(activeFieldObj.id, { fontColor: e.target.value })}
                className="w-7 h-7 border border-gray-300 rounded"
              />
            </div>
            {/* Font Style */}
            <div className="flex items-center gap-1 w-full">
              <button
                onClick={() => updateTextField(activeFieldObj.id, { fontWeight: activeFieldObj.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${activeFieldObj.fontWeight === 'bold' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                style={{ fontWeight: 'bold', fontFamily: activeFieldObj.fontFamily }}
              >
                B
              </button>
              <button
                onClick={() => updateTextField(activeFieldObj.id, { fontStyle: activeFieldObj.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${activeFieldObj.fontStyle === 'italic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                style={{ fontStyle: 'italic', fontFamily: activeFieldObj.fontFamily }}
              >
                I
              </button>
            </div>
            {/* Text Align */}
            <div className="flex items-center gap-1 w-full">
              <button
                onClick={() => updateTextField(activeFieldObj.id, { textAlign: 'left' })}
                className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${activeFieldObj.textAlign === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="10" width="8" height="2" rx="1" fill="currentColor"/></svg>
              </button>
              <button
                onClick={() => updateTextField(activeFieldObj.id, { textAlign: 'center' })}
                className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${activeFieldObj.textAlign === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor"/><rect x="4" y="10" width="8" height="2" rx="1" fill="currentColor"/></svg>
              </button>
              <button
                onClick={() => updateTextField(activeFieldObj.id, { textAlign: 'right' })}
                className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${activeFieldObj.textAlign === 'right' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor"/><rect x="6" y="10" width="8" height="2" rx="1" fill="currentColor"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      {/* Floating Toolbar for Shape/Emoji Styling */}
      {activeOverlay && (
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-white shadow-lg rounded-xl border border-gray-200 px-6 py-4 flex flex-col gap-4 items-start"
        >
          <div className="flex items-center w-full justify-between mb-2">
            <span className="text-xs text-gray-600">{activeOverlay.type === 'shape' ? 'Shape' : 'Emoji'} Overlay</span>
            <button
              onClick={() => updateOverlay(activeOverlay.id, { isActive: false })}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title="Close toolbar"
            >
              <FiX size={18} />
            </button>
          </div>
          {/* Color Picker */}
          {activeOverlay.type === 'shape' && (
            <div className="flex items-center gap-2 w-full">
              <label className="text-xs text-gray-500">Fill</label>
              <input
                type="color"
                value={activeOverlay.fill}
                onChange={e => updateOverlay(activeOverlay.id, { fill: e.target.value })}
                className="w-7 h-7 border border-gray-300 rounded"
              />
              <label className="text-xs text-gray-500 ml-4">Border</label>
              <input
                type="color"
                value={activeOverlay.stroke}
                onChange={e => updateOverlay(activeOverlay.id, { stroke: e.target.value })}
                className="w-7 h-7 border border-gray-300 rounded"
              />
              <label className="text-xs text-gray-500 ml-4">Border Width</label>
              <input
                type="range"
                min="0"
                max="10"
                value={activeOverlay.strokeWidth}
                onChange={e => updateOverlay(activeOverlay.id, { strokeWidth: parseInt(e.target.value) })}
                className="w-16"
              />
              <span className="text-xs text-gray-600 w-8">{activeOverlay.strokeWidth}px</span>
            </div>
          )}
          {activeOverlay.type === 'emoji' && (
            <div className="flex items-center gap-2 w-full">
              <label className="text-xs text-gray-500">BG</label>
              <input
                type="color"
                value={activeOverlay.fill || '#ffffff00'}
                onChange={e => updateOverlay(activeOverlay.id, { fill: e.target.value })}
                className="w-7 h-7 border border-gray-300 rounded"
              />
            </div>
          )}
          {/* Opacity */}
          <div className="flex items-center gap-2 w-full">
            <label className="text-xs text-gray-500">Opacity</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={activeOverlay.opacity ?? 1}
              onChange={e => updateOverlay(activeOverlay.id, { opacity: parseFloat(e.target.value) })}
              className="w-24"
            />
            <span className="text-xs text-gray-600 w-8">{Math.round((activeOverlay.opacity ?? 1) * 100)}%</span>
          </div>
          {/* Layer Position Controls */}
          <div className="flex items-center gap-2 w-full">
            <label className="text-xs text-gray-500">Layer</label>
            <button onClick={() => bringToFront(activeOverlay.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Bring to Front"><FiChevronsUp /></button>
            <button onClick={() => bringForward(activeOverlay.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Bring Forward"><FiArrowUp /></button>
            <button onClick={() => sendBackward(activeOverlay.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Send Backward"><FiArrowDown /></button>
            <button onClick={() => sendToBack(activeOverlay.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Send to Back"><FiChevronsDown /></button>
          </div>
        </motion.div>
      )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
