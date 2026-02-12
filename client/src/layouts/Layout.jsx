import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, FileText, Settings, LogOut, User, DollarSign, Menu, CheckCircle, Clock, Plus, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    const { user, logout } = useAuth();

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
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            Travel<span className="text-blue-600">Expense</span>
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink to={user?.role === 'admin' ? "/admin" : "/dashboard"} className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <Home className="w-4 h-4" />
                            <span>Dashboard</span>
                        </NavLink>
                        {user?.role === 'admin' && (
                            <NavLink to="/employees" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                <User className="w-4 h-4" />
                                <span>Employees</span>
                            </NavLink>
                        )}
                        <NavLink to="/history" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <Clock className="w-4 h-4" />
                            <span>History</span>
                        </NavLink>
                        {(user?.role === 'admin' || user?.isApprover) && (
                            <NavLink to="/tasks" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                <CheckCircle className="w-4 h-4" />
                                <span>Tasks</span>
                            </NavLink>
                        )}

                        {/* Submit New Dropdown Trigger (Visual Only for now) */}
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                            <Plus className="w-4 h-4" />
                            <span>Submit New</span>
                            <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                    </nav>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-sm font-semibold text-gray-900">{user?.name || 'Guest User'}</span>
                        <span className="text-xs text-gray-500 capitalize">{user?.role || 'Guest'}</span>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                        <User className="w-5 h-5" />
                    </div>

                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>

                    <button className="md:hidden text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
                        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-bold text-lg">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                                <Home className="w-5 h-5" /> Dashboard
                            </NavLink>
                            {user?.role === 'admin' && (
                                <NavLink to="/employees" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                                    <User className="w-5 h-5" /> Employees
                                </NavLink>
                            )}
                            <NavLink to="/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                                <Clock className="w-5 h-5" /> History
                            </NavLink>
                            <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 font-medium mt-auto">
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
