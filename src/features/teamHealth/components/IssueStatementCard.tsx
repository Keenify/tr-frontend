import React, { useState } from 'react';
import { IssueStatementWithAnswers } from '../types/issueStatement';
import { createIssueStatementAnswer, deleteIssueStatementAnswer, updateIssueStatementAnswer } from '../services/useIssueStatementAnswer';
import { format } from 'date-fns';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { UserData } from '../../../services/useUser';
import { UserAvatar } from './UserAvatar';
import { deleteIssueStatement, updateIssueStatement } from '../services/useIssueStatement';

interface IssueStatementCardProps {
    statement: IssueStatementWithAnswers;
    employeeId: string;
    onAnswerAdded: () => void;
    employees: Record<string, UserData>;
}

export const IssueStatementCard: React.FC<IssueStatementCardProps> = ({
    statement,
    employeeId,
    onAnswerAdded,
    employees
}) => {
    const [newAnswer, setNewAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [editingQuestion, setEditingQuestion] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState(statement.question);
    const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
    const [editedAnswer, setEditedAnswer] = useState('');

    const isQuestionOwner = statement.employee_id === employeeId;

    const handleSubmitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnswer.trim()) return;

        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            const payload = {
                answer: newAnswer.trim(),
                is_active: true,
                issue_statement_id: statement.id,
                employee_id: employeeId
            };

            await createIssueStatementAnswer(payload);
            setNewAnswer('');
            onAnswerAdded();
        } catch (err) {
            setErrorMessage('Failed to submit answer. Please try again.');
            console.error('Error submitting answer:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteQuestion = async () => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            await deleteIssueStatement(statement.id);
            onAnswerAdded(); // Use this to refresh the list
        } catch (err) {
            console.error('Error deleting question:', err);
        }
    };

    const handleUpdateQuestion = async () => {
        try {
            await updateIssueStatement(statement.id, {
                question: editedQuestion,
                is_active: true
            });
            setEditingQuestion(false);
            onAnswerAdded(); // Use this to refresh the list
        } catch (err) {
            console.error('Error updating question:', err);
        }
    };

    const handleDeleteAnswer = async (answerId: string) => {
        if (!window.confirm('Are you sure you want to delete this answer?')) return;
        try {
            await deleteIssueStatementAnswer(answerId);
            onAnswerAdded();
        } catch (err) {
            console.error('Error deleting answer:', err);
        }
    };

    const handleUpdateAnswer = async (answerId: string) => {
        try {
            await updateIssueStatementAnswer(answerId, {
                answer: editedAnswer,
                is_active: true
            });
            setEditingAnswerId(null);
            onAnswerAdded();
        } catch (err) {
            console.error('Error updating answer:', err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
            <Disclosure>
                {({ open }) => (
                    <>
                        <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 hover:bg-gray-50">
                            <div className="flex items-center flex-1">
                                <UserAvatar
                                    profileUrl={statement.employee?.profile_pic_url}
                                    firstName={statement.employee?.first_name}
                                    lastName={statement.employee?.last_name}
                                    size="md"
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">{statement.question}</h3>
                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                        <span className="font-medium text-gray-700">
                                            {statement.employee?.first_name} {statement.employee?.last_name}
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span>{format(new Date(statement.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
                                        <span className="mx-2">•</span>
                                        <span>{statement.answers.length} {statement.answers.length === 1 ? 'answer' : 'answers'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center ml-4">
                                {isQuestionOwner && (
                                    <div className="flex space-x-2 mr-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingQuestion(true);
                                            }}
                                            className="p-1 text-gray-500 hover:text-blue-500"
                                            title="Edit question"
                                            aria-label="Edit question"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteQuestion();
                                            }}
                                            className="p-1 text-gray-500 hover:text-red-500"
                                            title="Delete question"
                                            aria-label="Delete question"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <ChevronUpIcon
                                    className={`${
                                        open ? 'transform rotate-180' : ''
                                    } w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0`}
                                />
                            </div>
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
                                {editingQuestion ? (
                                    <div className="mb-4">
                                        <textarea
                                            value={editedQuestion}
                                            onChange={(e) => setEditedQuestion(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows={3}
                                            aria-label="Edit question text"
                                            placeholder="Edit your question..."
                                        />
                                        <div className="flex justify-end space-x-2 mt-2">
                                            <button
                                                onClick={() => setEditingQuestion(false)}
                                                className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateQuestion}
                                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {statement.answers.length > 0 ? (
                                    <div className="space-y-4 mb-6">
                                        {statement.answers.map((answer) => {
                                            const answerEmployee = employees[answer.employee_id];
                                            const isAnswerOwner = answer.employee_id === employeeId;

                                            return (
                                                <div key={answer.id} className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center mb-2">
                                                        <UserAvatar
                                                            profileUrl={answerEmployee?.profile_pic_url}
                                                            firstName={answerEmployee?.first_name}
                                                            lastName={answerEmployee?.last_name}
                                                            size="sm"
                                                            className="mr-2"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {answerEmployee?.first_name} {answerEmployee?.last_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {format(new Date(answer.created_at), 'MMM d, yyyy HH:mm:ss')}
                                                            </p>
                                                        </div>
                                                        {isAnswerOwner && (
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingAnswerId(answer.id);
                                                                        setEditedAnswer(answer.answer);
                                                                    }}
                                                                    className="p-1 text-gray-500 hover:text-blue-500"
                                                                    title="Edit answer"
                                                                    aria-label="Edit answer"
                                                                >
                                                                    <PencilIcon className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAnswer(answer.id)}
                                                                    className="p-1 text-gray-500 hover:text-red-500"
                                                                    title="Delete answer"
                                                                    aria-label="Delete answer"
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {editingAnswerId === answer.id ? (
                                                        <div>
                                                            <textarea
                                                                value={editedAnswer}
                                                                onChange={(e) => setEditedAnswer(e.target.value)}
                                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                                                                rows={3}
                                                                aria-label="Edit answer text"
                                                                placeholder="Edit your answer..."
                                                            />
                                                            <div className="flex justify-end space-x-2 mt-2">
                                                                <button
                                                                    onClick={() => setEditingAnswerId(null)}
                                                                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateAnswer(answer.id)}
                                                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-800">{answer.answer}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic mb-6">No answers yet. Be the first to respond!</p>
                                )}

                                <form onSubmit={handleSubmitAnswer} className="space-y-2">
                                    <textarea
                                        value={newAnswer}
                                        onChange={(e) => setNewAnswer(e.target.value)}
                                        placeholder="Write your answer..."
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        disabled={isSubmitting}
                                    />
                                    {errorMessage && (
                                        <div className="text-red-500 text-sm">{errorMessage}</div>
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