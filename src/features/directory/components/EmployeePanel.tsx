import { Employee } from '../../../shared/types/directory.types';
import { useState, useEffect } from 'react';

interface EmployeePanelProps {
  employee: Employee | undefined;
  isOpen: boolean;
  onClose: () => void;
  onDeactivate: (employeeId: string) => Promise<{ success: boolean; message: string }>;
}

export const EmployeePanel = ({ employee, isOpen, onClose, onDeactivate }: EmployeePanelProps) => {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deactivateMessage, setDeactivateMessage] = useState<string | null>(null);

  // Clear message when employee changes or panel closes
  useEffect(() => {
    setDeactivateMessage(null);
    setShowConfirmDialog(false);
  }, [employee?.id, isOpen]);

  if (!employee) return null;

  const handleDeactivateClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!employee) return;
    
    setIsDeactivating(true);
    setDeactivateMessage(null);
    
    try {
      const result = await onDeactivate(employee.id);
      setDeactivateMessage(result.message);
      
      if (result.success) {
        setShowConfirmDialog(false);
        // The panel will be closed by the parent component
      }
    } catch (error) {
      setDeactivateMessage(error instanceof Error ? error.message : 'Failed to deactivate employee');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleCancelDeactivate = () => {
    setShowConfirmDialog(false);
    setDeactivateMessage(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          {/* Header with new close button design */}
          <div className="p-6 border-b">
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="mr-2">≡</span> {/* Menu icon */}
                Close panel
              </button>
            </div>

            {/* Profile Section */}
            <div className="text-center">
              <div className="mb-4">
                {employee.profile_pic_url ? (
                  <img
                    src={employee.profile_pic_url}
                    alt={`${employee.first_name} ${employee.last_name}`}
                    className="w-24 h-24 rounded-full mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
                    {employee.first_name[0]}{employee.last_name[0]}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold">{`${employee.first_name} ${employee.last_name}`}</h2>
              <p className="text-gray-600">{employee.role}</p>
              {!employee.Is_Employed && (
                <span className="inline-block mt-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  Past Employee
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-600">Phone: </span>
                  {employee.phone || 'Not provided'}
                </p>
                <p>
                  <span className="text-gray-600">Email: </span>
                  {employee.email}
                </p>
              </div>
            </div>

            {/* Groups */}
            <div>
              <h3 className="font-semibold mb-2">Groups</h3>
              <p className="text-gray-600">No groups assigned yet</p>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold mb-2">About me</h3>
              <p className="text-gray-600">About me not added yet</p>
            </div>

            {/* Responsibilities */}
            <div>
              <h3 className="font-semibold mb-2">Responsibilities</h3>
              <p className="text-gray-600">No responsibilities assigned yet</p>
            </div>

            {/* Admin Actions */}
            {employee.Is_Employed && (
              <div>
                <h3 className="font-semibold mb-2">Admin Actions</h3>
                <button
                  onClick={handleDeactivateClick}
                  disabled={isDeactivating}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  {isDeactivating ? 'Deactivating...' : 'Deactivate Employee'}
                </button>
                {deactivateMessage && (
                  <p className={`mt-2 text-sm ${deactivateMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {deactivateMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleCancelDeactivate} />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Deactivation
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to deactivate <strong>{employee.first_name} {employee.last_name}</strong>?
                <br /><br />
                <span className="text-red-600 font-medium">
                  ⚠️ This user will not be able to login immediately once deactivated.
                </span>
                <br />
                They will be marked as a past employee and removed from active directories.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelDeactivate}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeactivate}
                  disabled={isDeactivating}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
                >
                  {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
              {deactivateMessage && (
                <p className={`mt-4 text-sm ${deactivateMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {deactivateMessage}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}; 