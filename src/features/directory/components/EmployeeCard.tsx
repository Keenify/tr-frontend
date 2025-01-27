import { Employee } from '../types/directory.types';

interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
}

export const EmployeeCard = ({ employee, onClick }: EmployeeCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div className="aspect-square relative">
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