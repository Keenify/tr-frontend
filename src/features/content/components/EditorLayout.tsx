import React from 'react';
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
  toolbarChildren: React.ReactNode;
  steps: Step[];
  activeStepIndex: number;
  setActiveStepIndex: (index: number) => void;
  onAddStep: () => void;
  onDeleteStep: (index: number) => void;
  onStepTitleChange: (index: number, title: string) => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  title,
  isEditingTitle,
  pendingTitle,
  onTitleChange,
  onTitleBlur,
  onTitleKeyPress,
  toolbarChildren,
  steps,
  activeStepIndex,
  setActiveStepIndex,
//   onAddStep,
//   onDeleteStep,
  onStepTitleChange,
}) => {
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
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-auto">
        <div className="editor-container min-h-screen bg-gray-100 p-4">
          <ToastContainer />
          {/* Fixed header section */}
          <div className="fixed top-0 left-64 right-0 z-50 bg-gray-100 px-4 pt-4">
            <div className="mx-auto max-w-3xl space-y-4">
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
                    onClick={() => onTitleChange(title)}
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
              <div className="bg-white shadow-lg rounded-lg p-2 flex justify-center space-x-2">
                {toolbarChildren}
              </div>
            </div>
          </div>
          {/* Scrollable content section */}
          <div className="pt-40 flex-1 overflow-auto">
            <div className="mx-auto max-w-3xl">
              {steps && steps.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg p-6 mb-4">
                  <h2 className="text-xl font-bold mb-4">
                    {steps[activeStepIndex]?.title}
                  </h2>
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 