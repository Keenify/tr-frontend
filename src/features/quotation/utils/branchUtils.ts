import { CompanyData, BranchInfo } from '../../../shared/types/companyType';

export const getBranchInfo = (branch: 'SG' | 'MY', companyInfo: CompanyData): BranchInfo => {
    if (branch === 'MY') {
        return {
            name: 'The Savoury Nosh Sdn Bhd',
            phone: '+6011-1323 5230',
            address: 'B-3A-22, Empire Soho,Empire Subang,Jalan SS16/1, SS16, 47500 Subang Jaya,Selangor.'
        };
    }
    return {
        name: companyInfo.name,
        phone: companyInfo.phone,
        address: companyInfo.address
    };
}; 