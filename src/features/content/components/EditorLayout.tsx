import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Step } from '../../../services/docService';

interface EditorLayoutProps {
  children: React.ReactNode;
  title: string;
  isEditingTitle: boolean;
  pendingTitle: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  onTitleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatToolbarChildren: React.ReactNode;
  mediaToolbarChildren: React.ReactNode;
  steps: Step[];
  activeStepIndex: number;
  setActiveStepIndex: (index: number) => void;
  onAddStep: () => void;
  onDeleteStep: (index: number) => void;
  onStepTitleChange: (index: number, title: string) => void;
  onTitleClick: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  title,
  isEditingTitle,
  pendingTitle,
  onTitleChange,
  onTitleBlur,
  onTitleKeyPress,
  formatToolbarChildren,
  mediaToolbarChildren,
  steps,
  activeStepIndex,
  setActiveStepIndex,
  onAddStep,
  onDeleteStep,
  onStepTitleChange,
  onTitleClick,
}) => {
  const [activeTab, setActiveTab] = useState('format');

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Steps</h2>
          <ul>
            {steps?.map((step, index) => (
              <li
                key={index}
                className={`mb-2 cursor-pointer ${
                  index === activeStepIndex ? 'bg-gray-200' : ''
                }`}
                onClick={() => setActiveStepIndex(index)}
              >
                <input
                  title="Step Title"
                  placeholder="Step Title"
                  type="text"
                  value={step.title}
                  onChange={(e) => onStepTitleChange(index, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={() => onDeleteStep(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={onAddStep}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Step
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-auto">
        <div className="editor-container min-h-screen bg-gray-100">
          <ToastContainer />
          {/* Fixed header section */}
          <div className="fixed top-0 left-64 right-0 z-50 bg-gray-100 pt-8">
            <div className="mx-auto px-4 space-y-4">
              {/* Title section */}
              <div className="bg-white shadow-lg rounded-lg p-6 relative">
                {isEditingTitle ? (
                  <div className="relative">
                    <input
                      type="text"
                      title="Topic Title"
                      placeholder="Topic Title"
                      value={pendingTitle}
                      onChange={(e) => onTitleChange(e.target.value)}
                      onBlur={onTitleBlur}
                      onKeyPress={onTitleKeyPress}
                      autoFocus
                      className="text-3xl font-bold w-full p-1 border rounded text-center"
                      maxLength={100}
                    />
                  </div>
                ) : (
                  <h1
                    className="text-3xl font-bold text-center cursor-pointer group relative"
                    onClick={onTitleClick}
                  >
                    <span className="group-hover:bg-gray-100 px-2 py-1 rounded">
                      {title}
                    </span>
                  </h1>
                )}
                <span className="absolute top-0 right-0 text-sm text-gray-500 p-2">
                  Topic
                </span>
              </div>
              {/* Toolbar section */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex flex-wrap justify-center space-x-2">
                  <button
                    className={`px-4 py-2 rounded ${
                      activeTab === 'format' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => setActiveTab('format')}
                  >
                    Format
                  </button>
                  <button
                    className={`px-4 py-2 rounded ${
                      activeTab === 'insert' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => setActiveTab('insert')}
                  >
                    Insert
                  </button>
                </div>
                <div className="bg-white shadow-lg rounded-lg p-2 flex flex-wrap justify-center space-x-2 w-full">
                  {activeTab === 'format' && formatToolbarChildren}
                  {activeTab === 'insert' && mediaToolbarChildren}
                </div>
              </div>
            </div>
          </div>
          {/* Scrollable content section */}
          <div className="pt-64 flex-1 overflow-auto">
            <div className="px-4">
              {steps && steps.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg mb-4">
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">
                      {steps[activeStepIndex]?.title}
                    </h2>
                    {children}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 