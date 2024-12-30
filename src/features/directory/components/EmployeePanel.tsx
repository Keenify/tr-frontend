import { Employee } from '../types/directory.types';

interface EmployeePanelProps {
  employee: Employee | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeePanel = ({ employee, isOpen, onClose }: EmployeePanelProps) => {
  if (!employee) return null;

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
          </div>
        </div>
      </div>
    </>
  );
}; 