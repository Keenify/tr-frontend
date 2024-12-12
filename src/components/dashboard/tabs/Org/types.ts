export type OrgMember = {
  id: string;
  name: string;
  role: string;
  department?: string;
  children?: OrgMember[];
  email?: string;
  phone?: string;
  startDate?: string;
  manager?: string;
  location?: string;
}; 