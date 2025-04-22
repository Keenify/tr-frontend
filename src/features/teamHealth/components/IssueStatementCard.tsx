import React, { useState } from 'react';
import { IssueStatementWithAnswers } from '../types/issueStatement';
import { createIssueStatementAnswer } from '../services/useIssueStatementAnswer';
import { format } from 'date-fns';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

interface IssueStatementCardProps {
    statement: IssueStatementWithAnswers;
    employeeId: string;
    onAnswerAdded: () => void;
}

export const IssueStatementCard: React.FC<IssueStatementCardProps> = ({
    statement,
    employeeId,
    onAnswerAdded
}) => {
    const [newAnswer, setNewAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnswer.trim()) return;

        try {
            setIsSubmitting(true);
            setError(null);

            await createIssueStatementAnswer({
                answer: newAnswer.trim(),
                is_active: true,
                issue_statement_id: statement.id,
                employee_id: employeeId
            });

            setNewAnswer('');
            onAnswerAdded();
        } catch (err) {
            setError('Failed to submit answer. Please try again.');
            console.error('Error submitting answer:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
            <Disclosure defaultOpen>
                {({ open }) => (
                    <>
                        <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 hover:bg-gray-50">
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900">{statement.question}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Posted on {format(new Date(statement.created_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                            <ChevronUpIcon
                                className={`${
                                    open ? 'transform rotate-180' : ''
                                } w-5 h-5 text-gray-500 transition-transform duration-200`}
                            />
                        </Disclosure.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Disclosure.Panel className="px-6 py-4 bg-gray-50">
                                {statement.answers.length > 0 ? (
                                    <div className="space-y-4 mb-6">
                                        {statement.answers.map((answer) => (
                                            <div key={answer.id} className="bg-white rounded-lg p-4 shadow-sm">
                                                <p className="text-gray-700">{answer.answer}</p>
                                                <div className="text-sm text-gray-500 mt-2">
                                                    Answered on {format(new Date(answer.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic mb-6">No answers yet. Be the first to respond!</p>
                                )}

                                <form onSubmit={handleSubmitAnswer}>
                                    <div className="mb-3">
                                        <textarea
                                            value={newAnswer}
                                            onChange={(e) => setNewAnswer(e.target.value)}
                                            placeholder="Write your answer..."
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                            rows={3}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    {error && (
                                        <div className="text-red-500 text-sm mb-3">{error}</div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newAnswer.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                                    </button>
                                </form>
                            </Disclosure.Panel>
                        </Transition>
                    </>
                )}
            </Disclosure>
        </div>
    );
}; 