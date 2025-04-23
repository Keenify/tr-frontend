import React, { useState, useEffect } from 'react';
import { useIssueStatementData } from '../hooks/useIssueStatementData';
import { IssueStatementCard } from '../components/IssueStatementCard';
import { createIssueStatement } from '../services/useIssueStatement';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { IssueStatementWithAnswers } from '../types/issueStatement';
import { Session } from '@supabase/supabase-js';

interface IssueStatementPageProps {
    session: Session;
}

export const IssueStatementPage: React.FC<IssueStatementPageProps> = ({ session }) => {
    const { userInfo, isLoading: isUserLoading, error: userError } = useUserAndCompanyData(session.user.id);
    
    const { issueStatements, loading, error, employeeId, refreshData, employees } = useIssueStatementData(
        userInfo?.id || null,
        userInfo?.company_id || null
    );

    useEffect(() => {
        if (userInfo) {
            console.log('Company ID:', userInfo.company_id);
            console.log('Employee ID:', userInfo.id);
            console.log('Issue Statements:', issueStatements);
        }
    }, [userInfo, issueStatements]);

    const [newQuestion, setNewQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmitStatement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || !userInfo?.id) return;

        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            const payload = {
                question: newQuestion.trim(),
                description: '',
                is_active: true,
                company_id: userInfo?.company_id || '',
                employee_id: userInfo?.id || ''
            };

            console.log('Creating issue statement with payload:', payload);

            await createIssueStatement(payload);
            setNewQuestion('');
            await refreshData();
        } catch (err) {
            setErrorMessage('Failed to create issue statement. Please try again.');
            console.error('Error creating issue statement:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAnswerAdded = async () => {
        await refreshData();
    };

    if (isUserLoading || loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (userError || error) {
        console.error('User Error:', userError);
        console.error('Issue Statement Error:', error);
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500">
                    {userError?.message || error?.message || 'Error loading data. Please try again later.'}
                </div>
            </div>
        );
    }

    if (!userInfo?.id) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500">User information not available. Please try again later.</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Ask a Question</h2>
                    <form onSubmit={handleSubmitStatement} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="What's your question?"
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>
                        {errorMessage && (
                            <div className="text-red-500 text-sm">{errorMessage}</div>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting || !newQuestion.trim()}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Question'}
                        </button>
                    </form>
                </div>

                {issueStatements && issueStatements.length > 0 ? (
                    <div className="space-y-4">
                        {issueStatements.map((statement: IssueStatementWithAnswers) => (
                            <div key={statement.id}>
                                <IssueStatementCard
                                    statement={statement}
                                    employeeId={employeeId || ''}
                                    onAnswerAdded={handleAnswerAdded}
                                    employees={employees}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                        <div className="text-gray-500 mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                        <p className="text-gray-500 mb-4">
                            Be the first to ask a question! Your question will help improve team communication and collaboration.
                        </p>
                        <div className="text-sm text-gray-500">
                            <p>Tips for asking good questions:</p>
                            <ul className="list-disc list-inside mt-2">
                                <li>Be specific and clear about your concern</li>
                                <li>Provide relevant context when needed</li>
                                <li>Be constructive and solution-oriented</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}; 