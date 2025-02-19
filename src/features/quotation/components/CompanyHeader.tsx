import React from 'react';
import { CompanyData } from '../../../shared/types/companyType';
import { getBranchInfo } from '../utils/branchUtils';

interface CompanyHeaderProps {
    companyInfo: CompanyData;
    branch: 'SG' | 'MY';
}

const CompanyHeader: React.FC<CompanyHeaderProps> = ({ companyInfo, branch }) => {
    const formatUrl = (url: string) => {
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    };

    const branchInfo = getBranchInfo(branch, companyInfo);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
            {companyInfo.logo_url && (
                <img 
                    src={companyInfo.logo_url} 
                    alt={`${branchInfo.name} logo`} 
                    style={{ height: '50px', marginBottom: '10px' }} 
                />
            )}
            <h1 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>{branchInfo.name}</h1>
            <p style={{ margin: '0 0 5px 0', textAlign: 'center', whiteSpace: 'pre-line' }}>{branchInfo.address}</p>
            <p style={{ margin: '0 0 5px 0', textAlign: 'center' }}>{branchInfo.phone}</p>
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