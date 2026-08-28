import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, FileText, Settings, LogOut, User, DollarSign, Menu, CheckCircle, Clock, Plus, ChevronDown, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-primary text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
        }
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
    </NavLink>
);

const Layout = ({ role: routeRole }) => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // If role doesn't match, redirect (simple protection)
    // In a real app, handle this in Route guards
    React.useEffect(() => {
        if (user && routeRole === 'admin' && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, routeRole, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Travel<span className="text-blue-600">Expense</span>
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink to={user?.role === 'admin' ? "/admin" : "/dashboard"} className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                            <Home className="w-4 h-4" />
                            <span>Dashboard</span>
                        </NavLink>
                        {user?.role === 'admin' && (
                            <NavLink to="/employees" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                                <User className="w-4 h-4" />
                                <span>Employees</span>
                            </NavLink>
                        )}
                        <NavLink to="/history" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                            <Clock className="w-4 h-4" />
                            <span>History</span>
                        </NavLink>
                        {(user?.role === 'admin' || user?.isApprover) && (
                            <NavLink to="/tasks" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                                <CheckCircle className="w-4 h-4" />
                                <span>Tasks</span>
                            </NavLink>
                        )}

                        {/* Submit New Dropdown Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Submit New</span>
                                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button onClick={() => navigate('/submit-request')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">New Travel Request</span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">Plan a new trip</span>
                                        </div>
                                    </button>
                                    <button onClick={() => navigate('/submit-claim')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">New Expense Claim</span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">Reimburse expenses</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 text-gray-400 bg-gray-100 dark:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors">
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>

                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Guest User'}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Guest'}</span>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <User className="w-5 h-5" />
                    </div>

                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>

                    <button className="md:hidden text-gray-600 dark:text-gray-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header >

            {/* Main Content */}
            < main className="p-6 max-w-[1600px] mx-auto space-y-8" >
                <Outlet />
            </main >

            {/* Mobile Menu Overlay */}
            {
                isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
                        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-bold text-lg dark:text-white">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="dark:text-gray-400"><X className="w-6 h-6" /></button>
                            </div>
                            <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium">
                                <Home className="w-5 h-5" /> Dashboard
                            </NavLink>
                            {user?.role === 'admin' && (
                                <NavLink to="/employees" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium">
                                    <User className="w-5 h-5" /> Employees
                                </NavLink>
                            )}
                            <NavLink to="/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium">
                                <Clock className="w-5 h-5" /> History
                            </NavLink>
                            <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium mt-auto">
                                <LogOut className="w-5 h-5" /> Logout
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Layout;
