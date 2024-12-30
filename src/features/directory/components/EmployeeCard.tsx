import { Employee } from '../types/directory.types';

interface EmployeeCardProps {
  employee: Employee;
}

export const EmployeeCard = ({ employee }: EmployeeCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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