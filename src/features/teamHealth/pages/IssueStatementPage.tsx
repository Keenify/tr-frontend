import React, { useState } from 'react';
import { useIssueStatementData } from '../hooks/useIssueStatementData';
import IssueStatementCard from '../components/IssueStatementCard';
import { createIssueStatement } from '../services/useIssueStatement';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { IssueStatementWithAnswers } from '../types/issueStatement';
import { Session } from '@supabase/supabase-js';
import Masonry from 'react-masonry-css';

interface IssueStatementPageProps {
    session: Session;
}

export const IssueStatementPage: React.FC<IssueStatementPageProps> = ({ session }) => {
    const { userInfo, isLoading: isUserLoading, error: userError } = useUserAndCompanyData(session.user.id);
    
    const { issueStatements, loading, error, refreshData, employees } = useIssueStatementData(
        userInfo?.id || null,
        userInfo?.company_id || null
    );

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

    const breakpointColumns = {
        default: 3,
        1100: 2,
        700: 1
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
        <div className="px-4 py-6">
            <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ask a Question</h2>
                    <form onSubmit={handleSubmitStatement} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="What's your question?"
                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                disabled={isSubmitting}
                            />
                        </div>
                        {errorMessage && (
                            <div className="text-red-500 text-sm">{errorMessage}</div>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting || !newQuestion.trim()}
                            className="w-full p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Question'}
                        </button>
                    </form>
                </div>
            </div>

            {issueStatements && issueStatements.length > 0 ? (
                <div className="max-w-7xl mx-auto">
                    <Masonry
                        breakpointCols={breakpointColumns}
                        className="flex -ml-4 w-auto"
                        columnClassName="pl-4 bg-clip-padding"
                    >
                        {issueStatements.map((statement: IssueStatementWithAnswers) => (
                            <div key={statement.id} className="mb-4">
                                <IssueStatementCard
                                    statement={statement}
                                    onEdit={handleAnswerAdded}
                                    employees={employees.reduce((acc, emp) => ({ ...acc, [emp.id]: emp }), {})}
                                    currentUserId={userInfo?.id || ''}
                                />
                            </div>
                        ))}
                    </Masonry>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="text-gray-500 mb-6">
                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Questions Yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Be the first to ask a question! Your question will help improve team communication and collaboration.
                        </p>
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg inline-block">
                            <p className="font-medium mb-2">Tips for asking good questions:</p>
                            <ul className="list-disc list-inside space-y-1 text-left">
                                <li>Be specific and clear about your concern</li>
                                <li>Provide relevant context when needed</li>
                                <li>Be constructive and solution-oriented</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 