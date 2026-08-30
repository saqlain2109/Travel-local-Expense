import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Search, CheckCircle, XCircle, FileText, ChevronRight, User, DollarSign,
    Calendar, MapPin, Check, X, MessageSquare, Loader2, HelpCircle,
    CreditCard, Sparkles, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // Clarify Modal
    const [isClarifyOpen, setIsClarifyOpen] = useState(false);
    const [selectedClaimForClarify, setSelectedClaimForClarify] = useState(null);
    const [clarifyQuery, setClarifyQuery] = useState('');

    // Disburse Modal
    const [isDisburseOpen, setIsDisburseOpen] = useState(false);
    const [selectedClaimForDisburse, setSelectedClaimForDisburse] = useState(null);
    const [disburseData, setDisburseData] = useState({
        utrNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        comments: ''
    });

    const fetchData = async () => {
        try {
            if (user) {
                const isAdmin = user.role === 'admin';
                const roleParam = isAdmin ? 'admin' : null;
                const userIdParam = isAdmin ? null : user.id;
                const claimsData = await api.getClaims(userIdParam, roleParam);

                if (!isAdmin) {
                    const tasks = claimsData.filter(c => c.approverId === user.id || c.UserId === user.id);
                    setClaims(tasks);
                } else {
                    setClaims(claimsData);
                }

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
        return claims
            .filter(c => filterStatus === 'All' ? true : c.status === filterStatus)
            .filter(c => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                    c.title?.toLowerCase().includes(q) ||
                    c.User?.name?.toLowerCase().includes(q) ||
                    c.department?.toLowerCase().includes(q) ||
                    c.type?.toLowerCase().includes(q)
                );
            });
    }, [claims, filterStatus, searchQuery]);

    // Instant 1-click Approval/Rejection with Optimistic UI update
    const handleStatusUpdate = async (id, newStatus) => {
        if (actionLoading) return;
        setActionLoading(id + '_' + newStatus);

        const previousClaims = [...claims];
        setClaims(prevClaims =>
            prevClaims.map(c => c.id === id ? { ...c, status: newStatus } : c)
        );

        try {
            const res = await api.updateClaimStatus(id, newStatus, {
                performedByName: user?.name || 'Approver',
                performedByRole: user?.role === 'admin' ? 'Admin' : 'Manager'
            });
            if (res && res.message && res.message.includes('next approval level')) {
                await fetchData();
            }
        } catch (error) {
            console.error("Failed to update status", error);
            setClaims(previousClaims);
            alert("Failed to update status. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenClarify = (c) => {
        setSelectedClaimForClarify(c);
        setClarifyQuery('');
        setIsClarifyOpen(true);
    };

    const handleClarifySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.requestClarification(selectedClaimForClarify.id, {
                query: clarifyQuery,
                performedByName: user?.name || 'Approver',
                performedByRole: user?.role === 'admin' ? 'Admin' : 'Manager'
            });
            setIsClarifyOpen(false);
            fetchData();
        } catch (err) {
            console.error("Failed to request clarification", err);
            alert("Failed to send clarification request");
        }
    };

    const handleOpenDisburse = (c) => {
        setSelectedClaimForDisburse(c);
        setDisburseData({
            utrNumber: '',
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Bank Transfer',
            comments: ''
        });
        setIsDisburseOpen(true);
    };

    const handleDisburseSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.disburseClaim(selectedClaimForDisburse.id, {
                ...disburseData,
                performedByName: user?.name || 'Finance Officer'
            });
            setIsDisburseOpen(false);
            fetchData();
        } catch (err) {
            console.error("Failed to disburse", err);
            alert("Failed to record payout");
        }
    };

    // Instant 1-click User Activation
    const handleUserApproval = async (id, approve) => {
        if (!window.confirm(approve ? "Activate this user account?" : "Reject and delete this user registration?")) return;

        const previousPending = [...pendingUsers];
        setPendingUsers(prev => prev.filter(u => u.id !== id));

        try {
            if (approve) {
                await api.updateUser(id, { isActive: true });
            } else {
                await api.deleteUser(id);
            }
            await fetchData();
        } catch (error) {
            console.error("Failed to update user", error);
            setPendingUsers(previousPending);
            alert("Failed to process user activation");
        }
    };

    const countPending = claims.filter(c => c.status === 'Pending').length;
    const countClarification = claims.filter(c => c.status === 'Clarification').length;
    const countApproved = claims.filter(c => c.status === 'Approved').length;
    const countDisbursed = claims.filter(c => c.status === 'Disbursed').length;

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Workflow Tasks & Payouts</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Review pending claims, clarify queries, and disburse finance payments</p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search tasks, claims..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-200/70 dark:bg-gray-800 p-1 rounded-2xl w-full sm:w-max overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setFilterStatus('Pending')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        filterStatus === 'Pending' ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Pending Approvals ({countPending})
                </button>
                <button
                    onClick={() => setFilterStatus('Clarification')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        filterStatus === 'Clarification' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Clarifications ({countClarification})
                </button>
                <button
                    onClick={() => setFilterStatus('Approved')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        filterStatus === 'Approved' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Ready for Payout ({countApproved})
                </button>
                <button
                    onClick={() => setFilterStatus('Disbursed')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        filterStatus === 'Disbursed' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Paid / Disbursed ({countDisbursed})
                </button>
                {user?.role === 'admin' && pendingUsers.length > 0 && (
                    <button
                        onClick={() => setFilterStatus('Users')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                            filterStatus === 'Users' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        Pending Users ({pendingUsers.length})
                    </button>
                )}
            </div>

            {/* Claims Task List */}
            {filterStatus !== 'Users' && (
                <div className="space-y-3">
                    {filteredClaims.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                            <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">No {filterStatus} Tasks Found</h3>
                            <p className="text-xs text-gray-400 mt-1">All workflows in this stage are completed.</p>
                        </div>
                    ) : (
                        filteredClaims.map((claim) => (
                            <div
                                key={claim.id}
                                className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div
                                    onClick={() => navigate(`/claim/${claim.id}`)}
                                    className="flex items-start sm:items-center gap-3.5 cursor-pointer flex-1"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                        {claim.type === 'Travel' ? '✈️' : '🧾'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                                                {claim.title}
                                            </h4>
                                            <span className="text-[10px] font-mono text-gray-400">#{claim.id}</span>
                                            {claim.isPolicyViolation && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">
                                                    ⚠️ Policy Warning
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                                            <span>By <strong>{claim.User?.name || 'Employee'}</strong></span>
                                            <span>•</span>
                                            <span>Dept: <strong>{claim.department || 'General'}</strong></span>
                                            <span>•</span>
                                            <span>Date: {claim.date}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                                    <div className="text-left sm:text-right">
                                        <span className="text-xs text-gray-400 block">Claim Amount</span>
                                        <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                            ${parseFloat(claim.amount).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5">
                                        {claim.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleOpenClarify(claim)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors"
                                                    title="Request Clarification"
                                                >
                                                    <HelpCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(claim.id, 'Approved')}
                                                    disabled={actionLoading === `${claim.id}_Approved`}
                                                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-xl font-bold transition-all"
                                                    title="Approve Claim"
                                                >
                                                    {actionLoading === `${claim.id}_Approved` ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(claim.id, 'Rejected')}
                                                    disabled={actionLoading === `${claim.id}_Rejected`}
                                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold transition-all"
                                                    title="Reject Claim"
                                                >
                                                    {actionLoading === `${claim.id}_Rejected` ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                                                </button>
                                            </>
                                        )}

                                        {user?.role === 'admin' && claim.status === 'Approved' && (
                                            <button
                                                onClick={() => handleOpenDisburse(claim)}
                                                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                                            >
                                                <CreditCard className="w-4 h-4" /> Disburse
                                            </button>
                                        )}

                                        {claim.status === 'Disbursed' && (
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5" /> Paid (UTR: {claim.utrNumber || 'Done'})
                                            </span>
                                        )}

                                        <button
                                            onClick={() => navigate(`/claim/${claim.id}`)}
                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pending User Registrations Tab */}
            {filterStatus === 'Users' && (
                <div className="space-y-3">
                    {pendingUsers.map(u => (
                        <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{u.name}</h4>
                                <p className="text-xs text-gray-500">@{u.username} • {u.email} • Dept: {u.department || 'General'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleUserApproval(u.id, true)}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm"
                                >
                                    Activate
                                </button>
                                <button
                                    onClick={() => handleUserApproval(u.id, false)}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Clarification Modal */}
            {isClarifyOpen && selectedClaimForClarify && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Clarification</h3>
                            <button onClick={() => setIsClarifyOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleClarifySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                    Question / Info Needed for #{selectedClaimForClarify.id}
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    value={clarifyQuery}
                                    onChange={(e) => setClarifyQuery(e.target.value)}
                                    placeholder="e.g. Please clarify why local taxi was used instead of metro..."
                                    className="input-field resize-none"
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsClarifyOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Send Query</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Disburse Modal */}
            {isDisburseOpen && selectedClaimForDisburse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Disburse Claim #{selectedClaimForDisburse.id}</h3>
                            <button onClick={() => setIsDisburseOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleDisburseSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Bank UTR / Transaction Ref <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={disburseData.utrNumber}
                                    onChange={(e) => setDisburseData({ ...disburseData, utrNumber: e.target.value })}
                                    placeholder="e.g. UTR-8392183921"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Payment Method</label>
                                <select
                                    value={disburseData.paymentMethod}
                                    onChange={(e) => setDisburseData({ ...disburseData, paymentMethod: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                                    <option value="UPI / Instant">UPI / Instant Pay</option>
                                    <option value="Corporate Card">Corporate Card</option>
                                    <option value="Cash / Petty Cash">Cash / Petty Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    required
                                    value={disburseData.paymentDate}
                                    onChange={(e) => setDisburseData({ ...disburseData, paymentDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsDisburseOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
