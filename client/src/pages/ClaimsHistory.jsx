import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, Search, Filter, FileText, ChevronRight, Download, Calendar, DollarSign, MapPin, User } from 'lucide-react';
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
            Department: claim.department,
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
            const data = await api.getClaims(null, user.role === 'admin' ? 'admin' : null);
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
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this claim record?")) {
            try {
                await api.deleteClaim(id);
                fetchClaims();
            } catch (error) {
                console.error("Failed to delete claim", error);
            }
        }
    };

    const filteredClaims = claims.filter(claim => {
        const matchesSearch =
            claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (claim.User?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (claim.department || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || claim.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Claims History</h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track, search and export all past expense records</p>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
                >
                    <Download className="w-4 h-4" />
                    <span>Export to Excel</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search title, employee, department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {['All', 'Travel', 'Expense', 'Local'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                filterType === type
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Display */}
            {filteredClaims.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">No claims found</h3>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter criteria.</p>
                </div>
            ) : (
                <>
                    {/* Mobile View: Interactive Cards */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                        {filteredClaims.map(claim => (
                            <div
                                key={claim.id}
                                onClick={() => navigate(`/claim/${claim.id}`)}
                                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm active:scale-[0.99] transition-all flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                                            claim.type === 'Travel' ? 'bg-orange-500' : 'bg-blue-600'
                                        }`}>
                                            {claim.type === 'Travel' ? <MapPin className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{claim.title}</h4>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{claim.type} • {claim.date}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex-shrink-0 ${
                                        claim.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                        claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    }`}>
                                        {claim.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/70 text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Employee: <strong className="text-gray-800 dark:text-gray-200">{claim.User?.name || 'Self'}</strong>
                                    </span>
                                    <span className="text-base font-black text-gray-900 dark:text-white">
                                        ${parseFloat(claim.amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View: Full Table */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Claim Details</th>
                                    <th className="py-3.5 px-6">Employee</th>
                                    <th className="py-3.5 px-6">Date</th>
                                    <th className="py-3.5 px-6">Amount</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {filteredClaims.map(claim => (
                                    <tr
                                        key={claim.id}
                                        onClick={() => navigate(`/claim/${claim.id}`)}
                                        className="hover:bg-blue-50/50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                                    >
                                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs ${claim.type === 'Travel' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                                    {claim.type === 'Travel' ? <MapPin className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <span className="block font-semibold">{claim.title}</span>
                                                    <span className="text-xs text-gray-400">{claim.type} • {claim.department}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{claim.User?.name || 'Unknown'}</td>
                                        <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{claim.date}</td>
                                        <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">${parseFloat(claim.amount).toFixed(2)}</td>
                                        <td className="py-4 px-6">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                                                claim.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={(e) => handleDelete(e, claim.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="Delete Claim"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ClaimsHistory;
