import React from 'react';
import { CompanyData } from '../../../shared/types/companyType';

interface CompanyHeaderProps {
    companyInfo: CompanyData;
}

const CompanyHeader: React.FC<CompanyHeaderProps> = ({ companyInfo }) => {
    const formatUrl = (url: string) => {
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            {companyInfo.logo_url && (
                <img src={companyInfo.logo_url} alt={`${companyInfo.name} logo`} style={{ height: '50px', marginRight: '20px' }} />
            )}
            <div>
                <h1 style={{ margin: 0 }}>{companyInfo.name}</h1>
                <p style={{ margin: 0 }}>{companyInfo.address}</p>
                <p style={{ margin: 0 }}>{companyInfo.phone}</p>
                <a href={formatUrl(companyInfo.website_url)} target="_blank" rel="noopener noreferrer">
                    {companyInfo.website_url}
                </a>
            </div>
        </div>
    );
};

export default CompanyHeader; 