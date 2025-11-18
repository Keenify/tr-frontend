import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LeaveRequest, CreateLeaveRequestPayload, LeaveType, HalfDayType, TimeoffType } from '../types/leaveRequest';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { uploadLeaveAttachment, deleteLeaveAttachment } from '../services/useLeaveAttachments';
import "react-datepicker/dist/react-datepicker.css";

interface EditLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<CreateLeaveRequestPayload>) => Promise<void>;
  request: LeaveRequest;
  companyEmployees: Array<{id: string; name: string}>;
}

export function EditLeaveRequestModal({
  isOpen,
  onClose,
  onSubmit,
  request,
  companyEmployees
}: EditLeaveRequestModalProps) {
  const [formData, setFormData] = useState({
    leave_type: '' as LeaveType,
    start_date: '',
    end_date: '',
    request_reason: '',
    half_day: null as HalfDayType,
    timeoff_type: 'days' as TimeoffType,
    timeoff_value: 0,
  });

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<string | undefined>('');

  // Pre-populate form when request changes
  useEffect(() => {
    if (request) {
      setFormData({
        leave_type: request.leave_type,
        start_date: request.start_date,
        end_date: request.end_date,
        request_reason: request.request_reason || '',
        half_day: request.half_day,
        timeoff_type: request.timeoff_type || 'days',
        timeoff_value: request.timeoff_value || 0,
      });
      setDateRange([
        new Date(request.start_date),
        new Date(request.end_date)
      ]);
      setCurrentAttachment(request.attachment_filepath);
      setSelectedFile(null);
    }
  }, [request]);

  const isSingleDayRequest = () => {
    if (!startDate || !endDate) return false;
    return startDate.toDateString() === endDate.toDateString();
  };

  const handleLeaveTypeChange = (type: LeaveType) => {
    setFormData(prev => ({
      ...prev,
      leave_type: type,
      half_day: null,
      timeoff_type: 'days',
      timeoff_value: 0,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDateChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
    if (update[0]) {
      setFormData(prev => ({
        ...prev,
        start_date: update[0]?.toISOString() || '',
        half_day: !update[1] || update[0]?.toDateString() === update[1]?.toDateString()
          ? prev.half_day
          : null
      }));
    }
    if (update[1]) {
      setFormData(prev => ({
        ...prev,
        end_date: update[1]?.toISOString() || ''
      }));
    }
  };

  // Client-side validation
  const validateForm = () => {
    // Check sick leave has attachment
    if (formData.leave_type === 'sick_leave') {
      if (!currentAttachment && !selectedFile) {
        toast.error('Medical certificate required for sick leave');
        return false;
      }
    }

    // Check timeoff has type and value
    if (formData.leave_type === 'timeoff') {
      if (!formData.timeoff_type || !formData.timeoff_value) {
        toast.error('Timeoff type and value are required');
        return false;
      }
      if (formData.timeoff_value < 0) {
        toast.error('Timeoff value cannot be negative');
        return false;
      }
    }

    // Check dates
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('End date must be after start date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentPath = currentAttachment;

      // Handle file upload for sick leave
      if (formData.leave_type === 'sick_leave' && selectedFile) {
        // Delete old attachment if exists
        if (currentAttachment) {
          try {
            await deleteLeaveAttachment(currentAttachment);
          } catch (error) {
            console.error('Failed to delete old attachment:', error);
          }
        }
        // Upload new attachment
        attachmentPath = await uploadLeaveAttachment(selectedFile);
      }

      const payload = {
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        request_reason: formData.request_reason,
        half_day: isSingleDayRequest() ? formData.half_day : null,
        timeoff_type: formData.timeoff_type,
        timeoff_value: formData.timeoff_value,
        attachment_filepath: attachmentPath,
      };

      await onSubmit(payload);
      onClose();
    } catch (error: any) {
      console.error('Edit failed:', error);

      // Enhanced error handling for backend validation
      if (error.response?.status === 400) {
        const message = error.response?.data?.detail || 'Validation error';
        toast.error(message);
      } else if (error.response?.status === 404) {
        toast.error('Leave request not found');
      } else {
        toast.error('Failed to update leave request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const employeeName = companyEmployees.find(emp => emp.id === request.employee_id)?.name || 'Unknown';

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Leave Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Employee Info (Read-only) */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <span className="font-medium text-gray-700">Employee:</span>{' '}
          <span className="text-gray-900">{employeeName}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select
                title="Leave Type"
                value={formData.leave_type}
                onChange={(e) => handleLeaveTypeChange(e.target.value as LeaveType)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Leave Type</option>
                <option value="annual_leave">Annual Leave</option>
                <option value="sick_leave">Sick Leave</option>
                <option value="timeoff">Time Off</option>
              </select>
            </div>

            {/* Date Selection */}
            {formData.leave_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Dates</label>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  isClearable={true}
                  placeholderText="Select start date - end date"
                  className="mt-1 block w-full min-w-[300px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  dateFormat="dd/MM/yyyy"
                  required
                />
              </div>
            )}

            {/* Half Day - Only for single-day annual leave */}
            {isSingleDayRequest() && formData.leave_type === 'annual_leave' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Day Type</label>
                <div className="space-x-4 flex items-center">
                  <label className="inline-flex items-center">
                    <input
                      title="Full Day"
                      type="radio"
                      checked={!formData.half_day}
                      onChange={() => setFormData(prev => ({ ...prev, half_day: null }))}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Full Day</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      title="AM Half Day"
                      type="radio"
                      checked={formData.half_day === 'AM'}
                      onChange={() => setFormData(prev => ({ ...prev, half_day: 'AM' }))}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">AM Half Day</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      title="PM Half Day"
                      type="radio"
                      checked={formData.half_day === 'PM'}
                      onChange={() => setFormData(prev => ({ ...prev, half_day: 'PM' }))}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">PM Half Day</span>
                  </label>
                </div>
              </div>
            )}

            {/* Time Off Fields */}
            {formData.leave_type === 'timeoff' && startDate && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Off Type</label>
                  <div className="space-x-4 flex items-center">
                    <label className="inline-flex items-center">
                      <input
                        title="Days"
                        type="radio"
                        value="days"
                        checked={formData.timeoff_type === 'days'}
                        onChange={() => setFormData(prev => ({ ...prev, timeoff_type: 'days', timeoff_value: 1 }))}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Days</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        title="Hours"
                        type="radio"
                        value="hours"
                        checked={formData.timeoff_type === 'hours'}
                        onChange={() => setFormData(prev => ({ ...prev, timeoff_type: 'hours', timeoff_value: 1 }))}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Hours</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.timeoff_type === 'hours' ? 'Hours' : 'Days'} Requested
                  </label>
                  <input
                    title="Time Off Value"
                    type="number"
                    min={formData.timeoff_type === 'hours' ? "0.25" : "1"}
                    step={formData.timeoff_type === 'hours' ? "0.25" : "1"}
                    value={formData.timeoff_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeoff_value: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  {formData.timeoff_type === 'hours' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Hours can be entered in 0.25 increments (0.25, 0.50, 0.75, etc.)
                    </p>
                  )}
                </div>
              </>
            )}

            {/* File Upload for Sick Leave */}
            {formData.leave_type === 'sick_leave' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Medical Certificate</label>
                {currentAttachment && !selectedFile && (
                  <p className="text-sm text-gray-600 mb-2">
                    Current: {currentAttachment.split('/').pop()}
                  </p>
                )}
                <input
                  title="Medical Certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {selectedFile ? `New file: ${selectedFile.name}` : 'Upload new file to replace current (PDF, JPG, PNG)'}
                </p>
              </div>
            )}

            {/* Reason Field */}
            {formData.leave_type && formData.leave_type !== 'sick_leave' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  title="Reason"
                  value={formData.request_reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, request_reason: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default EditLeaveRequestModal;
