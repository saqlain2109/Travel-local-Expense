import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, Search, Filter, FileText, ChevronRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ClaimsHistory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(claims.map(claim => ({
            ID: claim.id,
            Employee: claim.User?.name || 'Unknown',
            Email: claim.User?.email,
            Type: claim.type,
            Date: claim.date,
            Amount: claim.amount,
            Status: claim.status
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Claims History");
        XLSX.writeFile(workbook, "Claims_History.xlsx");
    };

    const fetchClaims = async () => {
        try {
            // If admin, fetch all (using 'admin' role param if backend supports it, or just plain fetch)
            // The existing backend logic: if role === 'admin', it returns all.
            // if userId is passed, it filters by user.
            // So for admin history, we want EVERYTHING.
            const data = await api.getClaims(null, user.role === 'admin' ? 'admin' : null);

            // If user is NOT admin, we should only fetch their own claims.
            // The api.getClaims logic in UI calls: api.getClaims(user.id) for users.
            // api.getClaims(null, 'admin') for admins.

            if (user.role !== 'admin') {
                const userData = await api.getClaims(user.id);
                setClaims(userData);
            } else {
                setClaims(data);
            }

        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    useEffect(() => {
        if (user) fetchClaims();
    }, [user]);

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent row click
        if (window.confirm("Are you sure you want to permanently delete this record?")) {
            try {
                await api.deleteClaim(id);
                fetchClaims(); // Refresh
            } catch (error) {
                console.error("Failed to delete claim", error);
                alert("Failed to delete claim");
            }
        }
    };

    const filteredClaims = claims.filter(claim => {
        const matchesSearch =
            claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (claim.User?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || claim.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Claims History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage all past travel and expense records.</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                    {['All', 'Travel', 'Expense'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === type
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Title & Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No records found.
                                    </td>
                                </tr>
                            ) : filteredClaims.map((claim) => (
                                <tr
                                    key={claim.id}
                                    onClick={() => navigate(`/claim/${claim.id}`)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        {claim.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{claim.title}</div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${claim.type === 'Travel' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                            }`}>
                                            {claim.type || 'Expense'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {claim.User ? claim.User.name : 'Unknown User'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                        ${claim.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase ${claim.status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                            claim.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                            }`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Navigate Arrow */}
                                            <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />

                                            {/* Admin Delete Action */}
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={(e) => handleDelete(e, claim.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-2"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default ClaimsHistory;
