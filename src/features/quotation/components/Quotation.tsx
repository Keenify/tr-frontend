import { Session } from '@supabase/supabase-js';
import React from 'react';
import CompanyHeader from './CompanyHeader';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';

import '../styles/Quotation.css';
import { Tabs, Tab } from '@mui/material';
import { QuotationB2B } from './Quotation_B2B';
import { QuotationExport } from './Quotation_Export';

interface QuotationProps {
    session: Session;
}

const Quotation: React.FC<QuotationProps> = ({ session }) => {
    const { companyInfo, error } = useUserAndCompanyData(session.user.id);
    const [activeTab, setActiveTab] = React.useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="quotation-container">
            {companyInfo && (
                <div className="company-header-container">
                    <CompanyHeader companyInfo={companyInfo} />
                </div>
            )}

            <Tabs value={activeTab} onChange={handleTabChange} aria-label="quotation tabs">
                <Tab label="B2B" />
                <Tab label="Export" />
            </Tabs>

            {activeTab === 0 && <QuotationB2B session={session} />}
            {activeTab === 1 && <QuotationExport session={session} />}
        </div>
    );
};

export default Quotation;
