import React, { useState } from "react";
import { createTrelloCardAttachment } from "../services/useTrelloCards";

interface AttachmentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  onUploadSuccess: () => void;
}

const AttachmentUploadModal: React.FC<AttachmentUploadModalProps> = ({
  isOpen,
  onClose,
  cardId,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isThumbnail, setIsThumbnail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsSuccess(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setIsSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (file) {
      setIsLoading(true);
      try {
        await createTrelloCardAttachment(cardId, file, isThumbnail);
        console.log("Attachment uploaded successfully");
        setIsSuccess(true);
        onUploadSuccess();
        onClose();
      } catch (error) {
        console.error("Failed to upload attachment:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Upload Attachment</h2>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-dashed border-2 border-gray-300 p-4 text-center"
        >
          Drag and drop a file here or
          <input type="file" onChange={handleFileChange} className="mt-2" />
        </div>
        {file && file.type.startsWith("image/") && (
          <div className="mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isThumbnail}
                onChange={() => setIsThumbnail(!isThumbnail)}
              />
              <span className="ml-2">Set as Thumbnail</span>
            </label>
          </div>
        )}
        {isLoading && <div className="mt-2">Uploading...</div>}
        {isSuccess && <div className="mt-2 text-green-500">Upload successful!</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!file || isLoading}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentUploadModal; 