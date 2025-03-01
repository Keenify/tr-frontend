import React, { useEffect, useState } from 'react';
import { X } from 'react-feather';
import { CalendarEvent, CreateCalendarEventPayload, EventType } from '../types/calendar';
import { formatDateTimeForInput, createISOString } from '../utils/dateUtils';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { loadGoogleMapsScript } from '../../../../utils/loadGoogleMapsScript';
import { Employee } from '../../../../shared/types/directory.types';
import Select, { MultiValue } from 'react-select';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: CreateCalendarEventPayload) => void;
  event: CalendarEvent;
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

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  employees,
}) => {
  const initialEventType = EVENT_TYPES.includes(event.event_type as EventType) 
    ? event.event_type 
    : EVENT_TYPES[0];

  const [formData, setFormData] = useState<CreateCalendarEventPayload>({
    ...event,
    event_type: initialEventType,
    participant_ids: event.participants?.map(p => p.id) || [],
  });

  const [locationValue, setLocationValue] = useState<GooglePlace | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    setFormData({
      title: event.title,
      event_type: event.event_type,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || '',
      description: event.description || '',
      participant_ids: event.participants?.map(p => p.id) || [],
    });

    if (event.location) {
      const locationName = event.location.split(' - ')[0];
      setLocationValue({
        label: locationName,
        value: { place_id: '' }
      });
    } else {
      setLocationValue(null);
    }

    loadGoogleMapsScript()
      .then(() => {
        setIsGoogleMapsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setIsGoogleMapsLoaded(false);
      });
  }, [event]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
          <h2 className="text-xl font-bold text-gray-800">Edit Event</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" title="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">Event Type</label>
            <select
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formatDateTimeForInput(formData.start_time)}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                start_time: createISOString(e.target.value)
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              value={formatDateTimeForInput(formData.end_time)}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                end_time: createISOString(e.target.value)
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    borderColor: '#3B82F6'
                  }
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#EFF6FF',
                  borderRadius: '0.375rem'
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#2563EB',
                  fontWeight: 500
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: '#2563EB',
                  '&:hover': {
                    backgroundColor: '#DBEAFE',
                    color: '#1D4ED8'
                  }
                })
              }}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal; 