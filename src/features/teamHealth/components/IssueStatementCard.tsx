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
}

const IssueStatementCard: React.FC<IssueStatementCardProps> = ({
    statement,
    employees,
    onEdit,
    currentUserId,
}) => {
    const [newAnswer, setNewAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <div className="bg-white shadow rounded-lg mb-4">
            <Disclosure>
                {({ open }) => (
                    <>
                        <div className="flex items-center justify-between p-4">
                            <Disclosure.Button className="flex-1 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <UserAvatar
                                        name={`${employees[statement.employee_id]?.first_name || 'Unknown'} ${employees[statement.employee_id]?.last_name || 'Unknown'}`}
                                        imageUrl={employees[statement.employee_id]?.profile_pic_url}
                                    />
                                    <div>
                                        <h3 className="text-lg font-medium">{statement.question}</h3>
                                        <div className="text-sm text-gray-500 space-y-1">
                                            <p>
                                                Created by {`${employees[statement.employee_id]?.first_name || 'Unknown'} ${employees[statement.employee_id]?.last_name || 'Unknown'}`}
                                            </p>
                                            <p>
                                                {format(new Date(statement.created_at), 'MMM d, yyyy HH:mm')}
                                            </p>
                                            <p>
                                                {statement.answers.length} {statement.answers.length === 1 ? 'answer' : 'answers'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>
                                    ▼
                                </div>
                            </Disclosure.Button>
                        </div>
                        <Disclosure.Panel className="bg-gray-50">
                            <div className="p-4 space-y-4">
                                {statement.answers.map((answer: IssueStatementAnswerData) => (
                                    <div key={answer.id} className="bg-white rounded-lg shadow-sm p-4">
                                        <div className="flex items-start gap-2">
                                            <UserAvatar
                                                name={`${employees[answer.employee_id]?.first_name || 'Unknown'} ${employees[answer.employee_id]?.last_name || 'Unknown'}`}
                                                imageUrl={employees[answer.employee_id]?.profile_pic_url}
                                            />
                                            <div className="flex-1">
                                                <p className="text-gray-900">{answer.answer}</p>
                                                <div className="text-sm text-gray-500 mt-2">
                                                    <p>
                                                        Answered by {`${employees[answer.employee_id]?.first_name || 'Unknown'} ${employees[answer.employee_id]?.last_name || 'Unknown'}`}
                                                    </p>
                                                    <p>
                                                        {format(new Date(answer.created_at), 'MMM d, yyyy HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                            {answer.employee_id === currentUserId && (
                                                <button
                                                    onClick={handleDeleteAnswer}
                                                    data-answer-id={answer.id}
                                                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors duration-200"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <form onSubmit={handleSubmitAnswer} className="mt-4">
                                    <textarea
                                        value={newAnswer}
                                        onChange={(e) => setNewAnswer(e.target.value)}
                                        placeholder="Write your answer..."
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        rows={3}
                                    />
                                    {errorMessage && (
                                        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
                                    )}
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !newAnswer.trim()}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
        </div>
    );
};

export default IssueStatementCard; 