import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, FileText, Settings, LogOut, User, DollarSign, Menu,
    CheckCircle, Clock, Plus, ChevronDown, X, Sun, Moon, Bell,
    XCircle, UserPlus, Check, Plane, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

const Layout = ({ role: routeRole }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [readNotifIds, setReadNotifIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('readNotifs') || '[]');
        } catch { return []; }
    });

    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Redirect guard
    useEffect(() => {
        if (user && routeRole === 'admin' && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, routeRole, navigate]);

    // Notification Fetcher
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                const notifs = [];
                const isAdmin = user.role === 'admin';

                const roleParam = isAdmin ? 'admin' : null;
                const userIdParam = isAdmin ? null : user.id;
                const claimsData = await api.getClaims(userIdParam, roleParam);

                // 1. Pending Approval Tasks (For Approver or Admin)
                const pendingTasks = claimsData.filter(c => c.status === 'Pending' && (isAdmin || c.approverId === user.id));
                pendingTasks.forEach(c => {
                    notifs.push({
                        id: `task_${c.id}`,
                        title: `Pending Approval: ${c.title}`,
                        message: `${c.User?.name || 'Employee'} submitted $${c.amount} (${c.type})`,
                        date: c.date,
                        link: `/claim/${c.id}`,
                        type: 'pending'
                    });
                });

                // 2. User Claim Status Updates (For Requesters)
                const myClaims = claimsData.filter(c => c.UserId === user.id && (c.status === 'Approved' || c.status === 'Rejected'));
                myClaims.forEach(c => {
                    notifs.push({
                        id: `status_${c.id}_${c.status}`,
                        title: `Claim ${c.status}`,
                        message: `Your request "${c.title}" for $${c.amount} was ${c.status.toLowerCase()}.`,
                        date: c.date,
                        link: `/claim/${c.id}`,
                        type: c.status === 'Approved' ? 'approved' : 'rejected'
                    });
                });

                // 3. Admin Pending Registrations
                if (isAdmin) {
                    const usersData = await api.getUsers();
                    const pendingUsers = usersData.filter(u => u.isActive === false);
                    pendingUsers.forEach(u => {
                        notifs.push({
                            id: `user_${u.id}`,
                            title: `New User Registration`,
                            message: `${u.name} (${u.department || 'No Dept'}) pending activation`,
                            date: 'Action needed',
                            link: `/employees`,
                            type: 'user'
                        });
                    });
                }

                setNotifications(notifs);
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;
    const pendingTasksCount = notifications.filter(n => n.type === 'pending').length;

    const handleMarkAllRead = () => {
        const allIds = notifications.map(n => n.id);
        setReadNotifIds(allIds);
        localStorage.setItem('readNotifs', JSON.stringify(allIds));
    };

    const handleNotifClick = (notif) => {
        if (!readNotifIds.includes(notif.id)) {
            const updated = [...readNotifIds, notif.id];
            setReadNotifIds(updated);
            localStorage.setItem('readNotifs', JSON.stringify(updated));
        }
        setIsNotifOpen(false);
        navigate(notif.link);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const homePath = user?.role === 'admin' ? '/admin' : '/dashboard';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(homePath)}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
                                Travel<span className="text-blue-600 dark:text-blue-400">Expense</span>
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 ml-4">
                        <NavLink to={homePath} className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                            <Home className="w-4 h-4" />
                            <span>Dashboard</span>
                        </NavLink>
                        {user?.role === 'admin' && (
                            <NavLink to="/employees" className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                                <User className="w-4 h-4" />
                                <span>Employees</span>
                            </NavLink>
                        )}
                        <NavLink to="/history" className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                            <Clock className="w-4 h-4" />
                            <span>History</span>
                        </NavLink>
                        {(user?.role === 'admin' || user?.isApprover) && (
                            <NavLink to="/tasks" className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                                <CheckCircle className="w-4 h-4" />
                                <span>Tasks</span>
                                {pendingTasksCount > 0 && (
                                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {pendingTasksCount}
                                    </span>
                                )}
                            </NavLink>
                        )}

                        {/* Submit New Dropdown (Desktop) */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Submit Request</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <button onClick={() => navigate('/submit-request')} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <Plane className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">Travel Request</span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">Flights, hotels, per-diem</span>
                                        </div>
                                    </button>
                                    <button onClick={() => navigate('/submit-claim')} className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">Expense Claim</span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">Cabs, meals, local bills</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors relative"
                            title="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white dark:border-gray-900 animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Drawer / Panel */}
                        {isNotifOpen && (
                            <div className="fixed md:absolute top-16 md:top-full right-2 md:right-0 w-[calc(100vw-1rem)] md:w-96 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                                Mark all read
                                            </button>
                                        )}
                                        <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-600 md:hidden">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[60vh] md:max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                            No notifications right now
                                        </div>
                                    ) : (
                                        notifications.map(notif => {
                                            const isRead = readNotifIds.includes(notif.id);
                                            return (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => handleNotifClick(notif)}
                                                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                                                        isRead
                                                            ? 'bg-white dark:bg-gray-800 opacity-60'
                                                            : 'bg-blue-50/50 dark:bg-blue-900/15 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                                    }`}
                                                >
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {notif.type === 'pending' && <Clock className="w-5 h-5 text-amber-500" />}
                                                        {notif.type === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                                        {notif.type === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                                                        {notif.type === 'user' && <UserPlus className="w-5 h-5 text-blue-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                                {notif.title}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{notif.date}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                    {!isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dark/Light Mode Switcher */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>

                    {/* Desktop User Info */}
                    <div className="hidden md:flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{user?.name || 'User'}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'User'}</span>
                        </div>
                        <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1" title="Logout">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Viewport */}
            <main className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-28 md:pb-12">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation Bar (Fixed for Mobile Devices) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 px-3 py-2 flex items-center justify-around safe-bottom shadow-lg">
                <NavLink
                    to={homePath}
                    className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px]">Home</span>
                </NavLink>

                <NavLink
                    to="/history"
                    className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <Clock className="w-5 h-5" />
                    <span className="text-[10px]">History</span>
                </NavLink>

                {/* Center Floating (+) Quick Action Button */}
                <button
                    onClick={() => setIsActionSheetOpen(true)}
                    className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white w-12 h-12 rounded-full shadow-lg shadow-blue-500/40 active:scale-95 transition-transform"
                    aria-label="New Request"
                >
                    <Plus className="w-6 h-6" />
                </button>

                {(user?.role === 'admin' || user?.isApprover) ? (
                    <NavLink
                        to="/tasks"
                        className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-[10px]">Tasks</span>
                        {pendingTasksCount > 0 && (
                            <span className="absolute top-0 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900" />
                        )}
                    </NavLink>
                ) : (
                    <NavLink
                        to="/submit-claim"
                        className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <DollarSign className="w-5 h-5" />
                        <span className="text-[10px]">Expense</span>
                    </NavLink>
                )}

                {user?.role === 'admin' ? (
                    <NavLink
                        to="/employees"
                        className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px]">Team</span>
                    </NavLink>
                ) : (
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-gray-500 dark:text-gray-400"
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px]">Profile</span>
                    </button>
                )}
            </nav>

            {/* Mobile Bottom Sheet Quick Submit Action */}
            {isActionSheetOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsActionSheetOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-6 shadow-2xl border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom duration-200">
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submit New Request</h3>
                            <button onClick={() => setIsActionSheetOpen(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => { setIsActionSheetOpen(false); navigate('/submit-request'); }}
                                className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                                        <Plane className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-gray-900 dark:text-white">New Travel Request</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">Plan a trip, flight, train & hotel</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>

                            <button
                                onClick={() => { setIsActionSheetOpen(false); navigate('/submit-claim'); }}
                                className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-gray-900 dark:text-white">New Expense Claim</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">Reimburse fuel, food, local transport</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Drawer (Menu & User Profile) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col justify-between border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-200">
                        <div>
                            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{user?.name || 'User'}</h3>
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium capitalize">{user?.role || 'Employee'} • {user?.department || 'General'}</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Drawer Nav Links */}
                            <div className="py-6 space-y-1.5">
                                <NavLink to={homePath} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                                    <Home className="w-5 h-5 text-blue-600" /> Dashboard
                                </NavLink>
                                {user?.role === 'admin' && (
                                    <NavLink to="/employees" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                                        <User className="w-5 h-5 text-indigo-600" /> Employee Directory
                                    </NavLink>
                                )}
                                <NavLink to="/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                                    <Clock className="w-5 h-5 text-amber-600" /> Claims History
                                </NavLink>
                                {(user?.role === 'admin' || user?.isApprover) && (
                                    <NavLink to="/tasks" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600" /> Approval Tasks
                                        </div>
                                        {pendingTasksCount > 0 && (
                                            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {pendingTasksCount}
                                            </span>
                                        )}
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        {/* Drawer Bottom Logout */}
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-[0.98]"
                            >
                                <LogOut className="w-4 h-4" /> Logout from Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
