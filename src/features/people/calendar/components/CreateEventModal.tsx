import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';
import { CreateCalendarEventPayload, EventType } from '../types/calendar';
import { formatDateTimeForInput, createISOString } from '../utils/dateUtils';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { loadGoogleMapsScript } from '../../../../utils/loadGoogleMapsScript';
import { Employee } from '../../../../shared/types/directory.types';
import Select, { MultiValue, SingleValue } from 'react-select';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: CreateCalendarEventPayload) => void;
  initialDate?: Date;
  employees: Employee[];
  currentUser: Employee;
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

const EVENT_TYPES: EventType[] = ['Booth', 'Meeting', '1 to 1 Meeting', 'Other'];

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  employees,
  currentUser,
}) => {
  // --- Calculate initial dates --- 
  const now = new Date();
  const initialStartTime = initialDate || now;
  const initialEndTime = initialDate ? new Date(initialDate) : new Date();
  // Default end time to 1 hour after start time if not provided
  if (!initialDate) {
    initialEndTime.setHours(initialEndTime.getHours() + 1);
  }
  const initialStartTimeISO = initialStartTime.toISOString();
  const initialEndTimeISO = initialEndTime.toISOString();
  // --- End Calculate initial dates ---

  const [formData, setFormData] = useState<CreateCalendarEventPayload>({
    title: '',
    event_type: EVENT_TYPES[0],
    start_time: initialStartTimeISO, // Use calculated initial ISO string
    end_time: initialEndTimeISO,   // Use calculated initial ISO string
    location: '',
    description: '',
    participant_ids: [],
  });

  const [dateTimeInputs, setDateTimeInputs] = useState({
    start_time: formatDateTimeForInput(initialStartTimeISO), // Use formatted initial value
    end_time: formatDateTimeForInput(initialEndTimeISO), // Use formatted initial value
  });

  const [locationValue, setLocationValue] = useState<GooglePlace | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);

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
    console.log('[CreateEventModal] handleSubmit called.');
    console.log('[CreateEventModal] Form Data:', formData);
    console.log('[CreateEventModal] Selected Manager ID:', selectedManagerId);
    console.log('[CreateEventModal] Current User:', currentUser);

    let finalParticipantIds: string[] = [];

    if (formData.event_type === '1 to 1 Meeting') {
      console.log('[CreateEventModal] Event type is 1 to 1 Meeting. Checking conditions...');
      // Ensure currentUser is available
      if (!currentUser || !currentUser.id) {
        console.error("[CreateEventModal] Validation Failed: Current user data is missing or invalid.");
        alert("Error: Cannot create event. Your user information is missing. Please refresh and try again.");
        return; // Prevent submission
      }

      // Ensure a manager is selected
      if (!selectedManagerId) {
         console.error("[CreateEventModal] Validation Failed: No manager selected.");
         alert("Please select a manager for the 1-to-1 meeting.");
         return; // Prevent submission
      }
      console.log('[CreateEventModal] 1-to-1 conditions met.');
      const ids = new Set<string>([currentUser.id, selectedManagerId]);
      finalParticipantIds = Array.from(ids);

    } else {
      console.log(`[CreateEventModal] Event type is ${formData.event_type}. Using participant_ids.`);
      // Optional: Add validation for minimum participants if needed for other types
      // if (!formData.participant_ids || formData.participant_ids.length === 0) {
      //   alert("Please select at least one participant.");
      //   return;
      // }
      finalParticipantIds = formData.participant_ids || [];
    }

    // Ensure start time is before end time
    console.log('[CreateEventModal] Checking start/end time order...');
    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      console.error('[CreateEventModal] Validation Failed: Start time is not before end time.');
      alert("Error: Start time must be before end time.");
      return;
    }
    console.log('[CreateEventModal] All validations passed. Calling onSubmit...');
    onSubmit({
      ...formData,
      participant_ids: finalParticipantIds,
    });
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'start_time' || name === 'end_time') {
      setDateTimeInputs(prev => ({
        ...prev,
        [name]: value
      }));
      
      const isoString = value ? createISOString(value) : '';
      setFormData((prev) => ({
        ...prev,
        [name]: isoString,
      }));
    } else if (name === 'event_type') {
      const newEventType = value as EventType;
      setFormData((prev) => ({
        ...prev,
        [name]: newEventType,
        participant_ids: newEventType === '1 to 1 Meeting' ? [] : prev.participant_ids,
      }));
      if (newEventType !== '1 to 1 Meeting') {
        setSelectedManagerId(null);
      }
      if (newEventType === '1 to 1 Meeting') {
         setFormData(prev => ({ ...prev, participant_ids: [] }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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

  const handleManagerChange = (selectedOption: SingleValue<SelectOption>) => {
    setSelectedManagerId(selectedOption ? selectedOption.value : null);
  };

  if (!isOpen) return null;

  // Filter out users whose first name is 'backup' (case-insensitive)
  const employeeOptions: SelectOption[] = employees
    .filter(employee => 
      employee.first_name.toLowerCase() !== 'backup' // Check first_name instead of role
    )
    .map(employee => ({
      value: employee.id,
      label: `${employee.first_name} ${employee.last_name}`,
    }));

  const managerOptions: SelectOption[] = employees
    // Filter for managers, excluding users whose first name is 'backup' (case-insensitive)
    .filter(employee => 
      employee.role && 
      employee.role.toLowerCase().includes('manager') &&
      employee.first_name.toLowerCase() !== 'backup' // Check first_name instead of role
    )
    .map(employee => ({
      value: employee.id,
      label: `${employee.first_name} ${employee.last_name}`,
    }));

  const selectedManagerOption = managerOptions.find(option => option.value === selectedManagerId) || null;
  const selectedParticipantOptions = employeeOptions.filter(option =>
    formData.participant_ids?.includes(option.value)
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-lg overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create Event</h2>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all duration-200" 
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1"
        >
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>

            {/* Event Type */}
            <div>
              <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Type
              </label>
              <select
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                required
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Start Time */}
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  value={dateTimeInputs.start_time}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors text-sm"
                  required
                  style={{ minWidth: "100%", width: "100%" }}
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  value={dateTimeInputs.end_time}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors text-sm"
                  required
                  style={{ minWidth: "100%", width: "100%" }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                        borderRadius: '0.5rem',
                        padding: '2px',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#6366F1'
                        }
                      }),
                      menu: (provided) => ({
                        ...provided,
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#6366F1' : state.isFocused ? '#EEF2FF' : 'white',
                        color: state.isSelected ? 'white' : '#374151',
                        cursor: 'pointer',
                        '&:active': {
                          backgroundColor: '#E0E7FF'
                        }
                      })
                    }
                  }}
                />
              ) : (
                <div className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 bg-gray-50 text-gray-500 text-sm">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading Google Maps...
                  </div>
                </div>
              )}
              {formData.location && (
                <a
                  href={formData.location.split(' - ')[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-1.5 inline-flex items-center group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="group-hover:underline">View on Google Maps</span>
                </a>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Participants / Manager Section - Conditional Rendering */}
            {formData.event_type === '1 to 1 Meeting' ? (
              // Manager Selection for '1 to 1 Meeting'
              <div>
                <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Manager
                </label>
                <Select // Use single Select
                  name="manager"
                  options={managerOptions}
                  className="basic-single-select"
                  classNamePrefix="select"
                  placeholder="Select a manager..."
                  onChange={handleManagerChange} // Use handleManagerChange
                  value={selectedManagerOption} // Use selectedManagerOption
                  isClearable={true}
                  isSearchable={true}
                  menuPortalTarget={document.body}
                  styles={{ // Reuse styles, adjust for single select if needed
                     control: (base) => ({
                       ...base,
                       borderColor: '#D1D5DB',
                       borderRadius: '0.5rem',
                       boxShadow: 'none',
                       padding: '1px',
                       '&:hover': {
                         borderColor: '#6366F1'
                       }
                     }),
                     menu: (base) => ({
                       ...base,
                       borderRadius: '0.5rem',
                       zIndex: 9999
                     }),
                     menuPortal: (base) => ({
                       ...base,
                       zIndex: 9999
                     }),
                     menuList: (base) => ({
                       ...base,
                       maxHeight: '220px',
                       overflowY: 'auto'
                     }),
                     option: (base, state) => ({
                       ...base,
                       backgroundColor: state.isSelected ? '#6366F1' : state.isFocused ? '#EEF2FF' : 'white',
                       color: state.isSelected ? 'white' : '#374151',
                       cursor: 'pointer'
                     })
                  }}
                />
                 {/* Add conditional rendering based on currentUser existence */}
                 {currentUser && (
                   <p className="mt-1.5 text-xs text-gray-500">
                     You ({currentUser.first_name} {currentUser.last_name}) will be automatically added as a participant.
                   </p>
                 )}
              </div>
            ) : (
              // Participants Selection for other event types
              <div>
                <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Participants
                </label>
                <Select // Use multi Select
                  isMulti
                  name="participants"
                  options={employeeOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Search and select participants..."
                  onChange={handleParticipantChange} // Use handleParticipantChange
                  value={selectedParticipantOptions} // Use selectedParticipantOptions
                  closeMenuOnSelect={false}
                  isClearable={true}
                  isSearchable={true}
                  menuPortalTarget={document.body}
                  styles={{ // Keep existing multi-select styles
                     control: (base) => ({
                       ...base,
                       borderColor: '#D1D5DB',
                       borderRadius: '0.5rem',
                       boxShadow: 'none',
                       padding: '1px',
                       '&:hover': {
                         borderColor: '#6366F1'
                       }
                     }),
                     multiValue: (base) => ({
                       ...base,
                       backgroundColor: '#EEF2FF',
                       borderRadius: '0.375rem',
                       margin: '2px 4px 2px 0',
                       padding: '0 2px'
                     }),
                     multiValueLabel: (base) => ({
                       ...base,
                       color: '#4F46E5',
                       fontWeight: 500,
                       padding: '2px 4px'
                     }),
                     multiValueRemove: (base) => ({
                       ...base,
                       color: '#4F46E5',
                       '&:hover': {
                         backgroundColor: '#E0E7FF',
                         color: '#4338CA'
                       }
                     }),
                     menu: (base) => ({
                       ...base,
                       borderRadius: '0.5rem',
                       zIndex: 9999
                     }),
                     menuPortal: (base) => ({
                       ...base,
                       zIndex: 9999
                     }),
                     menuList: (base) => ({
                       ...base,
                       maxHeight: '220px',
                       overflowY: 'auto'
                     }),
                     option: (base, state) => ({
                       ...base,
                       backgroundColor: state.isSelected ? '#6366F1' : state.isFocused ? '#EEF2FF' : 'white',
                       color: state.isSelected ? 'white' : '#374151',
                       cursor: 'pointer'
                     })
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
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