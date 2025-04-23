import { useState, useEffect, useCallback } from 'react';
import { IssueStatementWithAnswers, UseIssueStatementDataReturn } from '../types/issueStatement';
import { getCompanyIssueStatements } from '../services/useIssueStatement';
import { getIssueStatementAnswers } from '../services/useIssueStatementAnswer';
import { getAllEmployees, UserData } from '../../../services/useUser';

export const useIssueStatementData = (userId: string | null, companyId: string | null): UseIssueStatementDataReturn => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [issueStatements, setIssueStatements] = useState<IssueStatementWithAnswers[]>([]);
    const [employees, setEmployees] = useState<Record<string, UserData>>({});
    const employeeId = userId;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!employeeId || !companyId) {
                throw new Error('Employee ID and Company ID are required');
            }

            // Fetch all employees
            const allEmployees = await getAllEmployees(companyId);
            const employeesMap = allEmployees.reduce((acc, employee) => {
                acc[employee.id] = employee;
                return acc;
            }, {} as Record<string, UserData>);
            setEmployees(employeesMap);

            // Fetch issue statements using the API endpoint
            const statements = await getCompanyIssueStatements(companyId);
            console.log('Fetched statements:', statements);

            // Fetch answers for each statement
            const statementsWithAnswers = await Promise.all(
                statements.map(async (statement) => {
                    const answers = await getIssueStatementAnswers(statement.id);
                    console.log(`Answers for statement ${statement.id}:`, answers);
                    return {
                        ...statement,
                        answers,
                        employee: employeesMap[statement.employee_id]
                    };
                })
            );

            setIssueStatements(statementsWithAnswers);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
        } finally {
            setLoading(false);
        }
    }, [employeeId, companyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refreshData = async () => {
        await fetchData();
    };

    return {
        loading,
        error,
        issueStatements,
        employeeId,
        refreshData,
        employees: Object.values(employees)
    };
}; 