import { Session } from '@supabase/supabase-js';
import React from 'react';
import CompanyHeader from './CompanyHeader';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { getBranchInfo } from '../utils/branchUtils';
import { Tab } from '@headlessui/react';
import { Paper } from '@mui/material';
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
                    {/* Header Section with Tabs */}
                    <div className="flex justify-between items-start gap-6">
                        <Tab.Group onChange={(index) => setBranch(index === 0 ? 'SG' : 'MY')}>
                            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                                <Tab
                                    className={({ selected }) =>
                                        `w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 flex items-center justify-center gap-2
                                        ${
                                            selected
                                                ? 'bg-white shadow text-blue-600'
                                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                                        }`
                                    }
                                >
                                    <img 
                                        src={sgFlag} 
                                        alt="Singapore"
                                        className="w-6 h-4 object-cover"
                                    />
                                    Singapore
                                </Tab>
                                <Tab
                                    className={({ selected }) =>
                                        `w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 flex items-center justify-center gap-2
                                        ${
                                            selected
                                                ? 'bg-white shadow text-blue-600'
                                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                                        }`
                                    }
                                >
                                    <img 
                                        src={myFlag} 
                                        alt="Malaysia"
                                        className="w-6 h-4 object-cover"
                                    />
                                    Malaysia
                                </Tab>
                            </Tab.List>
                        </Tab.Group>

                        <Paper elevation={1} className="flex-grow p-6 bg-white rounded-lg border border-gray-100">
                            <CompanyHeader companyInfo={companyInfo} branch={branch} />
                        </Paper>
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white rounded-lg">
                        <Tab.Group>
                            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/10 p-1">
                                <Tab
                                    className={({ selected }) =>
                                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                                        ${
                                            selected
                                                ? 'bg-white shadow'
                                                : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
                                        }`
                                    }
                                >
                                    B2B
                                </Tab>
                                <Tab
                                    className={({ selected }) =>
                                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                                        ${
                                            selected
                                                ? 'bg-white shadow'
                                                : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
                                        }`
                                    }
                                >
                                    Export
                                </Tab>
                            </Tab.List>
                            <Tab.Panels className="mt-2">
                                <Tab.Panel className="rounded-xl bg-white p-3">
                                    <QuotationB2B 
                                        session={session} 
                                        branch={branch}
                                        companyInfo={companyInfo}
                                        branchInfo={branchInfo}
                                    />
                                </Tab.Panel>
                                <Tab.Panel className="rounded-xl bg-white p-3">
                                    <QuotationExport 
                                        session={session} 
                                    />
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
