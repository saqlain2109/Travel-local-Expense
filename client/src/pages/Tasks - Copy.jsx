import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('Pending'); // Default to Pending

    const fetchData = async () => {
        try {
            if (user) {
                const isAdmin = user.role === 'admin';

                // 1. Fetch Claims
                const roleParam = isAdmin ? 'admin' : null;
                const userIdParam = isAdmin ? null : user.id;
                const claimsData = await api.getClaims(userIdParam, roleParam);

                if (!isAdmin) {
                    const tasks = claimsData.filter(c => c.approverId === user.id);
                    setClaims(tasks);
                } else {
                    setClaims(claimsData);
                }

                // 2. Fetch Pending Users (Only for Admin)
                if (isAdmin) {
                    const usersData = await api.getUsers();
                    const pending = usersData.filter(u => u.isActive === false);
                    setPendingUsers(pending);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const filteredClaims = useMemo(() => {
        return filterStatus === 'All'
            ? claims
            : claims.filter(c => c.status === filterStatus);
    }, [claims, filterStatus]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.updateClaimStatus(id, newStatus);
            fetchData(); // Refresh
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleUserApproval = async (id, approve) => {
        if (!window.confirm(approve ? "Activate this user?" : "Reject and delete this user registration?")) return;
        try {
            if (approve) {
                await api.updateUser(id, { isActive: true });
            } else {
                await api.deleteUser(id);
            }
            fetchData();
        } catch (error) {
            console.error("Failed to update user", error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage approvals for claims and new user registrations.</p>
                </div>
            </div>

            {/* Pending User Registrations Section (Admin Only) */}
            {user?.role === 'admin' && pendingUsers.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-900/40 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Pending User Registrations
                        </h3>
                        <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 text-xs font-bold px-2 py-1 rounded-full">{pendingUsers.length} Pending</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-amber-100/30 dark:bg-amber-900/30">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase">Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase">Email</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase">Department</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 dark:divide-amber-800/30">
                                {pendingUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-amber-900 dark:text-amber-100">{u.name}</td>
                                        <td className="px-6 py-4 text-amber-800 dark:text-amber-200">{u.email}</td>
                                        <td className="px-6 py-4 text-amber-800 dark:text-amber-200">{u.department}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUserApproval(u.id, true)}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleUserApproval(u.id, false)}
                                                    className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Approval Tasks</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Expense claims and travel requests.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </div>

                    <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 transition-colors">
                        {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === status
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">No tasks found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClaims.map((claim) => (
                                <tr
                                    key={claim.id}
                                    onClick={() => navigate(`/claim/${claim.id}`)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold uppercase">
                                                {claim.User ? claim.User.name.charAt(0) : '?'}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {claim.User ? claim.User.name : `Unknown User`}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{claim.User ? claim.User.email : ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white font-medium">{claim.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{claim.type} {claim.description && `• ${claim.description.substring(0, 20)}...`}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {claim.department || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {claim.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        ${parseFloat(claim.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border
                                            ${claim.status === 'Approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' :
                                                claim.status === 'Rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                                                    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'}`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {claim.status === 'Pending' && (user.role === 'admin' || user.id === claim.approverId) ? (
                                            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(claim.id, 'Approved'); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm text-xs"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(claim.id, 'Rejected'); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 transition-colors text-xs"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                {claim.status === 'Pending' ? 'Waiting' : 'Action taken'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Tasks;
