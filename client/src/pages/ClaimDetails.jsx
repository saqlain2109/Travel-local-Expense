import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Trash2, CheckCircle, XCircle, Clock, FileText, User, Calendar, Tag, Paperclip, MessageSquare, Send } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ClaimDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);

    const { user } = useAuth(); // Get current user for permission checks

    useEffect(() => {
        const fetchClaim = async () => {
            try {
                const data = await api.getClaim(id);
                setClaim(data);
            } catch (error) {
                console.error("Failed to fetch claim", error);
            }
        };
        if (id) fetchClaim();
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        try {
            const updatedClaim = await api.updateClaimStatus(id, newStatus);
            setClaim(updatedClaim);
            // Auto close/navigate back
            setTimeout(() => {
                navigate(-1);
            }, 1000);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    if (!claim) return <div>Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-2">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{claim.title}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {claim.status}
                        </span>
                        <span className="text-gray-400 text-sm">Submitted on {claim.date}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                        <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm">
                        <Trash2 className="w-4 h-4" /> Withdraw
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Details Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Claim Details
                            </h2>
                            <p className="text-sm text-gray-500">View and manage expense claim information</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <span className="font-bold text-lg">$</span>
                                    </div>
                                    <span className="font-medium text-gray-700">Amount</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">${claim.amount?.toFixed(2)}</span>
                            </div>

                            <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-gray-700">Employee</span>
                                </div>
                                <span className="text-gray-900">{claim.User?.name || 'Unknown'}</span>
                            </div>

                            <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-gray-700">Category/Type</span>
                                </div>
                                <span className="text-gray-900">{claim.category || claim.type}</span>
                            </div>

                            {claim.type === 'Travel' && (
                                <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-gray-700">Travel Dates</span>
                                    </div>
                                    <span className="text-gray-900">{claim.startDate} - {claim.endDate}</span>
                                </div>
                            )}

                            <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                                        <Paperclip className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-gray-700">Receipt Status</span>
                                </div>
                                <span className="text-sm text-gray-500 italic">{claim.receiptUrl ? 'Receipt attached' : 'No receipt attached'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Comments Section - Placeholder for now as DB doesn't have comments table yet */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
                            <MessageSquare className="w-5 h-5 text-blue-600" /> Comments
                        </h2>
                        <p className="text-gray-400 text-sm italic">Comments functionality coming soon...</p>
                    </div>
                </div>

                {/* Right Column - Actions Sidebar */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Status</h3>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                ${claim.status === 'Approved' ? 'bg-green-100 text-green-600' :
                                    claim.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                        'bg-amber-100 text-amber-600'}`}>
                                {claim.status === 'Approved' ? <CheckCircle className="w-5 h-5" /> :
                                    claim.status === 'Rejected' ? <XCircle className="w-5 h-5" /> :
                                        <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{claim.status}</p>
                                <p className="text-xs text-gray-500">
                                    {claim.status === 'Approved' ? 'Claim approved' :
                                        claim.status === 'Rejected' ? 'Claim rejected' :
                                            'Awaiting review'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Manager Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Manager Actions</h3>
                        <p className="text-xs text-gray-400 mb-4">Approve or reject this expense claim</p>

                        <div className="space-y-3">
                            {/* Allow Admin OR the assigned Approver to act */}
                            {((user?.role === 'admin') || (user?.id === claim.approverId)) && claim.status === 'Pending' ? (
                                <>
                                    <button
                                        onClick={() => handleStatusChange('Approved')}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve Claim
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('Rejected')}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject Claim
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    {claim.status === 'Pending' ? (
                                        <p className="text-sm text-gray-500 italic">
                                            {user?.id === claim.UserId ? "Waiting for approval..." : "You are not authorized to approve this claim."}
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                                            {claim.status === 'Approved' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                                            Claim {claim.status}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visual Approval Timeline */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Approval Progress</h3>

                        <div className="relative pl-2 space-y-6">
                            {(claim.approvalFlow || []).map((step, index) => {
                                // Determine Step Status
                                let stepStatus = 'upcoming'; // pending/gray
                                const isCurrentApprover = step.approverId === claim.approverId;

                                if (claim.status === 'Approved') {
                                    stepStatus = 'completed';
                                } else if (claim.status === 'Rejected') {
                                    // If we are at the step that rejected it, or before it? 
                                    // Hard to track who rejected exactly without logs, but we can infer:
                                    // If current approver matches, they probably rejected it? 
                                    // Or we just show Red for the current step and green for previous?
                                    // Simplified: If rejected, show as X.
                                    stepStatus = 'rejected';
                                } else {
                                    // Status is Pending
                                    // We need to know if this step is passed or current or future.
                                    // We can compare levels if we assume sequential levels.

                                    // Find current level from claim.approverId
                                    const currentStep = claim.approvalFlow.find(s => s.approverId === claim.approverId);
                                    const currentLevel = currentStep?.level || 0;

                                    if (step.level < currentLevel) stepStatus = 'completed';
                                    else if (step.level === currentLevel) stepStatus = 'current';
                                    else stepStatus = 'upcoming';
                                }

                                return (
                                    <div key={step.id} className="relative flex gap-4">
                                        {/* Line connector */}
                                        {index !== (claim.approvalFlow.length - 1) && (
                                            <div className={`absolute left-[11px] top-6 bottom-[-24px] w-0.5 ${stepStatus === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        )}

                                        {/* Icon */}
                                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 
                                            ${stepStatus === 'completed' ? 'bg-green-50 border-green-500 text-green-600' :
                                                stepStatus === 'current' ? 'bg-blue-50 border-blue-500 text-blue-600 animate-pulse' :
                                                    stepStatus === 'rejected' ? 'bg-red-50 border-red-500 text-red-600' :
                                                        'bg-gray-50 border-gray-200 text-gray-300'}`}>

                                            {stepStatus === 'completed' && <CheckCircle className="w-3 h-3" />}
                                            {stepStatus === 'rejected' && <XCircle className="w-3 h-3" />}
                                            {stepStatus === 'current' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                            {stepStatus === 'upcoming' && <span className="text-[10px] font-bold">{step.level}</span>}
                                        </div>

                                        {/* Text */}
                                        <div>
                                            <p className={`text-sm font-medium ${stepStatus === 'current' ? 'text-blue-700' : 'text-gray-900'}`}>
                                                {step.Approver?.name || 'Unknown Approver'}
                                            </p>
                                            <p className="text-xs text-gray-500">{step.Approver?.role} (Level {step.level})</p>
                                            {stepStatus === 'current' && <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Awaiting Action</span>}
                                        </div>
                                    </div>
                                );
                            })}

                            {(!claim.approvalFlow || claim.approvalFlow.length === 0) && (
                                <p className="text-sm text-gray-400 italic">No approval steps defined for this department.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button onClick={() => navigate('/submit-expense')} className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all font-medium">
                                + New Expense Claim
                            </button>
                            <button onClick={() => navigate('/history')} className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all font-medium">
                                Value History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimDetails;
