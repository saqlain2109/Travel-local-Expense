import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle, User, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.getUsers();
                const sortedUsers = data.sort((a, b) => a.name.localeCompare(b.name));
                setUsers(sortedUsers);
            } catch (err) {
                console.error("Failed to fetch users", err);
                setError("Failed to load employee list. Please try refreshing.");
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username) {
            setError("Please select a user.");
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const data = await api.forgotPassword(username);
            setIsSubmitted(true);
            setMessage(data.message);
        } catch (err) {
            console.error("Forgot Password Failed", err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4 shadow-sm">
                            <LockIcon className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
                        <p className="text-gray-500 text-sm mt-2">Select your name from the list and we'll send you a new password.</p>
                    </div>

                    {isSubmitted ? (
                        <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold text-green-800 mb-2">Request Sent!</h3>
                            <p className="text-sm text-green-700 mb-6">{message}</p>
                            <Link to="/" className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-green-600/20 transition-all">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    {isLoadingUsers ? (
                                        <div className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                                            Loading employees...
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">-- Choose your name --</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.username}>
                                                    {u.name} ({u.department})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isLoadingUsers}
                                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                            >
                                {isLoading ? 'Sending...' : 'Send New Password'}
                                {!isLoading && <Send className="w-4 h-4 ml-1" />}
                            </button>

                            <div className="text-center mt-6">
                                <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1 transition-colors group">
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Icon Component
const LockIcon = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

export default ForgotPassword;
