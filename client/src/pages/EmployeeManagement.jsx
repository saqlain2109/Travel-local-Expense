import React, { useState, useEffect, useMemo } from 'react';
import {
    User, Mail, Shield, Plus, X, Search, Trash2, Edit2, Check,
    CheckCircle, XCircle, ArrowRight, Building, Loader2, Layers,
    ChevronRight, Briefcase, Tag, AlertTriangle, Calendar, UserCheck, Settings
} from 'lucide-react';
import { api } from '../services/api';

const EmployeeManagement = () => {
    const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'matrix' | 'departments' | 'categories'
    const [users, setUsers] = useState([]);
    const [matrix, setMatrix] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingDeptId, setEditingDeptId] = useState(null);
    const [editingCatId, setEditingCatId] = useState(null);
    const [delegatingUser, setDelegatingUser] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [customLevelMode, setCustomLevelMode] = useState(false);

    // Form Data
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
        level: 1,
        customLevel: ''
    });

    const [deptFormData, setDeptFormData] = useState({
        name: '',
        description: ''
    });

    const [catFormData, setCatFormData] = useState({
        name: '',
        maxLimit: 200,
        description: '',
        isReceiptRequired: true,
        icon: 'Tag'
    });

    const [delegateFormData, setDelegateFormData] = useState({
        delegatedApproverId: '',
        delegatedUntil: ''
    });

    const fetchData = async () => {
        try {
            const [usersData, matrixData, deptsData, catsData] = await Promise.all([
                api.getUsers(),
                api.getMatrix(),
                api.getDepartments().catch(() => []),
                api.getCategories().catch(() => [])
            ]);
            setUsers(usersData || []);
            setMatrix(matrixData || []);
            setDepartments(deptsData || []);
            setCategories(catsData || []);
        } catch (error) {
            console.error("Failed to fetch settings data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers: Employee
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            alert(error.message || "Failed to save user");
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
        const defaultDept = departments.length > 0 ? departments[0].name : '';
        setFormData({ name: '', username: '', email: '', password: '', role: 'user', department: defaultDept });
        setIsModalOpen(true);
    };

    // Instant Responsive Status Toggle (Optimistic Update)
    const handleToggleActive = async (id, currentStatus) => {
        if (togglingId) return;
        const newStatus = !currentStatus;

        setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: newStatus } : u));
        setTogglingId(id);

        try {
            await api.updateUser(id, { isActive: newStatus });
        } catch (error) {
            console.error("Failed to update user status", error);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: currentStatus } : u));
            alert("Failed to update status. Please try again.");
        } finally {
            setTogglingId(null);
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

    // Delegation / Out of Office Handler
    const handleOpenDelegate = (u) => {
        setDelegatingUser(u);
        setDelegateFormData({
            delegatedApproverId: u.delegatedApproverId || '',
            delegatedUntil: u.delegatedUntil || ''
        });
        setIsDelegateModalOpen(true);
    };

    const handleDelegateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.setDelegation(delegatingUser.id, delegateFormData);
            setIsDelegateModalOpen(false);
            setDelegatingUser(null);
            fetchData();
        } catch (err) {
            console.error("Delegation failed", err);
            alert("Failed to update delegation");
        }
    };

    // Handlers: Approval Matrix
    const handleMatrixChange = (e) => {
        const { name, value } = e.target;
        if (name === 'level' && value === 'custom') {
            setCustomLevelMode(true);
            setMatrixFormData(prev => ({ ...prev, level: 'custom', customLevel: '4' }));
        } else if (name === 'level') {
            setCustomLevelMode(false);
            setMatrixFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
        } else {
            setMatrixFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleOpenMatrixModal = () => {
        const defaultDept = departments.length > 0 ? departments[0].name : '';
        setMatrixFormData({ department: defaultDept, approverId: '', level: 1, customLevel: '' });
        setCustomLevelMode(false);
        setIsMatrixModalOpen(true);
    };

    const handleMatrixSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalLevel = customLevelMode
                ? parseInt(matrixFormData.customLevel, 10) || 1
                : parseInt(matrixFormData.level, 10) || 1;

            await api.createMatrix({
                department: matrixFormData.department,
                approverId: matrixFormData.approverId,
                level: finalLevel
            });
            setIsMatrixModalOpen(false);
            setMatrixFormData({ department: '', approverId: '', level: 1, customLevel: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to add matrix rule", error);
            alert(error.message || "Failed to add matrix rule");
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

    // Handlers: Department Master
    const handleDeptChange = (e) => {
        setDeptFormData({ ...deptFormData, [e.target.name]: e.target.value });
    };

    const handleOpenAddDept = () => {
        setEditingDeptId(null);
        setDeptFormData({ name: '', description: '' });
        setIsDeptModalOpen(true);
    };

    const handleEditDept = (d) => {
        setEditingDeptId(d.id);
        setDeptFormData({ name: d.name, description: d.description || '' });
        setIsDeptModalOpen(true);
    };

    const handleDeptSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDeptId) {
                await api.updateDepartment(editingDeptId, deptFormData);
            } else {
                await api.createDepartment(deptFormData);
            }
            setIsDeptModalOpen(false);
            setEditingDeptId(null);
            setDeptFormData({ name: '', description: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to save department", error);
            alert(error.message || "Failed to save department");
        }
    };

    const handleDeleteDept = async (id) => {
        if (window.confirm("Are you sure you want to delete this department?")) {
            try {
                await api.deleteDepartment(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete department", error);
            }
        }
    };

    // Handlers: Category Master
    const handleCatChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCatFormData({ ...catFormData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleOpenAddCat = () => {
        setEditingCatId(null);
        setCatFormData({ name: '', maxLimit: 200, description: '', isReceiptRequired: true, icon: 'Tag' });
        setIsCategoryModalOpen(true);
    };

    const handleEditCat = (c) => {
        setEditingCatId(c.id);
        setCatFormData({
            name: c.name,
            maxLimit: c.maxLimit || 200,
            description: c.description || '',
            isReceiptRequired: c.isReceiptRequired !== false,
            icon: c.icon || 'Tag'
        });
        setIsCategoryModalOpen(true);
    };

    const handleCatSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCatId) {
                await api.updateCategory(editingCatId, catFormData);
            } else {
                await api.createCategory(catFormData);
            }
            setIsCategoryModalOpen(false);
            setEditingCatId(null);
            fetchData();
        } catch (error) {
            console.error("Failed to save category", error);
            alert(error.message || "Failed to save category");
        }
    };

    const handleDeleteCat = async (id) => {
        if (window.confirm("Are you sure you want to delete this expense category?")) {
            try {
                await api.deleteCategory(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete category", error);
            }
        }
    };

    // Filter Users
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group Approval Matrix by Department
    const groupedMatrix = useMemo(() => {
        const map = {};
        matrix.forEach(rule => {
            const dept = rule.department || 'Unassigned';
            if (!map[dept]) map[dept] = [];
            map[dept].push(rule);
        });
        Object.keys(map).forEach(dept => {
            map[dept].sort((a, b) => (a.level || 1) - (b.level || 1));
        });
        return map;
    }, [matrix]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Organization & Master Settings</h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Manage company master data: departments, expense policy categories, employees, and multi-level approval workflows
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'employees' && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Employee
                        </button>
                    )}
                    {activeTab === 'matrix' && (
                        <button
                            onClick={handleOpenMatrixModal}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Approval Rule
                        </button>
                    )}
                    {activeTab === 'departments' && (
                        <button
                            onClick={handleOpenAddDept}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Department
                        </button>
                    )}
                    {activeTab === 'categories' && (
                        <button
                            onClick={handleOpenAddCat}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-amber-500/20 transition-all w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Category & Limit
                        </button>
                    )}
                </div>
            </div>

            {/* 4-Tab Master Navigation */}
            <div className="flex bg-gray-200/70 dark:bg-gray-800 p-1 rounded-2xl w-full sm:w-max overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'employees'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Team Members ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'matrix'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Approval Matrix ({matrix.length})
                </button>
                <button
                    onClick={() => setActiveTab('departments')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'departments'
                            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Departments ({departments.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'categories'
                            ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    Category Policies ({categories.length})
                </button>
            </div>

            {/* TAB 1: Employees Directory */}
            {activeTab === 'employees' && (
                <div className="space-y-4 animate-in fade-in duration-200">
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

                    {/* Desktop View: Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Employee</th>
                                    <th className="py-3.5 px-6">Email</th>
                                    <th className="py-3.5 px-6">Department</th>
                                    <th className="py-3.5 px-6">Delegation (Out-of-Office)</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {filteredUsers.map(u => {
                                    const delegatee = users.find(x => x.id === u.delegatedApproverId);
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="block font-semibold">{u.name}</span>
                                                        <span className="text-xs text-gray-400">@{u.username} • {u.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{u.email}</td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                                                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-semibold">
                                                    {u.department || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                                                {delegatee ? (
                                                    <div className="text-xs">
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">➡️ {delegatee.name}</span>
                                                        <span className="block text-[10px] text-gray-400">Until {u.delegatedUntil || 'Revoked'}</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenDelegate(u)}
                                                        className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1 font-medium"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5" /> Set Delegate
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    type="button"
                                                    disabled={togglingId === u.id}
                                                    onClick={() => handleToggleActive(u.id, u.isActive)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 ${
                                                        u.isActive
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <div className={`w-2.5 h-2.5 rounded-full ${u.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                    <span>{u.isActive ? 'Active' : 'Disabled'}</span>
                                                    {togglingId === u.id && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenDelegate(u)}
                                                        title="Out of Office / Delegate Approvals"
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleEditClick(u)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: Dynamic Multi-level Approval Matrix */}
            {activeTab === 'matrix' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {Object.keys(groupedMatrix).length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                            <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">No Approval Matrix Defined</h3>
                            <p className="text-xs text-gray-400 mt-1">Configure sequential approvers (Level 1, Level 2, Level 3, Level 4...) for each department.</p>
                            <button
                                onClick={handleOpenMatrixModal}
                                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                            >
                                + Add First Approval Rule
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {Object.keys(groupedMatrix).map(dept => (
                                <div key={dept} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                                <Building className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-gray-900 dark:text-white">{dept} Department</h3>
                                                <span className="text-xs text-gray-400">{groupedMatrix[dept].length} Approval Step(s)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        {groupedMatrix[dept].map((rule, idx) => (
                                            <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                                        L{rule.level}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                                {rule.Approver?.name || `User ID #${rule.approverId}`}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 uppercase font-semibold">({rule.Approver?.role || 'Approver'})</span>
                                                        </div>
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                            Level {rule.level} Approver
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMatrix(rule.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                                    title="Remove Rule"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Departments Master Table */}
            {activeTab === 'departments' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map(dept => {
                            const empCount = users.filter(u => u.department === dept.name).length;
                            return (
                                <div key={dept.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-gray-900 dark:text-white">{dept.name}</h3>
                                                <span className="text-xs text-gray-400">{empCount} Assigned Team Member(s)</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEditDept(dept)}
                                                className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDept(dept.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {dept.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-xl">
                                            {dept.description}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 4: Categories & Policy Spending Limits Master */}
            {activeTab === 'categories' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-gray-900 dark:text-white">{cat.name}</h3>
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                Cap: ${cat.maxLimit} / claim
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditCat(cat)}
                                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCat(cat.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {cat.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-xl">
                                        {cat.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs text-gray-400">
                                    <span>Receipt Required:</span>
                                    <span className={`font-bold ${cat.isReceiptRequired !== false ? 'text-amber-600' : 'text-gray-400'}`}>
                                        {cat.isReceiptRequired !== false ? 'Yes (Mandatory)' : 'Optional'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Out-of-Office Delegation Modal */}
            {isDelegateModalOpen && delegatingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Delegate Approvals (Out-of-Office)
                                </h3>
                                <p className="text-xs text-gray-500">Temporarily route approvals for {delegatingUser.name}</p>
                            </div>
                            <button onClick={() => setIsDelegateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleDelegateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Temporary Delegate Approver</label>
                                <select
                                    name="delegatedApproverId"
                                    value={delegateFormData.delegatedApproverId}
                                    onChange={(e) => setDelegateFormData({ ...delegateFormData, delegatedApproverId: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">None (Approvals stay with {delegatingUser.name})</option>
                                    {users.filter(u => u.id !== delegatingUser.id).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role}) - {u.department || 'No Dept'}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Delegation Active Until</label>
                                <input
                                    type="date"
                                    name="delegatedUntil"
                                    value={delegateFormData.delegatedUntil}
                                    onChange={(e) => setDelegateFormData({ ...delegateFormData, delegatedUntil: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsDelegateModalOpen(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Save Delegation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Master Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingCatId ? 'Edit Category & Policy' : 'Add Expense Category'}
                            </h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCatSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Category Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={catFormData.name}
                                    onChange={handleCatChange}
                                    className="input-field"
                                    placeholder="e.g. Client Dinner, Taxi"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Allowable Limit ($ per claim)</label>
                                <input
                                    type="number"
                                    name="maxLimit"
                                    required
                                    value={catFormData.maxLimit}
                                    onChange={handleCatChange}
                                    className="input-field"
                                    placeholder="200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows="2"
                                    value={catFormData.description}
                                    onChange={handleCatChange}
                                    className="input-field resize-none"
                                    placeholder="Policy guidelines for this category..."
                                ></textarea>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isReceiptRequired"
                                    name="isReceiptRequired"
                                    checked={catFormData.isReceiptRequired}
                                    onChange={handleCatChange}
                                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                />
                                <label htmlFor="isReceiptRequired" className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                    Mandatory Receipt / Bill Upload Required
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                                    Save Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Employee Modal with Dynamic Department Select */}
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
                                    placeholder="e.g. Alex Smith"
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
                                    placeholder="e.g. asmith"
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
                                    placeholder="e.g. alex@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Department (From Master)</label>
                                <select
                                    name="department"
                                    required
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!editingUserId}
                                    placeholder={editingUserId ? 'Leave blank to keep current' : 'Enter login password'}
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
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
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

            {/* Matrix Rule Modal with Dynamic Department & Infinite Levels */}
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
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Department (From Master)</label>
                                <select
                                    name="department"
                                    required
                                    value={matrixFormData.department}
                                    onChange={handleMatrixChange}
                                    className="input-field"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
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
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.role}) - {u.department || 'No Dept'}
                                        </option>
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
                                    <option value="4">Level 4 (Vice President / Executive)</option>
                                    <option value="5">Level 5 (CFO / President)</option>
                                    <option value="6">Level 6 (Board / Custom)</option>
                                    <option value="custom">Custom Level Number...</option>
                                </select>
                            </div>

                            {customLevelMode && (
                                <div className="animate-in fade-in">
                                    <label className="block text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                                        Enter Custom Level Number
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        required
                                        name="customLevel"
                                        value={matrixFormData.customLevel}
                                        onChange={handleMatrixChange}
                                        className="input-field border-indigo-500"
                                        placeholder="e.g. 7, 8, 9..."
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsMatrixModalOpen(false)} className="btn-secondary flex-1">
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

            {/* Department Master Modal */}
            {isDeptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingDeptId ? 'Edit Department' : 'Add New Department'}
                            </h3>
                            <button onClick={() => setIsDeptModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleDeptSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Department Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={deptFormData.name}
                                    onChange={handleDeptChange}
                                    className="input-field"
                                    placeholder="e.g. Engineering, Legal, Operations"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={deptFormData.description}
                                    onChange={handleDeptChange}
                                    className="input-field resize-none"
                                    placeholder="Brief description of department scope..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {editingDeptId ? 'Update Department' : 'Create Department'}
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
