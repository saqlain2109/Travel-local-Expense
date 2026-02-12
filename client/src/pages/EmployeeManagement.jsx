import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Plus, X, Search, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { api } from '../services/api';

const EmployeeManagement = () => {
    const [activeTab, setActiveTab] = useState('employees'); // 'employees' or 'matrix'
    const [users, setUsers] = useState([]);
    const [matrix, setMatrix] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Employee Form Data
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        department: '' // New field
    });

    // Matrix Form Data
    const [matrixFormData, setMatrixFormData] = useState({
        department: '',
        approverId: ''
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

    const [editingUserId, setEditingUserId] = useState(null);

    // --- Employee Handlers ---
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

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setFormData({
            name: user.name,
            username: user.username,
            email: user.email,
            password: user.password || '',
            role: user.role,
            department: user.department || ''
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
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.deleteUser(id);
            fetchData();
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    // --- Matrix Handlers ---
    const handleMatrixSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.updateMatrix(matrixFormData);
            setIsMatrixModalOpen(false);
            setMatrixFormData({ department: '', approverId: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to save matrix rule", error);
        }
    };

    const handleDeleteMatrix = async (id) => {
        if (!window.confirm("Delete this approval rule?")) return;
        try {
            await api.deleteMatrix(id);
            fetchData();
        } catch (error) {
            console.error("Failed to delete matrix rule", error);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (user.department?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
                    <p className="text-gray-500 mt-1">Manage employees and approval workflows.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'employees' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Employees
                    </button>
                    <button
                        onClick={() => setActiveTab('matrix')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Approval Matrix
                    </button>
                </div>
            </div>

            {activeTab === 'employees' ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        {/* Search */}
                        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 w-full max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 border-none rounded-lg focus:outline-none focus:ring-0 text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add Employee
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border
                                                ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.department || <span className="text-gray-400 italic">None</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-1.5 text-xs font-medium ${user.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {user.isActive !== false ? 'Active' : 'Disabled'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleEditClick(user)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleToggleActive(user.id, user.isActive)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors">
                                                    <Shield className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Approval Matrix</h2>
                            <p className="text-sm text-gray-500">Define which users approve claims for each department.</p>
                        </div>
                        <button
                            onClick={() => setIsMatrixModalOpen(true)}
                            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add Rule
                        </button>
                    </div>

                    {/* Tree View for Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(matrix.reduce((acc, item) => {
                            (acc[item.department] = acc[item.department] || []).push(item);
                            return acc;
                        }, {})).map(([dept, rules]) => {
                            // Sort rules by level
                            const sortedRules = rules.sort((a, b) => (a.level || 1) - (b.level || 1));

                            return (
                                <div key={dept} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-gray-800">{dept}</h3>
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{sortedRules.length} Steps</span>
                                    </div>

                                    <div className="space-y-0">
                                        {sortedRules.map((rule, index) => (
                                            <div key={rule.id} className="relative pl-4 pb-6 last:pb-0">
                                                {/* Connecting Line */}
                                                {index !== sortedRules.length - 1 && (
                                                    <div className="absolute left-[27px] top-8 bottom-0 w-0.5 bg-gray-200"></div>
                                                )}

                                                <div className="flex items-start gap-3 group">
                                                    {/* Step Indicators */}
                                                    <div className="relative z-10 w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-500 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                                                        {rule.level || 1}
                                                    </div>

                                                    {/* Card */}
                                                    <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200 flex justify-between items-center hover:border-blue-300 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                                {rule.Approver?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{rule.Approver?.name || 'Unknown'}</p>
                                                                <p className="text-xs text-gray-500">{rule.Approver?.role || 'Approver'}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteMatrix(rule.id)}
                                                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                                            title="Remove Rule"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Down Arrow for flow */}
                                                {index !== sortedRules.length - 1 && (
                                                    <div className="ml-[22px] mt-1 text-gray-300">▼</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Next Step Button (Optional, enables quick add for this dept) */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                                        <button
                                            onClick={() => {
                                                const nextLevel = (sortedRules[sortedRules.length - 1]?.level || 0) + 1;
                                                setMatrixFormData({ department: dept, approverId: '', level: nextLevel });
                                                setIsMatrixModalOpen(true);
                                            }}
                                            className="text-xs text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Next Level
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty State */}
                        {Object.keys(matrix).length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p>No approval flows defined correctly.</p>
                                <button onClick={() => setIsMatrixModalOpen(true)} className="mt-2 text-blue-600 font-medium hover:underline">Create your first flow</button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">{editingUserId ? 'Edit Employee' : 'Add New Employee'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                                <input required name="name" type="text" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Username</label>
                                    <input required name="username" type="text" value={formData.username} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
                                    <input required name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder={editingUserId ? "(Unchanged)" : ""} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                                <input required name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                                    <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Department</label>
                                    <input name="department" type="text" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="e.g. IT" />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Matrix Rule Modal */}
            {isMatrixModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">Add Approval Rule</h3>
                        </div>
                        <form onSubmit={handleMatrixSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Department</label>
                                <input
                                    required
                                    name="department"
                                    type="text"
                                    value={matrixFormData.department}
                                    onChange={handleMatrixChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Marketing"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Approval Level</label>
                                <input
                                    required
                                    name="level"
                                    type="number"
                                    min="1"
                                    value={matrixFormData.level || 1}
                                    onChange={handleMatrixChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">1 = First Approver, 2 = Second Approver, etc.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Approver</label>
                                <select
                                    required
                                    name="approverId"
                                    value={matrixFormData.approverId}
                                    onChange={handleMatrixChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                                >
                                    <option value="">Select an Approver</option>
                                    {users.filter(u => u.isActive !== false).map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-2">
                                <button type="button" onClick={() => setIsMatrixModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium shadow-sm">Add Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;
