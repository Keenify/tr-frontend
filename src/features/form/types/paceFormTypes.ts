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

export interface ProcessRow {
  employee_id: string;
  process_name: string;
  kpi_list: string;
}

export interface FormValues {
  company_id: string;
  processes: ProcessRow[];
}

export const formatKpiAsBulletPoints = (kpiList: string): string[] => {
  if (!kpiList || !kpiList.trim()) return [];
  
  return kpiList
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.startsWith('•') ? line : `• ${line}`);
};