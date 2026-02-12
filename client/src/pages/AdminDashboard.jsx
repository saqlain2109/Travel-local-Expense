import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Users, DollarSign, Clock, CheckCircle, BarChart,
    Briefcase, FileText, TrendingUp, AlertCircle
} from 'lucide-react';
import { gsap } from 'gsap';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [claims, setClaims] = useState([]);
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
    const stats = {
        totalEmployees: 24, // Mocked for now, or fetch from API if available
        pending: claims.filter(c => c.status === 'Pending').length,
        approvedCount: claims.filter(c => c.status === 'Approved').length,
        totalDisbursed: claims.filter(c => c.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0),
        rejectedCount: claims.filter(c => c.status === 'Rejected').length,
    };

    return (
        <div ref={containerRef} className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
                    <p className="text-sm text-gray-500">System-wide performance and expense tracking</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: just now</span>
                </div>
            </div>

            {/* 4-Column Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Disbursed */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-blue-600">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Total Disbursed</span>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">${stats.totalDisbursed.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" /> <span className="text-green-600 font-medium">+12%</span> vs last month
                    </p>
                </div>

                {/* Pending Approvals */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-amber-500">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Pending Tasks</span>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.pending}</h3>
                    <p className="text-xs text-gray-400 mt-2">Requires your attention</p>
                </div>

                {/* Active Employees */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-purple-500">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Active Employees</span>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</h3>
                    <p className="text-xs text-gray-400 mt-2">3 new joined this month</p>
                </div>

                {/* Rejection Rate */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-red-500">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Rejection Rate</span>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                        {claims.length > 0 ? Math.round((stats.rejectedCount / claims.length) * 100) : 0}%
                    </h3>
                    <p className="text-xs text-gray-400 mt-2">{stats.rejectedCount} requests rejected</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="dashboard-card lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                        <BarChart className="w-4 h-4" /> Company Spending Trend
                    </h4>
                    <p className="text-xs text-gray-400 mb-6">Total expenses disbursed over last 6 months</p>
                    <div className="h-72 flex gap-4">
                        {/* Y-Axis Labels */}
                        <div className="flex flex-col justify-between text-[10px] text-gray-400 py-2 min-w-[30px] text-right font-medium">
                            <span>High</span>
                            <span>Mid</span>
                            <span>0</span>
                        </div>

                        {/* Chart Area */}
                        <div className="flex-1 relative flex items-end border-l border-b border-gray-100">
                            {/* Background Grid */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                <div className="border-t border-gray-100 border-dashed w-full h-px"></div>
                                <div className="border-t border-gray-100 border-dashed w-full h-px"></div>
                                <div className="border-t border-gray-100 border-dashed w-full h-px"></div>
                            </div>

                            {/* Bars Container */}
                            <div className="w-full h-full flex items-end justify-between px-2 pb-0 z-10">
                                {(() => {
                                    // 1. Generate last 6 months
                                    const today = new Date();
                                    const last6Months = [];
                                    for (let i = 5; i >= 0; i--) {
                                        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                                        last6Months.push({
                                            monthLabel: d.toLocaleString('default', { month: 'short' }),
                                            year: d.getFullYear(),
                                            monthIdx: d.getMonth(),
                                            amount: 0
                                        });
                                    }

                                    // 2. Aggregate approved claims
                                    claims.forEach(claim => {
                                        if (claim.status === 'Approved' && claim.date) {
                                            const cDate = new Date(claim.date);
                                            if (!isNaN(cDate.getTime())) {
                                                const match = last6Months.find(m =>
                                                    m.monthIdx === cDate.getMonth() &&
                                                    m.year === cDate.getFullYear()
                                                );
                                                if (match) {
                                                    match.amount += claim.amount;
                                                }
                                            }
                                        }
                                    });

                                    // 3. Determine max for scaling
                                    const maxAmount = Math.max(...last6Months.map(m => m.amount), 500);

                                    return last6Months.map((data) => {
                                        const heightPercent = Math.max((data.amount / maxAmount) * 100, 4);
                                        const isCurrent = data.monthIdx === today.getMonth() && data.year === today.getFullYear();

                                        return (
                                            <div key={data.monthLabel} className="h-full flex-1 flex flex-col justify-end items-center gap-2 group relative px-1">
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                                                    ${data.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>

                                                {/* Bar */}
                                                <div
                                                    className={`w-full max-w-[40px] rounded-t-sm transition-all duration-700 ease-out relative
                                                    ${isCurrent ? 'bg-blue-600 shadow-md shadow-blue-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                    style={{ height: `${heightPercent}%` }}
                                                ></div>

                                                {/* Label */}
                                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{data.monthLabel}</span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-1">Status Distribution</h4>
                    <p className="text-xs text-gray-400 mb-8">Overview of all request statuses</p>

                    {/* Donut Chart */}
                    <div className="relative w-48 h-48 mx-auto">
                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                            {(() => {
                                const total = claims.length || 1;
                                const approved = stats.approvedCount;
                                const pending = stats.pending;
                                const rejected = stats.rejectedCount;

                                const approvedDash = (approved / total) * 100;
                                const pendingDash = (pending / total) * 100;
                                // const rejectedDash = (rejected / total) * 100;

                                return (
                                    <>
                                        <path className="text-green-500 transition-all duration-1000" strokeDasharray={`${approvedDash}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                                        {pending > 0 && <path className="text-amber-500 transition-all duration-1000" strokeDasharray={`${pendingDash}, 100`} strokeDashoffset={-approvedDash} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />}
                                        {rejected > 0 && <path className="text-red-500 transition-all duration-1000" strokeDasharray={`${(rejected / total) * 100}, 100`} strokeDashoffset={-(approvedDash + pendingDash)} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />}
                                    </>
                                );
                            })()}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-bold text-gray-800">{claims.length}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Mini-Feed */}
            <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Recent System Activity
                </h4>
                <div className="space-y-4">
                    {claims.slice(0, 5).map((claim, i) => (
                        <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1
                                ${claim.status === 'Approved' ? 'bg-green-500' : claim.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                {claim.status === 'Approved' ? <CheckCircle className="w-4 h-4" /> : claim.status === 'Rejected' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-sm text-gray-800">
                                    <span className="font-semibold">{claim.User ? claim.User.name : 'User'}</span>'s {claim.type} request for <span className="font-semibold">${claim.amount}</span> was <span className="lowercase font-medium">{claim.status}</span>.
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{claim.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
