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
  kpi_better: string;
  kpi_faster: string;
  kpi_cheaper: string;
}

export interface FormValues {
  company_id: string;
  processes: ProcessRow[];
} 