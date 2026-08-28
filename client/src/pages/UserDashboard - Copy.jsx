import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import {
    Plus, Search, Filter, FileText, Calendar, DollarSign,
    MoreVertical, X, CheckCircle, Clock, AlertCircle,
    Briefcase, MapPin, ChevronRight, BarChart, Layout,
    List, Grid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Modern glass-like card styling component
const ModernCard = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-lg transition-all duration-300 ${className}`}>
        {children}
    </div>
);

const UserDashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState('modern'); // 'modern' | 'classic' | 'minimal'
    const [stats, setStats] = useState({
        totalRequests: 0,
        totalAmount: 0,
        statusCounts: { Pending: 0, Approved: 0, Rejected: 0 },
        monthlyStats: [],
        recentActivity: []
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const containerRef = useRef(null);

    const fetchDashboardData = async () => {
        try {
            if (user) {
                const data = await api.getDashboardStats(user.id);
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    // Simple GSAP entry animation
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

    const handleCreateClaim = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newClaimData = {
            title: formData.get('title'),
            type: 'Local', // Defaulting to simple claim for now
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            description: formData.get('description'),
        };

        try {
            await api.createClaim(newClaimData, user.id);
            setIsModalOpen(false);
            fetchDashboardData();
        } catch (error) {
            console.error("Failed to create claim", error);
        }
    };

    return (
        <div ref={containerRef} className="space-y-8">
            {/* Inactive Account Warning */}
            {user && user.isActive === false && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">Account Pending Approval</h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>Your account is currently pending administrator approval. You cannot submit new claims or requests until your account is activated.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Acton Buttons */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/submit-request')}
                    disabled={user && user.isActive === false}
                    className={`bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 
                        ${user && user.isActive === false ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                    <Plus className="w-5 h-5" />
                    New Travel Request
                </button>
                <button
                    onClick={() => navigate('/submit-claim')}
                    disabled={user && user.isActive === false}
                    className={`bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 
                        ${user && user.isActive === false ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                    <Plus className="w-5 h-5" />
                    New Expense Claim
                </button>
            </div>

            {/* View Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {viewMode === 'minimal' ? 'Quick Actions' : 'Dashboard'}
                </h2>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start">
                    <button
                        onClick={() => setViewMode('classic')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'classic' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <List className="w-3 h-3" /> Classic
                    </button>
                    <button
                        onClick={() => setViewMode('modern')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'modern' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Layout className="w-3 h-3" /> Modern
                    </button>
                    <button
                        onClick={() => setViewMode('minimal')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'minimal' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Grid className="w-3 h-3" /> Minimal
                    </button>
                </div>
            </div>

            {/* MINIMAL VIEW */}
            {viewMode === 'minimal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg flex flex-col justify-between h-64">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}</h3>
                            <p className="text-blue-100 opacity-90">You have {stats.statusCounts.Pending} pending requests requiring attention.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/submit-request')}
                                className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Plus className="w-5 h-5" /> Travel Request
                            </button>
                            <button
                                onClick={() => navigate('/submit-claim')}
                                className="bg-blue-700/50 backdrop-blur-sm text-white border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-blue-700/70 transition-colors flex items-center gap-2"
                            >
                                <DollarSign className="w-5 h-5" /> Expense Claim
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm h-64 overflow-y-auto">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" /> Pending Actions
                        </h4>
                        {stats.recentActivity.filter(i => i.status === 'Pending').length === 0 ? (
                            <p className="text-gray-400 text-sm">No pending items.</p>
                        ) : (
                            <div className="space-y-3">
                                {stats.recentActivity.filter(i => i.status === 'Pending').slice(0, 3).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'Travel' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                {item.type === 'Travel' ? <MapPin className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                                                <p className="text-xs text-gray-500">{item.type} • {item.date}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">${item.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CLASSIC VIEW (Restored Original Layout) */}
            {viewMode === 'classic' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold uppercase">Total Requests</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalRequests}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold uppercase">Pending</h3>
                            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.statusCounts.Pending}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold uppercase">Approved</h3>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.statusCounts.Approved}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold uppercase">Total Amount</h3>
                            <p className="text-2xl font-bold text-blue-600 mt-1">${stats.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white">Recent Claims</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats.recentActivity.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.type === 'Travel' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                            {item.type === 'Travel' ? <MapPin className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                                            <p className="text-xs text-gray-500">{item.type} Request • {item.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">${item.amount}</p>
                                        <p className={`text-xs font-medium ${item.status === 'Approved' ? 'text-green-600' : item.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>{item.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODERN VIEW (Default) */}
            {viewMode === 'modern' && (
                <>
                    {/* 4-Column Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Card 1: Total Requests */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-purple-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Total Requests</span>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300">
                                    <FileText className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRequests}</h3>
                            <p className="text-xs text-gray-400 mt-2">All time requests</p>
                        </div>

                        {/* Card 2: Pending Approval */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-amber-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Pending Approval</span>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-amber-600">{stats.statusCounts.Pending}</h3>
                            <p className="text-xs text-gray-400 mt-2">Awaiting action</p>
                        </div>

                        {/* Card 3: Approval Rate */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-green-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Approved</span>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-green-600">{stats.statusCounts.Approved}</h3>
                            <p className="text-xs text-gray-400 mt-2">Requests approved</p>
                        </div>

                        {/* Card 4: Approved Spending */}
                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-blue-600">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Approved Spending</span>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${stats.totalAmount.toLocaleString()}</h3>
                            <p className="text-xs text-gray-400 mt-2">Total approved amount</p>
                        </div>
                    </div>
                </>
            )}

            {viewMode === 'modern' && (
                <>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="dashboard-card lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                <BarChart className="w-4 h-4" /> Monthly Spending Trend
                            </h4>
                            <p className="text-xs text-gray-400 mb-6">Approved travel and expense costs over the last 6 months</p>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#9ca3af'} />
                                        <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#9ca3af'} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="dashboard-card bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Request Status</h4>
                            <p className="text-xs text-gray-400 mb-8">Distribution of all requests</p>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Pending', value: stats.statusCounts.Pending },
                                                { name: 'Approved', value: stats.statusCounts.Approved },
                                                { name: 'Rejected', value: stats.statusCounts.Rejected },
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

                    {/* Dynamic Lists & Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Expense Breakdown Donut Chart - NEW */}
                        <div className="hidden lg:block">
                            <ModernCard className="h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-purple-500" /> Expense Breakdown
                                        </h4>
                                        <p className="text-xs text-gray-400 mt-1">Spending by category</p>
                                    </div>
                                </div>
                                <div className="h-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Travel', value: 450 },
                                                    { name: 'Food', value: 300 },
                                                    { name: 'Supplies', value: 150 },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#6366f1" />
                                                <Cell fill="#f43f5e" />
                                                <Cell fill="#10b981" />
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend verticalAlign="middle" align="right" layout="vertical" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text Overlay */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <span className="block text-2xl font-bold text-gray-800 dark:text-white">$900</span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Total</span>
                                    </div>
                                </div>
                            </ModernCard>
                        </div>

                        {/* Travel Requests List - ENHANCED VISUALS */}
                        <ModernCard className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-500" /> Recent Activity
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-1">Latest claims & requests</p>
                                </div>
                                <button onClick={() => navigate('/history')} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                    See All <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="space-y-4 flex-1">
                                {stats.recentActivity.length === 0 ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-700/50 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30">
                                        <Briefcase className="w-10 h-10 mb-2 opacity-20" />
                                        <span className="text-sm font-medium">No recent activity</span>
                                    </div>
                                ) : stats.recentActivity.map((item) => (
                                    <div key={item.id} onClick={() => navigate(`/claim/${item.id}`)} className="group cursor-pointer relative overflow-hidden flex items-center justify-between p-4 bg-white dark:bg-gray-700/30 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white dark:hover:from-blue-900/10 dark:hover:to-gray-800 rounded-2xl transition-all border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md hover:-translate-y-0.5">
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3
                                        ${item.type === 'Travel' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' : 'bg-green-50 dark:bg-green-900/20 text-green-500'}`}>
                                                {item.type === 'Travel' ? <MapPin className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                        <Calendar className="w-3 h-3" /> {item.date}
                                                    </span>
                                                    {/* ADDED EXPLICIT TYPE ITEM AS REQUESTED */}
                                                    <span className={`text-[10px] flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${item.type === 'Travel' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                        {item.type === 'Travel' ? 'Travel Request' : 'Expense Claim'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 relative z-10">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm
                                        ${item.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                    item.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                                                {item.status}
                                            </span>
                                            <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums">${item.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ModernCard>
                    </div>
                </>
            )}

            {/* Modal remains mostly the same, just styled to match light theme */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">New Expense Claim</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateClaim} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Expense Title</label>
                                <input required name="title" type="text" className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="e.g. Team Lunch" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Amount ($)</label>
                                    <input required name="amount" type="number" step="0.01" className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Date</label>
                                    <input required name="date" type="date" className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea name="description" rows="3" className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"></textarea>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">Submit Claim</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
