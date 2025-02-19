import { Session } from '@supabase/supabase-js';
import React from 'react';
import CompanyHeader from './CompanyHeader';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { getBranchInfo } from '../utils/branchUtils';
import { Tab } from '@headlessui/react';
import { FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import { QuotationB2B } from './Quotation_B2B';
import { QuotationExport } from './Quotation_Export';
import sgFlag from '../../../assets/images/sg-flag.png';
import myFlag from '../../../assets/images/my-flag.png';

import '../styles/Quotation.css';

interface QuotationProps {
    session: Session;
}

const Quotation: React.FC<QuotationProps> = ({ session }) => {
    const { companyInfo, error } = useUserAndCompanyData(session.user.id);
    const [branch, setBranch] = React.useState<'SG' | 'MY'>('SG');

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (!companyInfo) {
        return <div>Loading...</div>;
    }

    const branchInfo = getBranchInfo(branch, companyInfo);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Paper 
                elevation={2} 
                className="max-w-7xl mx-auto rounded-xl overflow-hidden bg-white"
            >
                <div className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="flex justify-between items-start gap-6">
                        <FormControl variant="outlined" style={{ minWidth: 200 }}>
                            <InputLabel>Branch</InputLabel>
                            <Select
                                value={branch}
                                onChange={(e) => setBranch(e.target.value as 'SG' | 'MY')}
                                label="Branch"
                                renderValue={(selected) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img 
                                            src={selected === 'SG' ? sgFlag : myFlag} 
                                            alt={selected === 'SG' ? 'Singapore' : 'Malaysia'}
                                            style={{ width: '24px', height: '16px', objectFit: 'cover' }}
                                        />
                                        {selected === 'SG' ? 'Singapore' : 'Malaysia'}
                                    </div>
                                )}
                            >
                                <MenuItem value="SG">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img 
                                            src={sgFlag} 
                                            alt="Singapore"
                                            style={{ width: '24px', height: '16px', objectFit: 'cover' }}
                                        />
                                        Singapore
                                    </div>
                                </MenuItem>
                                <MenuItem value="MY">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img 
                                            src={myFlag} 
                                            alt="Malaysia"
                                            style={{ width: '24px', height: '16px', objectFit: 'cover' }}
                                        />
                                        Malaysia
                                    </div>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <Paper elevation={1} className="flex-grow p-6 bg-white rounded-lg border border-gray-100">
                            <CompanyHeader companyInfo={companyInfo} branch={branch} />
                        </Paper>
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white rounded-lg">
                        <Tab.Group>
                            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                                <Tab
                                    className={({ selected }) =>
                                        `w-full rounded-lg py-3 text-sm font-medium leading-5 transition-all
                                        ${selected 
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black ring-opacity-5'
                                            : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                                        }`
                                    }
                                >
                                    B2B
                                </Tab>
                                <Tab
                                    className={({ selected }) =>
                                        `w-full rounded-lg py-3 text-sm font-medium leading-5 transition-all
                                        ${selected 
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black ring-opacity-5'
                                            : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                                        }`
                                    }
                                >
                                    Export
                                </Tab>
                            </Tab.List>

                            <Tab.Panels className="mt-6">
                                <Tab.Panel>
                                    <QuotationB2B 
                                        session={session} 
                                        branch={branch}
                                        companyInfo={companyInfo}
                                        branchInfo={branchInfo}
                                    />
                                </Tab.Panel>
                                <Tab.Panel>
                                    <QuotationExport session={session} />
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>
                </div>
            </Paper>
        </div>
    );
};

export default Quotation;
