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
    const [openCards, setOpenCards] = useState<Set<string>>(new Set());

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

    const handleCardToggle = (statementId: string, isOpen: boolean) => {
        setOpenCards(prev => {
            const newSet = new Set(prev);
            if (isOpen) {
                newSet.add(statementId);
            } else {
                newSet.delete(statementId);
            }
            return newSet;
        });
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
        <div className="px-4 py-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Share an Issue Statement</h2>
                        <p className="text-gray-600 mb-6">
                            Help improve our team by sharing issues that need attention. Your statement will be anonymous, 
                            allowing the team to openly discuss and brainstorm solutions together.
                        </p>
                        <form onSubmit={handleSubmitStatement} className="space-y-4">
                            <div>
                                <textarea
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    placeholder="What issue would you like the team to address? Be specific about the challenge or situation that needs improvement..."
                                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 min-h-[120px] resize-none"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errorMessage && (
                                <div className="text-red-500 text-sm">{errorMessage}</div>
                            )}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500 flex items-center">
                                    <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Anonymous submission
                                </p>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newQuestion.trim()}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span>Submit Issue Statement</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {issueStatements && issueStatements.length > 0 ? (
                <div className="max-w-7xl mx-auto">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 px-4">Team Issue Statements</h3>
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
                                    defaultOpen={openCards.has(statement.id)}
                                    onToggle={(isOpen) => handleCardToggle(statement.id, isOpen)}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Be the First to Submit an Issue Statement</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Your input is crucial for team improvement. Share an issue statement anonymously and let's work together to find solutions.
                        </p>
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg inline-block">
                            <p className="font-medium mb-2">Tips for effective issue statements:</p>
                            <ul className="list-disc list-inside space-y-1 text-left">
                                <li>Clearly describe the specific issue or challenge</li>
                                <li>Explain the impact on team or work</li>
                                <li>Be objective and factual</li>
                                <li>Focus on improvement opportunities</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 