import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { file: File; type: string; title: string }) => void;
  uploadProgress: number;
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  uploadProgress 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<string>('Company');
  const [title, setTitle] = useState<string>('');

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedType('Company');
    setTitle('');
    onClose();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedFile && title) {
      onSubmit({ file: selectedFile, type: selectedType, title });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Upload File</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="file-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="file-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter file title"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['Company', 'Policies', 'Processes'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                    selectedType === type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <span>{type === 'Company' ? '📄' : type === 'Policies' ? '📝' : '📊'}</span>
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-gray-600">{selectedFile.name}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">
                  Drag and drop your file here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: PDF, DOC, DOCX
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploadProgress > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {uploadProgress === 100 ? 'Processing...' : `Uploading: ${uploadProgress}%`}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={uploadProgress > 0}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md 
                ${uploadProgress > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || !title || uploadProgress > 0}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md
                ${(!selectedFile || !title || uploadProgress > 0)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'}`}
            >
              {uploadProgress > 0 ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadFileModal;
