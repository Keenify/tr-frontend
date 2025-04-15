import React, { useState, useEffect, useRef } from 'react';
import { Label } from '../../types/label.types';

interface TrelloCardLabelManagerProps {
  companyId: string;
  // cardId: string; // Removed
  availableLabels: Label[];
  assignedLabelIds: string[];
  onToggleAssign: (labelId: string) => Promise<void>;
  onCreateLabel: (data: Pick<Label, 'text' | 'color_code' | 'company_id'>) => Promise<Label | null>;
  onUpdateLabel: (labelId: string, data: Partial<Pick<Label, 'text' | 'color_code'>>) => Promise<Label | null>;
  onDeleteLabel: (labelId: string) => Promise<boolean>;
  isEditable: boolean;
  showToast: (message: string, type: 'success' | 'error') => void;
  onClose: () => void; // Function to close the popover
}

export const TrelloCardLabelManager: React.FC<TrelloCardLabelManagerProps> = ({
  companyId,
  // cardId, // Removed
  availableLabels,
  assignedLabelIds,
  onToggleAssign,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  isEditable,
  showToast,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#CCCCCC'); // Default color
  const [editingLabel, setEditingLabel] = useState<Label | null>(null); // State for editing form
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose(); // Call the onClose prop when clicking outside
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleAssignToggle = async (labelId: string) => {
    if (!isEditable || isLoading) return;
    setIsLoading(true);
    try {
      await onToggleAssign(labelId);
      // Toast is handled in the parent after state update
    } catch (error) {
      console.error('Failed to toggle label assignment:', error);
      showToast('Failed to update assignment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    console.log('[TrelloCardLabelManager] handleCreate called.');

    // Ensure text is treated as string before trimming
    const textToSubmit = (typeof newLabelText === 'string' ? newLabelText : '').trim();

    const labelData = {
      text: textToSubmit,
      color_code: newLabelColor,
      company_id: companyId,
    };
    console.log('[TrelloCardLabelManager] Attempting to create label with data:', labelData);

    // Check for valid data *before* setting loading state
    if (!isEditable || isLoading || !labelData.text || !labelData.company_id) {
        console.log('[TrelloCardLabelManager] Create cancelled (not editable, loading, or missing data).');
        return;
    }
    setIsLoading(true); // Set loading *after* initial checks
    try {
      const newLabel = await onCreateLabel(labelData);
      if (newLabel) {
          setNewLabelText('');
          setNewLabelColor('#CCCCCC');
          showToast('Label created successfully', 'success');
          // Optionally auto-assign? Parent handles state updates.
      }
    } catch (error) {
      console.error('Failed to create label:', error);
      showToast('Failed to create label', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    console.log('[TrelloCardLabelManager] handleEdit called.');
    if (!isEditable || isLoading || !editingLabel || !editingLabel.text.trim()) {
        console.log('[TrelloCardLabelManager] Edit cancelled (conditions not met).');
        return;
    }
    setIsLoading(true);
    try {
      const updatedLabel = await onUpdateLabel(editingLabel.id, {
        text: editingLabel.text.trim(),
        color_code: editingLabel.color_code,
      });
      if (updatedLabel) {
          setEditingLabel(null); // Close edit form
          showToast('Label updated successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to update label:', error);
      showToast('Failed to update label', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (labelId: string) => {
    if (!isEditable || isLoading) return;
    if (!window.confirm("Are you sure you want to delete this label? This will remove it from all cards.")) {
      return;
    }
    setIsLoading(true);
    try {
      const success = await onDeleteLabel(labelId);
      if (success) {
          if (editingLabel?.id === labelId) {
              setEditingLabel(null); // Close edit form if deleting the edited label
          }
          showToast('Label deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to delete label:', error);
      showToast('Failed to delete label', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={popoverRef} 
      className="absolute z-20 mt-2 w-72 bg-white border rounded-md shadow-lg p-4 right-0 md:right-auto md:left-0"
      onClick={(e) => e.stopPropagation()} // Prevent click inside from closing immediately
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Manage Labels</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-md">
          <span className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></span>
        </div>
      )}

      {/* List of Available Labels */}
      <div className="space-y-2 max-h-40 overflow-y-auto mb-4 pr-2">
        <h5 className="text-xs font-semibold text-gray-500 mb-1 sticky top-0 bg-white">Available</h5>
        {availableLabels.length === 0 && !isLoading ? (
          <p className="text-xs text-gray-500">No labels created yet.</p>
        ) : (
          availableLabels.map(label => (
            <div key={label.id} className="flex items-center justify-between group">
              <label className="flex items-center cursor-pointer flex-grow mr-2 min-w-0" title={label.text}>
                <input
                  title="Assign/Unassign Label"
                  type="checkbox"
                  checked={assignedLabelIds.includes(label.id)}
                  onChange={() => handleAssignToggle(label.id)}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                  disabled={isLoading || !isEditable}
                />
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 flex-grow min-w-0"
                  style={{ backgroundColor: label.color_code + '33', color: label.color_code }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color_code }}></span>
                  <span className="truncate">{label.text}</span>
                </span>
              </label>
              {isEditable && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLabel({ ...label }); // Set label to edit, copy object
                        setNewLabelText(''); // Clear create form
                      }}
                      className="text-gray-500 hover:text-blue-600 p-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      title="Edit Label"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(label.id)}
                      className="text-gray-500 hover:text-red-600 p-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      title="Delete Label"
                    >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                    </button>
                  </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Label Area - No longer a form */} 
      {isEditable && (
        <div className="border-t pt-3 mt-3">
            <h5 className="text-xs font-semibold mb-2 text-gray-600">
                {editingLabel ? 'Edit Label' : 'Create New Label'}
            </h5>
            <div className="space-y-2">
              <input
                  type="text"
                  placeholder="Label name"
                  value={editingLabel ? editingLabel.text : newLabelText}
                  onChange={(e) => editingLabel ? setEditingLabel({...editingLabel, text: e.target.value}) : setNewLabelText(e.target.value)}
                  className="w-full px-2 py-1 border rounded-md text-sm"
                  required
                  disabled={isLoading}
              />
              <div className="flex items-center gap-2">
                  <input
                      title="Select label color"
                      type="color"
                      value={editingLabel ? editingLabel.color_code : newLabelColor}
                      onChange={(e) => editingLabel ? setEditingLabel({...editingLabel, color_code: e.target.value}) : setNewLabelColor(e.target.value)}
                      className="w-8 h-8 p-0.5 border rounded cursor-pointer flex-shrink-0"
                      disabled={isLoading}
                  />
                  <span className="text-xs text-gray-500 truncate flex-grow">
                      {editingLabel ? editingLabel.color_code : newLabelColor}
                  </span>
                  <div className="flex-shrink-0 flex gap-1">
                    {editingLabel && (
                      <button
                          type="button"
                          onClick={() => setEditingLabel(null)} // Cancel edit
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50"
                          disabled={isLoading}
                      >
                          Cancel
                      </button>
                    )}
                    <button
                        type="button" // Changed from submit to button
                        onClick={editingLabel ? handleEdit : handleCreate} // Call handler on click
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                        disabled={isLoading || (editingLabel ? !editingLabel.text.trim() : !newLabelText.trim())}
                    >
                        {editingLabel ? 'Save' : 'Create'}
                    </button>
                  </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};
