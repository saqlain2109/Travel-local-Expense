import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, CheckCircle, XCircle, FileText, ChevronRight, User, DollarSign, Calendar, MapPin, Check, X, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchData = async () => {
        try {
            if (user) {
                const isAdmin = user.role === 'admin';

                const roleParam = isAdmin ? 'admin' : null;
                const userIdParam = isAdmin ? null : user.id;
                const claimsData = await api.getClaims(userIdParam, roleParam);

                if (!isAdmin) {
                    const tasks = claimsData.filter(c => c.approverId === user.id);
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

    const handleStatusUpdate = async (id, newStatus) => {
        setActionLoading(id + '_' + newStatus);
        try {
            await api.updateClaimStatus(id, newStatus);
            await fetchData();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUserApproval = async (id, approve) => {
        if (!window.confirm(approve ? "Activate this user account?" : "Reject and delete this user registration?")) return;
        try {
            if (approve) {
                await api.updateUser(id, { isActive: true });
            } else {
                await api.deleteUser(id);
            }
            await fetchData();
        } catch (error) {
            console.error("Failed to update user", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Task Management</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Review pending employee claims and user activation requests</p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks, employees..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Pending User Registrations Section (Admin Only) */}
            {user?.role === 'admin' && pendingUsers.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm sm:text-base">Pending User Activations</h3>
                        </div>
                        <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {pendingUsers.length} Pending
                        </span>
                    </div>

                    {/* Mobile cards for pending users */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {pendingUsers.map(u => (
                            <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-amber-200/60 dark:border-gray-700 flex items-center justify-between gap-3 shadow-sm">
                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{u.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                                    <span className="inline-block mt-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                        Dept: {u.department || 'General'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleUserApproval(u.id, true)}
                                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
                                        title="Approve User"
                                    >
                                        <Check className="w-4 h-4" /> <span className="hidden sm:inline">Activate</span>
                                    </button>
                                    <button
                                        onClick={() => handleUserApproval(u.id, false)}
                                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 rounded-xl transition-all active:scale-95"
                                        title="Reject User"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Tabs (Horizontal touch scrolling on mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {['Pending', 'Approved', 'Rejected', 'All'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-95 ${
                            filterStatus === status
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        {status} ({claims.filter(c => status === 'All' ? true : c.status === status).length})
                    </button>
                ))}
            </div>

            {/* Claims Queue */}
            {filteredClaims.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">No {filterStatus} tasks found</h3>
                    <p className="text-xs text-gray-400 mt-1">All employee claims in this category have been processed.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Mobile-optimized Card List */}
                    {filteredClaims.map(claim => (
                        <div
                            key={claim.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200/90 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            {/* Left: Info */}
                            <div className="flex items-start gap-3.5 min-w-0 cursor-pointer" onClick={() => navigate(`/claim/${claim.id}`)}>
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-md ${
                                    claim.type === 'Travel' ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}>
                                    {claim.type === 'Travel' ? <MapPin className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                            {claim.title}
                                        </h4>
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                            claim.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                            claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                        }`}>
                                            {claim.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                        <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                            <User className="w-3.5 h-3.5" /> {claim.User?.name || 'Employee'}
                                        </span>
                                        <span>•</span>
                                        <span>Dept: {claim.department}</span>
                                        <span>•</span>
                                        <span>{claim.date}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Amount & Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700/80">
                                <div className="text-left md:text-right">
                                    <span className="block text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                        ${parseFloat(claim.amount).toFixed(2)}
                                    </span>
                                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider">{claim.type} Claim</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {claim.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(claim.id, 'Approved')}
                                                disabled={actionLoading === claim.id + '_Approved'}
                                                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-green-600/20 transition-all flex items-center gap-1.5"
                                            >
                                                <Check className="w-4 h-4" /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(claim.id, 'Rejected')}
                                                disabled={actionLoading === claim.id + '_Rejected'}
                                                className="px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-600 dark:text-red-300 active:scale-95 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                                            >
                                                <X className="w-4 h-4" /> Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => navigate(`/claim/${claim.id}`)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                                        title="View Details"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Tasks;
