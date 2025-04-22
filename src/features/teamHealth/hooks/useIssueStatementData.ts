import { useState, useEffect } from 'react';
import { getCompanyIssueStatements } from '../services/useIssueStatement';
import { getIssueStatementAnswers } from '../services/useIssueStatementAnswer';
import { IssueStatementWithAnswers } from '../types/issueStatement';

export const useIssueStatementData = (userId: string, companyId: string) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [issueStatements, setIssueStatements] = useState<IssueStatementWithAnswers[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!companyId || !userId) return;

            try {
                setLoading(true);
                setError(null);

                // Get all issue statements for the company
                const statements = await getCompanyIssueStatements(companyId);
                
                // Fetch answers for each issue statement
                const statementsWithAnswers = await Promise.all(
                    statements.map(async (statement) => {
                        const answers = await getIssueStatementAnswers(statement.id);
                        return {
                            ...statement,
                            answers
                        };
                    })
                );

                setIssueStatements(statementsWithAnswers);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch data'));
                console.error('Error fetching issue statements:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [companyId, userId]);

    return {
        loading,
        error,
        issueStatements,
        employeeId: userId || null
    };
}; 