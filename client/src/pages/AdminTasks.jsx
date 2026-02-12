import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Search, Filter, CheckCircle, XCircle, MoreHorizontal,
    ArrowUpRight, Clock, FileText, DollarSign, User
} from 'lucide-react';

const AdminTasks = () => {
    const { user } = useAuth();
    const [claims, setClaims] = useState([]);
    const [filterStatus, setFilterStatus] = useState('Pending'); // Default to Pending for tasks

    const fetchClaims = async () => {
        try {
            if (user) {
                const data = await api.getClaims(null, 'admin');
                setClaims(data);
            }
        } catch (error) {
            console.error("Failed to fetch admin claims", error);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, [user]);

    const filteredClaims = useMemo(() => {
        return filterStatus === 'All'
            ? claims
            : claims.filter(c => c.status === filterStatus);
    }, [claims, filterStatus]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.updateClaimStatus(id, newStatus);
            fetchClaims(); // Refresh
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Approval Tasks</h2>
                    <p className="text-sm text-gray-500">Manage expense claims and travel requests</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                        {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === status
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">No tasks found for this filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClaims.map((claim) => (
                                <tr
                                    key={claim.id}
                                    onClick={() => window.location.href = `/claim/${claim.id}`}
                                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                                                {claim.User ? claim.User.name.charAt(0) : '?'}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {claim.User ? claim.User.name : `Unknown User (ID: ${claim.UserId})`}
                                                </div>
                                                <div className="text-xs text-gray-500">{claim.User ? claim.User.email : 'No email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium">{claim.title}</div>
                                        <div className="text-xs text-gray-500">{claim.type} {claim.description && `• ${claim.description.substring(0, 20)}...`}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {claim.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        ${claim.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border
                                            ${claim.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                claim.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {claim.status === 'Pending' ? (
                                            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleStatusUpdate(claim.id, 'Approved')}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm text-xs"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(claim.id, 'Rejected')}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors text-xs"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Action taken</span>
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

export default AdminTasks;
