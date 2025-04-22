import React from 'react';
import { Session } from '@supabase/supabase-js';

interface IssueStatementProps {
    session: Session;
}

export const IssueStatement: React.FC<IssueStatementProps> = ({ session }) => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Hello World - Issue Statement</h1>
            <p>This is the Issue Statement page under Team Health.</p>
        </div>
    );
};

export default IssueStatement;
