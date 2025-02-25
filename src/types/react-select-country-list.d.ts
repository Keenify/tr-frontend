declare module 'react-select-country-list' {
  interface Country {
    label: string;
    value: string;
  }
  
  function countryList(): {
    getData: () => Country[];
  };
  
  export default countryList;
} 