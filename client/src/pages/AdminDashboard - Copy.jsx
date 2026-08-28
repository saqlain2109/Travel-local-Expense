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

const AdminDashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [claims, setClaims] = useState([]);
    const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'analytics'
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
    }, []);

    // Calculate Stats
    // Calculate Stats
    // For now, we'll derive some stats from claims if API doesn't provide them all yet.
    // Ideally, we should add a specific admin stats endpoint similar to user dashboard if needed.
    // Using simple derivation for now.

    // Mocking monthly data collection for the chart
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
        totalEmployees: 24, // Mocked
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

    return (
        <div ref={containerRef} className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">System-wide performance and expense tracking</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('overview')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'overview' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setViewMode('analytics')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => setViewMode('reports')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'reports' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Reports
                    </button>
                    <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-3 border-l border-gray-200 dark:border-gray-700 ml-2">
                        <Clock className="w-3 h-3" />
                        <span>Updated: just now</span>
                    </div>
                </div>
            </div>

            {viewMode === 'overview' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* 4-Column Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Disbursed */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-blue-600">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Total Disbursed</span>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${stats.totalDisbursed.toLocaleString()}</h3>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" /> <span className="text-green-600 font-medium">+12%</span> vs last month
                            </p>
                        </div>

                        {/* Pending Approvals */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-amber-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Pending Tasks</span>
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</h3>
                            <p className="text-xs text-gray-400 mt-2">Requires your attention</p>
                        </div>

                        {/* Active Employees */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-purple-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Active Employees</span>
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</h3>
                            <p className="text-xs text-gray-400 mt-2">3 new joined this month</p>
                        </div>

                        {/* Rejection Rate */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-red-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Rejection Rate</span>
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {claims.length > 0 ? Math.round((stats.rejectedCount / claims.length) * 100) : 0}%
                            </h3>
                            <p className="text-xs text-gray-400 mt-2">{stats.rejectedCount} requests rejected</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="dashboard-card lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                <BarChart className="w-4 h-4" /> Company Spending Trend
                            </h4>
                            <p className="text-xs text-gray-400 mb-6">Total expenses disbursed over last 6 months</p>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#9ca3af'} />
                                        <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#9ca3af'} />
                                        <Tooltip
                                            cursor={{ fill: theme === 'dark' ? '#374151' : '#f3f4f6' }}
                                            contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                        />
                                        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Status Distribution</h4>
                            <p className="text-xs text-gray-400 mb-8">Overview of all request statuses</p>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Pending', value: stats.pending },
                                                { name: 'Approved', value: stats.approvedCount },
                                                { name: 'Rejected', value: stats.rejectedCount },
                                            ]}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell key="cell-0" fill="#f59e0b" />
                                            <Cell key="cell-1" fill="#22c55e" />
                                            <Cell key="cell-2" fill="#ef4444" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Mini-Feed */}
                    <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Recent System Activity
                        </h4>
                        <div className="space-y-4">
                            {claims.slice(0, 5).map((claim, i) => (
                                <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1
                                        ${claim.status === 'Approved' ? 'bg-green-500' : claim.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                        {claim.status === 'Approved' ? <CheckCircle className="w-4 h-4" /> : claim.status === 'Rejected' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            <span className="font-semibold text-gray-900 dark:text-white">{claim.User ? claim.User.name : 'User'}</span>'s {claim.type} request for <span className="font-semibold text-gray-900 dark:text-white">${claim.amount}</span> was <span className="lowercase font-medium">{claim.status}</span>.
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{claim.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Analytics View Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar Chart: Category Analysis */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Expense Category Analysis</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Spending distribution across key operational areas</p>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                                        <PolarGrid stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'dark' ? '#9ca3af' : '#4b5563', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: theme === 'dark' ? '#9ca3af' : '#9ca3af', fontSize: 10 }} />
                                        <Radar name="Budget" dataKey="B" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                        <Radar name="Actual" dataKey="A" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                        <Legend />
                                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Composed Chart: Budget vs Actual */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Budget vs Partial Spending</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Comparison of allocated budget vs actual spending</p>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={budgetVsActual}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                        <XAxis dataKey="name" scale="band" stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                                        <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }} />
                                        <Legend />
                                        <Bar dataKey="budget" barSize={20} fill="#413ea0" />
                                        <Line type="monotone" dataKey="actual" stroke="#ff7300" strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Spenders Leaderboard */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Top Spending Departments</h4>
                            <div className="space-y-4">
                                {topSpenders.map((dept, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{dept.name}</p>
                                                <p className={`text-xs ${dept.trend.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                                                    {dept.trend} vs last month
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">${dept.amount.toLocaleString()}</p>
                                            <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(dept.amount / 15000) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {viewMode === 'reports' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search claims..." className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Export Excel
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Printer className="w-4 h-4" /> Print
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {claims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">#{claim.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {claim.User ? claim.User.name : 'Unknown User'}
                                            <span className="block text-xs text-gray-400 font-normal">{claim.User?.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${claim.type === 'Travel' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                {claim.type === 'Travel' ? <MapPin className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                                                {claim.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{claim.date}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">${claim.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${claim.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                                                claim.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
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
