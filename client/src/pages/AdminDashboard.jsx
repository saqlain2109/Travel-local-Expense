import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Users, DollarSign, Clock, CheckCircle, BarChart,
    Briefcase, FileText, TrendingUp, AlertCircle, Download,
    Printer, Filter, Search, MapPin
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart as RechartsBarChart, Bar,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line
} from 'recharts';
import { gsap } from 'gsap';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [claims, setClaims] = useState([]);
    const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'analytics' | 'reports'
    const [reportSearch, setReportSearch] = useState('');
    const [reportTypeFilter, setReportTypeFilter] = useState('All');
    const containerRef = useRef(null);

    // Initial Fetch
    useEffect(() => {
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
        fetchClaims();
    }, [user]);

    // Animations
    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".dashboard-card", {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, [viewMode]);

    // Export to Excel Handler
    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(claims.map(claim => ({
            ID: claim.id,
            Employee: claim.User?.name || 'Unknown',
            Email: claim.User?.email || '',
            Type: claim.type,
            Department: claim.department || '',
            Date: claim.date,
            Amount: claim.amount,
            Status: claim.status
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expense_Reports");
        XLSX.writeFile(workbook, "Expense_Reports.xlsx");
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate Monthly Stats
    const getMonthlyData = () => {
        const today = new Date();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            last6Months.push({
                name: d.toLocaleString('default', { month: 'short' }),
                date: d,
                amount: 0
            });
        }

        claims.forEach(claim => {
            if (claim.status === 'Approved' && claim.date) {
                const cDate = new Date(claim.date);
                if (!isNaN(cDate.getTime())) {
                    const match = last6Months.find(m =>
                        m.date.getMonth() === cDate.getMonth() &&
                        m.date.getFullYear() === cDate.getFullYear()
                    );
                    if (match) {
                        match.amount += claim.amount;
                    }
                }
            }
        });
        return last6Months;
    };

    const monthlyStats = getMonthlyData();

    const stats = {
        totalEmployees: 24,
        pending: claims.filter(c => c.status === 'Pending').length,
        approvedCount: claims.filter(c => c.status === 'Approved').length,
        totalDisbursed: claims.filter(c => c.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0),
        rejectedCount: claims.filter(c => c.status === 'Rejected').length,
    };

    // Mock Data for Analytics View
    const categoryData = [
        { subject: 'Travel', A: 120, B: 110, fullMark: 150 },
        { subject: 'Food', A: 98, B: 130, fullMark: 150 },
        { subject: 'Supplies', A: 86, B: 130, fullMark: 150 },
        { subject: 'Equipment', A: 99, B: 100, fullMark: 150 },
        { subject: 'Training', A: 85, B: 90, fullMark: 150 },
        { subject: 'Software', A: 65, B: 85, fullMark: 150 },
    ];

    const budgetVsActual = [
        { name: 'Jan', budget: 4000, actual: 2400 },
        { name: 'Feb', budget: 3000, actual: 1398 },
        { name: 'Mar', budget: 5000, actual: 9800 },
        { name: 'Apr', budget: 2780, actual: 3908 },
        { name: 'May', budget: 1890, actual: 4800 },
        { name: 'Jun', budget: 2390, actual: 3800 },
    ];

    const topSpenders = [
        { name: 'Marketing Dept', amount: 12500, trend: '+15%' },
        { name: 'Sales Team', amount: 9800, trend: '+8%' },
        { name: 'IT Infrastructure', amount: 8400, trend: '-2%' },
        { name: 'HR & Admin', amount: 4500, trend: '+5%' },
    ];

    const filteredReportClaims = claims.filter(claim => {
        const matchesSearch =
            claim.title?.toLowerCase().includes(reportSearch.toLowerCase()) ||
            claim.User?.name?.toLowerCase().includes(reportSearch.toLowerCase()) ||
            claim.department?.toLowerCase().includes(reportSearch.toLowerCase());
        const matchesType = reportTypeFilter === 'All' || claim.type === reportTypeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">System-wide performance and expense analytics</p>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-200/70 dark:bg-gray-800 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setViewMode('overview')}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            viewMode === 'overview'
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setViewMode('analytics')}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            viewMode === 'analytics'
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => setViewMode('reports')}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            viewMode === 'reports'
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        Reports
                    </button>
                </div>
            </div>

            {/* VIEW 1: OVERVIEW */}
            {viewMode === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* 4-Column Stats Cards (2-cols on mobile) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-blue-600">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total Disbursed</span>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">${stats.totalDisbursed.toLocaleString()}</h3>
                            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +12% vs last month
                            </p>
                        </div>

                        <div className="dashboard-card bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-amber-500">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Pending Tasks</span>
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{stats.pending}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Requires review</p>
                        </div>

                        <div className="dashboard-card bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-purple-500">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Active Team</span>
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{stats.totalEmployees}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Total registered</p>
                        </div>

                        <div className="dashboard-card bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-green-500">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Approved Claims</span>
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{stats.approvedCount}</h3>
                            <p className="text-[10px] sm:text-xs text-green-600 mt-1 font-semibold">Completed flows</p>
                        </div>
                    </div>

                    {/* Chart & Spending Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">Monthly Expense Disbursement</h3>
                            <div className="h-64 sm:h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyStats}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                        <XAxis dataKey="name" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Spenders Card */}
                        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white">Department Spending</h3>
                            <div className="space-y-3">
                                {topSpenders.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                        <div>
                                            <span className="block font-bold text-sm text-gray-900 dark:text-white">{s.name}</span>
                                            <span className="block text-xs text-gray-400">{s.trend} this quarter</span>
                                        </div>
                                        <span className="font-black text-sm text-gray-900 dark:text-white">${s.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: ANALYTICS */}
            {viewMode === 'analytics' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">Budget vs Actual Spend</h3>
                            <div className="h-64 sm:h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={budgetVsActual}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                        <XAxis dataKey="name" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="budget" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="actual" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">Category Radar</h3>
                            <div className="h-64 sm:h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius={90} data={categoryData}>
                                        <PolarGrid stroke="#9ca3af" opacity={0.3} />
                                        <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                                        <PolarRadiusAxis />
                                        <Radar name="Spending" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 3: REPORTS */}
            {viewMode === 'reports' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={reportSearch}
                                onChange={(e) => setReportSearch(e.target.value)}
                                placeholder="Search report claims, employees..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
                            >
                                <Download className="w-4 h-4" /> Export Excel
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                            >
                                <Printer className="w-4 h-4" /> Print
                            </button>
                        </div>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                        {filteredReportClaims.map((claim) => (
                            <div key={claim.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] font-mono text-gray-400 uppercase">#{claim.id}</span>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{claim.title}</h4>
                                        <span className="text-xs text-gray-500">{claim.User?.name || 'Employee'} • {claim.department || 'General'}</span>
                                    </div>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                                        claim.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                        claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    }`}>
                                        {claim.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/70 text-xs">
                                    <span className="text-gray-400">{claim.date}</span>
                                    <span className="text-base font-black text-gray-900 dark:text-white">${parseFloat(claim.amount).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View: Full Table */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">ID</th>
                                    <th className="py-3.5 px-6">Employee</th>
                                    <th className="py-3.5 px-6">Type</th>
                                    <th className="py-3.5 px-6">Date</th>
                                    <th className="py-3.5 px-6">Amount</th>
                                    <th className="py-3.5 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {filteredReportClaims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                        <td className="py-4 px-6 text-gray-400 font-mono">#{claim.id}</td>
                                        <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                                            {claim.User?.name || 'Unknown User'}
                                            <span className="block text-xs text-gray-400 font-normal">{claim.User?.email}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                claim.type === 'Travel' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {claim.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{claim.date}</td>
                                        <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">${parseFloat(claim.amount).toFixed(2)}</td>
                                        <td className="py-4 px-6">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                                claim.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
