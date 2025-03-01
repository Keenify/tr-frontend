import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';
import { CreateCalendarEventPayload, EventType } from '../types/calendar';
import { formatDateTimeForInput } from '../utils/dateUtils';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { loadGoogleMapsScript } from '../../../../utils/loadGoogleMapsScript';
import { Employee } from '../../../../shared/types/directory.types';
import Select from 'react-select';
import { MultiValue } from 'react-select';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: CreateCalendarEventPayload) => void;
  initialDate?: Date;
  employees: Employee[];
}

interface GooglePlace {
  label: string;
  value: {
    place_id: string;
  };
}

interface SelectOption {
  value: string;
  label: string;
}

const EVENT_TYPES: EventType[] = ['Booth', 'Meeting', 'Other'];

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  employees,
}) => {
  const [formData, setFormData] = useState<CreateCalendarEventPayload>({
    title: '',
    event_type: EVENT_TYPES[0],
    start_time: initialDate ? formatDateTimeForInput(initialDate.toISOString()) : '',
    end_time: initialDate ? formatDateTimeForInput(initialDate.toISOString()) : '',
    location: '',
    description: '',
    participant_ids: [],
  });

  const [locationValue, setLocationValue] = useState<GooglePlace | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setIsGoogleMapsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setIsGoogleMapsLoaded(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
    });
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log(`Field: ${name}, Value: ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlaceSelect = (place: GooglePlace | null) => {
    if (!place) return;
    
    const locationDescription = place.label;
    const placeId = place.value.place_id;
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationDescription)}&query_place_id=${placeId}`;
    
    setLocationValue(place);
    setFormData(prev => ({
      ...prev,
      location: `${locationDescription} - ${mapsLink}`,
    }));
  };

  const handleParticipantChange = (selectedOptions: MultiValue<SelectOption>) => {
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({
      ...prev,
      participant_ids: selectedIds,
    }));
  };

  if (!isOpen) return null;

  const employeeOptions = employees.map(employee => ({
    value: employee.id,
    label: `${employee.first_name} ${employee.last_name}`,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create Event</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors" 
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">
              Event Type
            </label>
            <select
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            {isGoogleMapsLoaded ? (
              <GooglePlacesAutocomplete
                apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                selectProps={{
                  value: locationValue,
                  onChange: handlePlaceSelect,
                  className: "mt-1",
                  classNamePrefix: "google-places",
                  placeholder: "Search for a location...",
                  styles: {
                    control: (provided) => ({
                      ...provided,
                      borderColor: '#D1D5DB',
                      borderRadius: '0.375rem',
                      '&:hover': {
                        borderColor: '#6366F1'
                      }
                    }),
                  }
                }}
              />
            ) : (
              <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                Loading Google Maps...
              </div>
            )}
            {formData.location && (
              <a
                href={formData.location.split(' - ')[1]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-500 mt-1 inline-block"
              >
                View on Google Maps
              </a>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
              Participants
            </label>
            <Select
              isMulti
              name="participants"
              options={employeeOptions}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Search and select participants..."
              onChange={handleParticipantChange}
              value={employeeOptions.filter(option => 
                formData.participant_ids?.includes(option.value)
              )}
              closeMenuOnSelect={false}
              isClearable={true}
              isSearchable={true}
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#D1D5DB',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#6366F1'
                  }
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#EEF2FF',
                  borderRadius: '0.375rem'
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#4F46E5',
                  fontWeight: 500
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: '#4F46E5',
                  '&:hover': {
                    backgroundColor: '#E0E7FF',
                    color: '#4338CA'
                  }
                })
              }}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal; 