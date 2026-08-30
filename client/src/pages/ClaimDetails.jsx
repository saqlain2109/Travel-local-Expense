import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Edit, Trash2, CheckCircle, XCircle, Clock, FileText,
    User, Calendar, Tag, Paperclip, MessageSquare, Send, Download,
    DollarSign, MapPin, Check, X, Shield, AlertTriangle, HelpCircle,
    CreditCard, ArrowRight, CornerDownRight, Sparkles, Building, Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

const ClaimDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { user } = useAuth();

    // Modals & Forms
    const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);
    const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
    const [clarifyQuery, setClarifyQuery] = useState('');
    const [employeeResponseText, setEmployeeResponseText] = useState('');
    const [disburseData, setDisburseData] = useState({
        utrNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        comments: ''
    });

    const fetchClaim = async () => {
        try {
            const data = await api.getClaim(id);
            setClaim(data);
        } catch (error) {
            console.error("Failed to fetch claim", error);
        }
    };

    useEffect(() => {
        if (id) fetchClaim();
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        setActionLoading(true);
        try {
            await api.updateClaimStatus(id, newStatus, {
                performedByName: user?.name || 'Approver',
                performedByRole: user?.role === 'admin' ? 'Admin' : 'Manager'
            });
            // Navigate back to the task list
            navigate(-1);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleClarifySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.requestClarification(id, {
                query: clarifyQuery,
                performedByName: user?.name || 'Approver',
                performedByRole: user?.role === 'admin' ? 'Admin' : 'Manager'
            });
            setIsClarifyModalOpen(false);
            setClarifyQuery('');
            fetchClaim();
        } catch (err) {
            console.error("Clarification request failed", err);
            alert("Failed to request clarification");
        }
    };

    const handleResponseSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.respondClarification(id, {
                response: employeeResponseText,
                performedByName: user?.name || 'Employee'
            });
            setEmployeeResponseText('');
            fetchClaim();
        } catch (err) {
            console.error("Failed to send response", err);
            alert("Failed to submit response");
        }
    };

    const handleDisburseSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.disburseClaim(id, {
                ...disburseData,
                performedByName: user?.name || 'Finance Officer'
            });
            setIsDisburseModalOpen(false);
            fetchClaim();
        } catch (err) {
            console.error("Disbursement failed", err);
            alert("Failed to record payout");
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('claim-details-content');
        if (!element) return;

        try {
            const dataUrl = await htmlToImage.toPng(element, { backgroundColor: '#ffffff' });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Claim_${claim.id}_${claim.User?.name || 'Details'}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF", error);
            alert("Failed to generate PDF");
        }
    };

    if (!claim) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const isApprover = user && (user.role === 'admin' || user.id === claim.approverId);
    const isOwner = user && user.id === claim.UserId;
    const isFinanceOrAdmin = user && user.role === 'admin';

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
                        title="Go Back"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            {claim.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                                claim.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                claim.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                claim.status === 'Clarification' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                                claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}>
                                {claim.status === 'Disbursed' ? <Sparkles className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                                {claim.status === 'Disbursed' ? 'Disbursed / Paid' : claim.status}
                            </span>
                            <span className="text-xs text-gray-400">Date: {claim.date}</span>
                        </div>
                    </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 text-blue-600" />
                        <span>PDF Voucher</span>
                    </button>

                    {/* Finance Disburse Action */}
                    {isFinanceOrAdmin && claim.status === 'Approved' && (
                        <button
                            onClick={() => setIsDisburseModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>Mark as Disbursed (Pay)</span>
                        </button>
                    )}

                    {/* Approver Actions */}
                    {isApprover && claim.status === 'Pending' && (
                        <>
                            <button
                                onClick={() => setIsClarifyModalOpen(true)}
                                className="flex items-center gap-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-100"
                            >
                                <HelpCircle className="w-4 h-4" /> Clarify
                            </button>
                            <button
                                onClick={() => handleStatusChange('Approved')}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-green-500/20 transition-all"
                            >
                                <Check className="w-4 h-4" /> Approve
                            </button>
                            <button
                                onClick={() => handleStatusChange('Rejected')}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs sm:text-sm font-bold transition-all"
                            >
                                <X className="w-4 h-4" /> Reject
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Clarification Banner & Reply Box */}
            {claim.status === 'Clarification' && (
                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-3">
                        <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                                Clarification Requested by Approver
                            </h3>
                            <p className="text-xs text-indigo-800 dark:text-indigo-300 bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl">
                                "{claim.clarificationQuery}"
                            </p>
                        </div>
                    </div>

                    {isOwner && (
                        <form onSubmit={handleResponseSubmit} className="pt-2 space-y-2">
                            <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">Your Clarification Response:</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    value={employeeResponseText}
                                    onChange={(e) => setEmployeeResponseText(e.target.value)}
                                    placeholder="Type your explanation or update..."
                                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                                >
                                    Submit Response
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Disbursed Payment Badge */}
            {claim.status === 'Disbursed' && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">Disbursed & Paid Successfully</h3>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                Disbursed on <strong>{claim.paymentDate}</strong> via <strong>{claim.paymentMethod}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Transaction Ref / UTR</span>
                        <p className="font-mono font-black text-sm text-emerald-950 dark:text-emerald-100">{claim.utrNumber}</p>
                    </div>
                </div>
            )}

            {/* Main Printable Content Container */}
            <div id="claim-details-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Left 2 Columns: Core Claim Info & Receipts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 text-xs">
                        <div>
                            <span className="text-gray-400 block mb-0.5">Employee</span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{claim.User?.name || 'Unknown'}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block mb-0.5">Department</span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{claim.department || 'General'}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block mb-0.5">Claim Type</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{claim.type}</span>
                        </div>
                        {claim.category && (
                            <div>
                                <span className="text-gray-400 block mb-0.5">Category</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{claim.category}</span>
                            </div>
                        )}
                        {claim.destination && (
                            <div>
                                <span className="text-gray-400 block mb-0.5">Destination</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{claim.destination}</span>
                            </div>
                        )}
                        {claim.startDate && (
                            <div>
                                <span className="text-gray-400 block mb-0.5">Trip Dates</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{claim.startDate} to {claim.endDate}</span>
                            </div>
                        )}
                    </div>

                    {/* Advance Settlement Details */}
                    {parseFloat(claim.advanceAmount || 0) > 0 && (
                        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs space-y-2">
                            <h4 className="font-bold text-blue-900 dark:text-blue-200">Travel Advance Reconciliation</h4>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>Advance Cash Taken:</span>
                                <span className="font-bold">${claim.advanceAmount}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>Total Bills Claimed:</span>
                                <span className="font-bold">${claim.amount}</span>
                            </div>
                            <div className="flex justify-between font-black text-sm pt-2 border-t border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-200">
                                <span>Net Payout / Refund Balance:</span>
                                <span>${(parseFloat(claim.amount) - parseFloat(claim.advanceAmount)).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Description & Business Justification</h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl leading-relaxed whitespace-pre-wrap">
                            {claim.description || 'No additional description provided.'}
                        </p>
                    </div>

                    {/* Receipts Attachment Section */}
                    {claim.receiptUrl && claim.receiptUrl !== 'https://via.placeholder.com/150' && (
                        <div>
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Attached Receipt Voucher</h3>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700 inline-block max-w-sm">
                                <img
                                    src={claim.receiptUrl}
                                    alt="Receipt"
                                    className="rounded-xl max-h-56 object-contain cursor-pointer hover:opacity-95"
                                    onClick={() => window.open(claim.receiptUrl, '_blank')}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Amount Card & Interactive Audit Timeline */}
                <div className="space-y-6">
                    {/* Amount Card */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg space-y-1">
                        <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Claim Amount</span>
                        <h2 className="text-3xl font-black">${parseFloat(claim.amount).toFixed(2)}</h2>
                        <span className="text-[10px] text-blue-200 block pt-1">
                            Status: <strong>{claim.status}</strong>
                        </span>
                    </div>

                    {/* Interactive Lifecycle Audit Trail Timeline */}
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/60 space-y-4">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Audit Trail & History
                        </h3>

                        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-600">
                            {(!claim.AuditLogs || claim.AuditLogs.length === 0) ? (
                                <p className="text-xs text-gray-400 italic pl-6">No audit records recorded yet.</p>
                            ) : (
                                claim.AuditLogs.map((log, idx) => (
                                    <div key={log.id || idx} className="relative flex items-start gap-3 pl-1">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold z-10 shrink-0 shadow-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-0.5 text-xs">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-gray-900 dark:text-white">{log.action}</span>
                                                <span className="text-[10px] text-gray-400">by {log.performedByName} ({log.performedByRole})</span>
                                            </div>
                                            {log.comments && (
                                                <p className="text-gray-600 dark:text-gray-300 text-[11px] bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    {log.comments}
                                                </p>
                                            )}
                                            <span className="text-[10px] text-gray-400 block">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Clarification Modal */}
            {isClarifyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Clarification</h3>
                            <button onClick={() => setIsClarifyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleClarifySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">What information is needed?</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={clarifyQuery}
                                    onChange={(e) => setClarifyQuery(e.target.value)}
                                    placeholder="e.g. Please attach the itemized taxi receipt with GST number..."
                                    className="input-field resize-none"
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsClarifyModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Send Query</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Finance Disbursement Modal */}
            {isDisburseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Finance Disbursement</h3>
                            <button onClick={() => setIsDisburseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleDisburseSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Bank UTR / Transaction Reference <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={disburseData.utrNumber}
                                    onChange={(e) => setDisburseData({ ...disburseData, utrNumber: e.target.value })}
                                    placeholder="e.g. UTR-9842145892"
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
                                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
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
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Finance Notes (Optional)</label>
                                <input
                                    type="text"
                                    value={disburseData.comments}
                                    onChange={(e) => setDisburseData({ ...disburseData, comments: e.target.value })}
                                    placeholder="e.g. Processed via HDFC Corporate Batch #42"
                                    className="input-field"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsDisburseModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Record & Disburse</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaimDetails;
