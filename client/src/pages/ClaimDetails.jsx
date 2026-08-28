import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Trash2, CheckCircle, XCircle, Clock, FileText, User, Calendar, Tag, Paperclip, MessageSquare, Send, Download, DollarSign, MapPin, Check, X, Shield } from 'lucide-react';
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
        setActionLoading(true);
        try {
            const updatedClaim = await api.updateClaimStatus(id, newStatus);
            setClaim(updatedClaim);
            setTimeout(() => {
                navigate(-1);
            }, 800);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        } finally {
            setActionLoading(false);
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
                                claim.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}>
                                <Clock className="w-3 h-3" /> {claim.status}
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

                    {isOwner && claim.status === 'Pending' && (
                        <button
                            onClick={() => {
                                const route = claim.type === 'Travel' ? '/submit-request' : '/submit-claim';
                                navigate(route, { state: { editClaim: claim } });
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-100 transition-colors"
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Printable & Readable Claim Body */}
            <div id="claim-details-content" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-8 space-y-6">
                {/* Summary Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
                    <div>
                        <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Claim Amount</span>
                        <h2 className="text-2xl sm:text-3xl font-black mt-0.5">${parseFloat(claim.amount).toFixed(2)}</h2>
                        <span className="inline-block mt-1 text-xs bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                            {claim.type} Reimbursement
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                            {claim.type === 'Travel' ? <MapPin className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                        </div>
                        <div>
                            <span className="block text-xs text-blue-100">Requester</span>
                            <span className="block text-sm font-bold">{claim.User?.name || 'Employee'}</span>
                            <span className="block text-[10px] text-blue-200">{claim.department || 'General'} Dept</span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{claim.category || claim.type || 'General Expense'}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Submission Date</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{claim.date}</p>
                    </div>

                    {claim.destination && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Travel Destination</span>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{claim.destination}</p>
                        </div>
                    )}

                    {claim.startDate && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Trip Duration</span>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{claim.startDate} to {claim.endDate || claim.startDate}</p>
                        </div>
                    )}
                </div>

                {/* Description */}
                {claim.description && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Purpose / Business Notes</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-wrap">{claim.description}</p>
                    </div>
                )}

                {/* Approver Route Info */}
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <span className="block text-xs font-bold text-gray-900 dark:text-white">Assigned Approver</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {claim.Approver?.name || 'Department Manager'}
                            </span>
                        </div>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2.5 py-1 rounded-full">
                        Level {claim.currentLevel || 1}
                    </span>
                </div>
            </div>

            {/* Sticky Mobile Approver Action Bar */}
            {isApprover && claim.status === 'Pending' && (
                <div className="fixed md:static bottom-16 md:bottom-auto left-0 right-0 p-4 md:p-0 bg-white/95 dark:bg-gray-900/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-t-0 border-gray-200 dark:border-gray-800 z-30 flex items-center gap-3 justify-end shadow-lg md:shadow-none safe-bottom">
                    <button
                        onClick={() => handleStatusChange('Rejected')}
                        disabled={actionLoading}
                        className="flex-1 md:flex-initial px-5 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-600 dark:text-red-300 font-bold rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" /> Reject Claim
                    </button>
                    <button
                        onClick={() => handleStatusChange('Approved')}
                        disabled={actionLoading}
                        className="flex-1 md:flex-initial px-6 py-3 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold rounded-xl text-sm shadow-md shadow-green-600/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Approve Claim
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClaimDetails;
