export interface OrgMember {
  id: string;
  name: string;
  role: string;
  department: string;
  color: string;
  children?: OrgMember[];
}

export type Department = 'executive' | 'projects' | 'sales' | 'marketing' | 'operations';