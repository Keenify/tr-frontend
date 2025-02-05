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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
            {companyInfo.logo_url && (
                <img 
                    src={companyInfo.logo_url} 
                    alt={`${companyInfo.name} logo`} 
                    style={{ height: '50px', marginBottom: '10px' }} 
                />
            )}
            <h1 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>{companyInfo.name}</h1>
            <p style={{ margin: '0 0 5px 0', textAlign: 'center' }}>{companyInfo.address}</p>
            <p style={{ margin: '0 0 5px 0', textAlign: 'center' }}>{companyInfo.phone}</p>
            <a 
                href={formatUrl(companyInfo.website_url)} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ margin: 0, textAlign: 'center' }}
            >
                {companyInfo.website_url}
            </a>
        </div>
    );
};

export default CompanyHeader; 