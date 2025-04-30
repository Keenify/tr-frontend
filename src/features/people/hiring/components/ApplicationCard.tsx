import React from 'react';
import { Edit2, Trash2, Briefcase, Calendar, Mail, Phone } from 'react-feather';
import { JobApplication } from '../types/hiring.types';
import useJobApplications from '../services/useJobApplications';

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: () => void;
  onDelete?: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onEdit, onDelete }) => {
  const { getCVSignedUrl } = useJobApplications();
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete ${application.full_name}'s application?`)) {
      setIsDeleting(true);
      try {
        if (onDelete) {
          await onDelete();
        }
      } catch (err) {
        console.error('Failed to delete application:', err);
        alert('Failed to delete application');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const handleViewCV = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!application.cv_file_path) {
      alert('No CV file available');
      return;
    }
    
    try {
      const url = await getCVSignedUrl(application.cv_file_path);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to get CV link:', err);
      alert('Failed to access CV file');
    }
  };

  // Helper function to format employment type for display
  const formatEmploymentType = (type: string): string => {
    const mapping: Record<string, string> = {
      'full-time': 'Full-time',
      'Full Time': 'Full-time',
      'part-time': 'Part-time',
      'Part Time': 'Part-time',
      'contract': 'Contract',
      'Contract': 'Contract',
      'internship': 'Internship',
      'Internship': 'Internship'
    };
    return mapping[type] || type;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{application.full_name}</h3>
          <div className="flex space-x-2">
            <button 
              onClick={onEdit}
              className="text-blue-500 hover:text-blue-700 transition-colors"
              title="Edit application"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Delete application"
              disabled={isDeleting}
            >
              <Trash2 size={18} className={isDeleting ? 'opacity-50' : ''} />
            </button>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Briefcase size={14} className="mr-2" />
            <span className="truncate">{application.job_applied_for} ({formatEmploymentType(application.employment_type as string)})</span>
          </div>
          
          <div className="flex items-center">
            <Mail size={14} className="mr-2" />
            <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline truncate">
              {application.email}
            </a>
          </div>
          
          <div className="flex items-center">
            <Phone size={14} className="mr-2" />
            <a href={`tel:${application.phone}`} className="text-blue-600 hover:underline">
              {application.phone}
            </a>
          </div>
          
          {application.available_start_date && (
            <div className="flex items-center">
              <Calendar size={14} className="mr-2" />
              <span>Available from: {new Date(application.available_start_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Applied: {new Date(application.created_at).toLocaleDateString()}
          </span>
          
          {application.cv_file_path && (
            <button
              onClick={handleViewCV}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View CV
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard; 