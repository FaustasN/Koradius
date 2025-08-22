import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  uploadType: 'gallery' | 'travel-packets';
  placeholder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  uploadType,
  placeholder = "Įkelkite nuotrauką arba įveskite URL",
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Galima įkelti tik nuotraukas');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Failo dydis negali viršyti 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload/${uploadType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Nepavyko įkelti failo');
      }

      const result = await response.json();
      onChange(result.url);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Nepavyko įkelti failo. Bandykite dar kartą.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setUploadError(null);
  };

  const handleRemoveImage = () => {
    onChange('');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* URL Input */}
      <div>
        <input
          type="url"
          value={value}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* File Upload Section */}
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-500">arba</div>
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 text-sm rounded-lg transition-colors duration-200"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
              <span>Įkeliama...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Įkelti failą</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {uploadError && (
        <div className="text-red-600 text-sm">{uploadError}</div>
      )}

      {/* Image preview */}
      {value && (
        <div className="relative inline-block">
          <div className="relative group">
            <img
              src={value}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              onError={() => setUploadError('Nepavyko užkrauti nuotraukos')}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 max-w-32 truncate">
            {value.split('/').pop()}
          </div>
        </div>
      )}

      {/* Upload instructions */}
      <div className="text-xs text-gray-500">
        Palaikomi formatai: JPG, PNG, GIF. Maksimalus dydis: 5MB
      </div>
    </div>
  );
};

export default ImageUpload;
