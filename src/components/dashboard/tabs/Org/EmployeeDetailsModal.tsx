import { useState } from 'react';
import { X } from 'lucide-react';
import { OrgMember } from './types';

interface EmployeeDetailsModalProps {
  selectedEmployee: OrgMember | null;
  onClose: () => void;
}

export function EmployeeDetailsModal({ selectedEmployee, onClose }: EmployeeDetailsModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  if (!selectedEmployee) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full m-4"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex justify-between items-center mb-4 cursor-move">
          <h2 className="text-2xl font-bold text-indigo-600">Employee Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>
        <hr className="mb-4" />
        <table className="w-full text-left">
          <tbody>
            {Object.entries(selectedEmployee).map(([key, value]) => (
              key !== 'id' && (
                <tr key={key} className="border-t">
                  <th className="py-2 px-4 font-semibold text-gray-700">{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                  <td className="py-2 px-4 text-gray-600">
                    {Array.isArray(value) ? value.map((item, index) => (
                      <span key={index} className="block">{item.name || 'N/A'}</span>
                    )) : value || 'N/A'}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 