export const formatDateTimeForInput = (isoString: string) => {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    
    // Format to YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  export const createISOString = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toISOString();
  };