import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import {
    Plus, Search, Filter, FileText, Calendar, DollarSign,
    MoreVertical, X, CheckCircle, Clock, AlertCircle,
    Briefcase, MapPin, ChevronRight, BarChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        count: 0,
        approvedRate: 0,
        approvedAmount: 0
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const containerRef = useRef(null);

    const fetchClaims = async () => {
        try {
            if (user) {
                const data = await api.getClaims(user.id);
                setClaims(data);

                // Calculate stats
                const total = data.length;
                const pending = data.filter(c => c.status === 'Pending').length;
                const approvedCount = data.filter(c => c.status === 'Approved').length;
                const approvedAmount = data.filter(c => c.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0);

                setStats({
                    total,
                    pending,
                    count: data.length,
                    approvedRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
                    approvedAmount
                });
            }
        } catch (error) {
            console.error("Failed to fetch claims", error);
        }
    };

    useEffect(() => {
        fetchClaims();
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
            fetchClaims();
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

            {/* 4-Column Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Total Requests */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-purple-500">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Total Requests</span>
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                    <p className="text-xs text-gray-400 mt-2">6 travel • {stats.count} expense</p>
                </div>

                {/* Card 2: Pending Approval */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-amber-500">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Pending Approval</span>
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-amber-600">{stats.pending}</h3>
                    <p className="text-xs text-gray-400 mt-2">2 travel • {stats.pending} expense</p>
                </div>

                {/* Card 3: Approval Rate */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-green-500">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Approval Rate</span>
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-green-600">{stats.approvedRate}%</h3>
                    <p className="text-xs text-gray-400 mt-2">5 approved • 2 rejected</p>
                </div>

                {/* Card 4: Approved Spending */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-4 border-b-blue-600">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-gray-500 font-medium">Approved Spending</span>
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">${stats.approvedAmount.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">$4,500 travel • ${stats.approvedAmount} expense</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="dashboard-card lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                        <BarChart className="w-4 h-4" /> Monthly Spending Trend
                    </h4>
                    <p className="text-xs text-gray-400 mb-6">Approved travel and expense costs over the last 6 months</p>
                    <div className="h-64 flex gap-4">
                        {/* Y-Axis Labels (Dynamic roughly) */}
                        <div className="flex flex-col justify-between text-[10px] text-gray-400 py-2 min-w-[30px] text-right font-medium">
                            <span>High</span>
                            <span>Mid</span>
                            <span>$0</span>
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
                                            // Check if date is valid
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
                                    const maxAmount = Math.max(...last6Months.map(m => m.amount), 100);

                                    return last6Months.map((data) => {
                                        const heightPercent = Math.max((data.amount / maxAmount) * 100, 4); // Min 4% for visibility
                                        const isCurrent = data.monthIdx === today.getMonth() && data.year === today.getFullYear();

                                        return (
                                            <div key={data.monthLabel} className="h-full flex-1 flex flex-col justify-end items-center gap-2 group relative px-1">
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                                                    ${data.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>

                                                {/* Bar */}
                                                <div
                                                    className={`w-full max-w-[30px] rounded-t-sm transition-all duration-700 ease-out 
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
                    <h4 className="font-semibold text-gray-800 mb-1">Request Status</h4>
                    <p className="text-xs text-gray-400 mb-8">Distribution of all requests</p>

                    {/* Dynamic Donut Chart */}
                    <div className="relative w-40 h-40 mx-auto">
                        {/* SVG Donut */}
                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                            {/* Background Circle */}
                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />

                            {(() => {
                                const total = stats.total || 1;
                                const approvedPct = (stats.count - stats.pending - (claims.filter(c => c.status === 'Rejected').length)) / total * 100; // Simplification
                                // Accurate counts:
                                const approved = claims.filter(c => c.status === 'Approved').length;
                                const rejected = claims.filter(c => c.status === 'Rejected').length;
                                const pending = claims.filter(c => c.status === 'Pending').length;

                                // Stroke Dash Array logic for segments
                                // Segment 1: Approved (Green)
                                // Segment 2: Pending (Amber) - starts after Approved
                                // Segment 3: Rejected (Red) - starts after Pending

                                const approvedDash = (approved / total) * 100;
                                const pendingDash = (pending / total) * 100;
                                const rejectedDash = (rejected / total) * 100;

                                return (
                                    <>
                                        {/* Approved Segment */}
                                        <path className="text-green-500 transition-all duration-1000 ease-out" strokeDasharray={`${approvedDash}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />

                                        {/* Pending Segment (Rotated) */}
                                        {pending > 0 && (
                                            <path className="text-amber-500 transition-all duration-1000 ease-out"
                                                strokeDasharray={`${pendingDash}, 100`}
                                                strokeDashoffset={-approvedDash}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8"
                                            />
                                        )}

                                        {/* Rejected Segment */}
                                        {rejected > 0 && (
                                            <path className="text-red-500 transition-all duration-1000 ease-out"
                                                strokeDasharray={`${rejectedDash}, 100`}
                                                strokeDashoffset={-(approvedDash + pendingDash)}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8"
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-bold text-gray-800">{stats.total}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Requests</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-8 text-xs">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Pending</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Approved</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Rejected</span>
                    </div>
                </div>
            </div>

            {/* Dynamic Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Travel Requests List */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-orange-500" /> Travel Requests
                            </h4>
                            <p className="text-xs text-gray-400">Latest travel plans</p>
                        </div>
                        <button onClick={() => setClaims(claims)} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                            View All <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-3 flex-1">
                        {claims.filter(c => c.type === 'Travel').length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Briefcase className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-sm">No travel requests yet</span>
                                <button onClick={() => navigate('/submit-request')} className="mt-2 text-blue-600 text-xs font-medium hover:underline">Create one now</button>
                            </div>
                        ) : claims.filter(c => c.type === 'Travel').slice(0, 3).map((item) => (
                            <div key={item.id} onClick={() => navigate(`/claim/${item.id}`)} className="group cursor-pointer flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl transition-all border border-transparent hover:border-blue-100 hover:shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white text-orange-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{item.title}</h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {item.date}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                        ${item.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status}
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">${item.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expense Claims List */}
                <div className="dashboard-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-purple-500" /> Recent Expenses
                            </h4>
                            <p className="text-xs text-gray-400">Latest receipts & claims</p>
                        </div>
                        <button onClick={() => setClaims(claims)} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                            View All <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-3 flex-1">
                        {claims.filter(c => c.type === 'Expense' || !c.type).length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <FileText className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-sm">No expenses filed yet</span>
                                <button onClick={() => navigate('/submit-claim')} className="mt-2 text-blue-600 text-xs font-medium hover:underline">Submit a claim</button>
                            </div>
                        ) : claims.filter(c => c.type === 'Expense' || !c.type).slice(0, 4).map((claim) => (
                            <div
                                key={claim.id}
                                onClick={() => navigate(`/claim/${claim.id}`)}
                                className="group flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{claim.title}</p>
                                        <p className="text-xs text-gray-400">{claim.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900 mb-1">${claim.amount.toFixed(2)}</p>
                                    <div className="flex items-center justify-end gap-1">
                                        {claim.status === 'Approved' && <CheckCircle className="w-3 h-3 text-green-500" />}
                                        {claim.status === 'Pending' && <Clock className="w-3 h-3 text-amber-500" />}
                                        {claim.status === 'Rejected' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                        <span className={`text-[10px] font-medium 
                                            ${claim.status === 'Approved' ? 'text-green-600' : claim.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>
                                            {claim.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal remains mostly the same, just styled to match light theme */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">New Expense Claim</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateClaim} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expense Title</label>
                                <input required name="title" type="text" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="e.g. Team Lunch" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount ($)</label>
                                    <input required name="amount" type="number" step="0.01" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                                    <input required name="date" type="date" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea name="description" rows="3" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"></textarea>
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
