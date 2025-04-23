import { Disclosure } from '@headlessui/react';
import { UserData } from '../../../services/useUser';
import { UserAvatar } from './UserAvatar';
import { useState } from 'react';
import { IssueStatementWithAnswers, IssueStatementAnswerData } from '../types/issueStatement';
import { deleteIssueStatementAnswer, createIssueStatementAnswer } from '../services/useIssueStatementAnswer';
import { format } from 'date-fns';

interface IssueStatementCardProps {
    statement: IssueStatementWithAnswers;
    employees: Record<string, UserData>;
    onEdit: () => void;
    currentUserId: string;
    defaultOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

const IssueStatementCard: React.FC<IssueStatementCardProps> = ({
    statement,
    employees,
    onEdit,
    currentUserId,
    defaultOpen = false,
    onToggle
}) => {
    const [newAnswer, setNewAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleSubmitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnswer.trim()) return;

        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            await createIssueStatementAnswer({
                answer: newAnswer.trim(),
                is_active: true,
                issue_statement_id: statement.id,
                employee_id: currentUserId
            });
            
            setNewAnswer('');
            onEdit();
        } catch (err) {
            setErrorMessage('Failed to submit answer. Please try again.');
            console.error('Error submitting answer:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAnswer = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const answerId = event.currentTarget.getAttribute('data-answer-id');
        if (!answerId) return;

        try {
            await deleteIssueStatementAnswer(answerId);
            onEdit();
        } catch (err) {
            console.error('Error deleting answer:', err);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg mb-4 hover:shadow-md transition-shadow duration-200">
            <Disclosure defaultOpen={isOpen}>
                {({ open }) => {
                    if (open !== isOpen) {
                        setIsOpen(open);
                        onToggle?.(open);
                    }
                    return (
                        <>
                            <div className="p-5">
                                <Disclosure.Button className="w-full">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">
                                                {statement.question}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <p className="text-gray-400">
                                                    {format(new Date(statement.created_at), 'MMM d, yyyy HH:mm')}
                                                </p>
                                                <span className="text-gray-300">•</span>
                                                <div className="flex items-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statement.answers.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {statement.answers.length} {statement.answers.length === 1 ? 'answer' : 'answers'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex-shrink-0 ml-2 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </Disclosure.Button>
                            </div>
                            <Disclosure.Panel static>
                                {open && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                                        {statement.answers.map((answer: IssueStatementAnswerData) => (
                                            <div key={answer.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0">
                                                        <UserAvatar
                                                            name={`${employees[answer.employee_id]?.first_name || 'Unknown'} ${employees[answer.employee_id]?.last_name || 'Unknown'}`}
                                                            imageUrl={employees[answer.employee_id]?.profile_pic_url}
                                                            size="sm"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-900 whitespace-pre-wrap">{answer.answer}</p>
                                                        <div className="mt-2 flex items-center gap-3 text-sm">
                                                            <span className="font-medium text-gray-900">
                                                                {`${employees[answer.employee_id]?.first_name || 'Unknown'} ${employees[answer.employee_id]?.last_name || 'Unknown'}`}
                                                            </span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="text-gray-500">
                                                                {format(new Date(answer.created_at), 'MMM d, yyyy HH:mm')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {answer.employee_id === currentUserId && (
                                                        <button
                                                            onClick={handleDeleteAnswer}
                                                            data-answer-id={answer.id}
                                                            className="flex-shrink-0 text-sm font-medium text-red-500 hover:text-red-600 transition-colors duration-200"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        <form onSubmit={handleSubmitAnswer} className="mt-6">
                                            <textarea
                                                value={newAnswer}
                                                onChange={(e) => setNewAnswer(e.target.value)}
                                                placeholder="Write your answer..."
                                                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                                                rows={3}
                                            />
                                            {errorMessage && (
                                                <div className="mt-2 text-red-500 text-sm">{errorMessage}</div>
                                            )}
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !newAnswer.trim()}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </Disclosure.Panel>
                        </>
                    );
                }}
            </Disclosure>
        </div>
    );
};

export default IssueStatementCard; 