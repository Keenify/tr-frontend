import { Employee } from '../../../shared/types/directory.types';

interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
}

export const EmployeeCard = ({ employee, onClick }: EmployeeCardProps) => {
  const isPastEmployee = !employee.Is_Employed;

  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer hover:shadow-lg transition-all duration-200 bg-white rounded-lg shadow-sm overflow-hidden 
                 ${isPastEmployee ? 'opacity-60 hover:opacity-80' : ''}`}
    >
      {isPastEmployee && (
        <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
          Past
        </div>
      )}

      <div className={`aspect-square relative ${isPastEmployee ? 'grayscale' : ''}`}>
        {employee.profile_pic_url ? (
          <img
            src={employee.profile_pic_url}
            alt={`${employee.first_name} ${employee.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">
            {employee.first_name[0]}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900">
          {employee.first_name} {employee.last_name}
        </h3>
        <p className="text-gray-500 text-sm">{employee.role}</p>
      </div>
    </div>
  );
}; 