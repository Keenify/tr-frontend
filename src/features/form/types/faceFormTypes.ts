export interface Company {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  company_id: string;
}

export interface FaceFormRow {
  function_name: string;
  accountable_employee_id: string;
  kpi_list: string;
  outcome_list: string;
  business_unit_name: string;
  head_employee_id: string;
}

export interface FaceFormDatabaseRow {
  company_id: string;
  employee_id: string;
  function_name: string;
  accountable_employee_id: string;
  kpi_list: string;
  outcome_list: string;
}

export interface BusinessUnitRow {
  business_unit_name: string;
  head_employee_id: string;
  kpi_list: string;
  outcome_list: string;
}

export interface FaceFormValues {
  company_id: string;
  functions: FaceFormRow[];
  business_units: BusinessUnitRow[];
}

export const formatKpiAsBulletPoints = (kpiList: string): string[] => {
  if (!kpiList || !kpiList.trim()) return [];
  
  return kpiList
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.startsWith('•') ? line : `• ${line}`);
};

export const formatOutcomeAsBulletPoints = (outcomeList: string): string[] => {
  if (!outcomeList || !outcomeList.trim()) return [];
  
  return outcomeList
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.startsWith('•') ? line : `• ${line}`);
};