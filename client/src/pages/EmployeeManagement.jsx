import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Plus, X, Search, Trash2, Edit2, Check, CheckCircle, XCircle, ArrowRight, Building } from 'lucide-react';
import { api } from '../services/api';

const EmployeeManagement = () => {
    const [activeTab, setActiveTab] = useState('employees');
    const [users, setUsers] = useState([]);
    const [matrix, setMatrix] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        department: ''
    });

    const [matrixFormData, setMatrixFormData] = useState({
        department: '',
        approverId: '',
        level: 1
    });

    const fetchData = async () => {
        try {
            const [usersData, matrixData] = await Promise.all([api.getUsers(), api.getMatrix()]);
            setUsers(usersData);
            setMatrix(matrixData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMatrixChange = (e) => {
        setMatrixFormData({ ...matrixFormData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUserId) {
                await api.updateUser(editingUserId, formData);
            } else {
                await api.createUser(formData);
            }
            setIsModalOpen(false);
            setEditingUserId(null);
            setFormData({ name: '', username: '', email: '', password: '', role: 'user', department: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to save user", error);
        }
    };

    const handleEditClick = (u) => {
        setEditingUserId(u.id);
        setFormData({
            name: u.name,
            username: u.username,
            email: u.email,
            password: u.password || '',
            role: u.role,
            department: u.department || ''
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingUserId(null);
        setFormData({ name: '', username: '', email: '', password: '', role: 'user', department: '' });
        setIsModalOpen(true);
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const isActive = currentStatus === undefined ? true : currentStatus;
            await api.updateUser(id, { isActive: !isActive });
            fetchData();
        } catch (error) {
            console.error("Failed to update user", error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("Are you sure you want to delete this employee?")) {
            try {
                await api.deleteUser(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete user", error);
            }
        }
    };

    const handleMatrixSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createMatrix(matrixFormData);
            setIsMatrixModalOpen(false);
            setMatrixFormData({ department: '', approverId: '', level: 1 });
            fetchData();
        } catch (error) {
            console.error("Failed to add matrix rule", error);
        }
    };

    const handleDeleteMatrix = async (id) => {
        if (window.confirm("Remove this approval rule?")) {
            try {
                await api.deleteMatrix(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete matrix rule", error);
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Employee & Workflow Settings</h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage user accounts, roles and department approval matrix</p>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'employees' ? (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Employee
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsMatrixModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Approval Rule
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-200/70 dark:bg-gray-800 p-1 rounded-2xl w-full sm:w-max">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeTab === 'employees'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Team Members ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeTab === 'matrix'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Approval Matrix ({matrix.length})
                </button>
            </div>

            {/* Tab 1: Employees Directory */}
            {activeTab === 'employees' && (
                <div className="space-y-4">
                    {/* Search input */}
                    <div className="relative w-full sm:max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search employee name, department, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                        {filteredUsers.map(u => (
                            <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{u.name}</h4>
                                            <span className="text-xs text-gray-400">@{u.username}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                        u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    }`}>
                                        {u.role}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {u.email}</p>
                                    <p className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gray-400" /> Dept: <strong>{u.department || 'Unassigned'}</strong></p>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/80">
                                    <button
                                        onClick={() => handleToggleActive(u.id, u.isActive)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            u.isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>{u.isActive ? 'Active' : 'Pending Approval'}</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditClick(u)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-500 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Employee</th>
                                    <th className="py-3.5 px-6">Email</th>
                                    <th className="py-3.5 px-6">Department</th>
                                    <th className="py-3.5 px-6">Role</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="block font-semibold">{u.name}</span>
                                                    <span className="text-xs text-gray-400">@{u.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{u.email}</td>
                                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{u.department || '—'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                                u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handleToggleActive(u.id, u.isActive)}
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                                                    u.isActive
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}
                                            >
                                                <Shield className="w-3.5 h-3.5" />
                                                <span>{u.isActive ? 'Active' : 'Disabled / Pending'}</span>
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditClick(u)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 2: Approval Matrix Workflow */}
            {activeTab === 'matrix' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matrix.map(rule => (
                            <div key={rule.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl">
                                        Level {rule.level || 1} Approver
                                    </span>
                                    <button onClick={() => handleDeleteMatrix(rule.id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Building className="w-4 h-4 text-gray-400" />
                                        <span>Department: <strong className="text-gray-900 dark:text-white">{rule.department}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        <span>Assigned To: <strong className="text-gray-900 dark:text-white">{rule.Approver?.name || 'Manager'}</strong></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingUserId ? 'Edit Employee' : 'Add New Employee'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    placeholder="e.g. IT, Finance, HR, Sales"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!editingUserId}
                                    placeholder={editingUserId ? 'Leave blank to keep current' : ''}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="user">Employee (User)</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Save Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Matrix Rule Modal */}
            {isMatrixModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Add Approval Matrix Rule
                            </h3>
                            <button onClick={() => setIsMatrixModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleMatrixSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    required
                                    placeholder="e.g. IT, Finance, Marketing"
                                    value={matrixFormData.department}
                                    onChange={handleMatrixChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Assigned Approver</label>
                                <select
                                    name="approverId"
                                    required
                                    value={matrixFormData.approverId}
                                    onChange={handleMatrixChange}
                                    className="input-field"
                                >
                                    <option value="">Select Approver</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role}) - {u.department || 'No Dept'}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Approval Level</label>
                                <select
                                    name="level"
                                    value={matrixFormData.level}
                                    onChange={handleMatrixChange}
                                    className="input-field"
                                >
                                    <option value="1">Level 1 (Direct Manager)</option>
                                    <option value="2">Level 2 (Department Head)</option>
                                    <option value="3">Level 3 (Finance / Director)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsMatrixModalOpen(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Save Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;
