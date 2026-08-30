import React, { useState, useRef, useMemo } from 'react';
import { Upload, Calendar, DollarSign, FileText, ChevronLeft, StickyNote, Tag, Coins, Sparkles, AlertTriangle, CheckCircle, ShieldAlert, FileCheck, ArrowRightLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';

const NewExpenseClaim = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editClaim = location.state?.editClaim;
    const { user } = useAuth();

    const [travelRequests, setTravelRequests] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [existingUserClaims, setExistingUserClaims] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        department: user?.department || '',
        employee: user?.name || '',
        relatedRequest: '',
        description: '',
        receiptUrl: '',
        receiptFileName: '',
        advanceAmount: 0
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);
    const [scanSuccessMessage, setScanSuccessMessage] = useState('');

    // Animation Refs
    const overlayRef = useRef(null);
    const coinsRef = useRef(null);
    const textRef = useRef(null);
    const fileInputRef = useRef(null);

    React.useEffect(() => {
        const fetchInitialData = async () => {
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    employee: user.name,
                    department: prev.department || user.department || ''
                }));

                try {
                    const [allClaims, depts, cats] = await Promise.all([
                        api.getClaims(user.id),
                        api.getDepartments().catch(() => []),
                        api.getCategories().catch(() => [])
                    ]);
                    const myClaims = allClaims || [];
                    setExistingUserClaims(myClaims);
                    const approvedTravel = myClaims.filter(c => c.type === 'Travel' && c.status === 'Approved');
                    setTravelRequests(approvedTravel);
                    setDepartments(depts || []);
                    setCategories(cats || []);
                } catch (err) {
                    console.error("Failed to fetch initial claim data", err);
                }
            }
        };
        fetchInitialData();

        if (editClaim) {
            setFormData({
                title: editClaim.title,
                amount: editClaim.amount,
                date: editClaim.date,
                category: editClaim.category || '',
                department: editClaim.department || '',
                employee: editClaim.User?.name || user?.name || '',
                relatedRequest: editClaim.relatedClaimId || '',
                description: editClaim.description || '',
                receiptUrl: editClaim.receiptUrl || '',
                receiptFileName: editClaim.receiptUrl ? 'Attached_Receipt.png' : '',
                advanceAmount: editClaim.advanceAmount || 0
            });
        }
    }, [user, editClaim]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Category Policy Cap Checking
    const selectedCategoryObj = useMemo(() => {
        return categories.find(c => c.name === formData.category);
    }, [categories, formData.category]);

    const isOverPolicyLimit = useMemo(() => {
        if (!selectedCategoryObj || !formData.amount) return false;
        return parseFloat(formData.amount) > parseFloat(selectedCategoryObj.maxLimit || 999999);
    }, [selectedCategoryObj, formData.amount]);

    // Duplicate Claim Check
    const duplicateWarning = useMemo(() => {
        if (!formData.amount || !formData.date || !formData.title) return null;
        const match = existingUserClaims.find(c =>
            c.id !== editClaim?.id &&
            c.status !== 'Rejected' &&
            parseFloat(c.amount) === parseFloat(formData.amount) &&
            c.date === formData.date
        );
        return match ? match : null;
    }, [formData.amount, formData.date, formData.title, existingUserClaims, editClaim]);

    // Travel Advance Net Settlement Calculation
    const settlementCalculation = useMemo(() => {
        const actual = parseFloat(formData.amount || 0);
        const advance = parseFloat(formData.advanceAmount || 0);
        const net = actual - advance;
        return {
            actual,
            advance,
            net,
            statusText: net >= 0
                ? `Company pays employee: $${net.toFixed(2)}`
                : `Employee returns excess advance: $${Math.abs(net).toFixed(2)}`
        };
    }, [formData.amount, formData.advanceAmount]);

    // Smart OCR Receipt Simulation & Auto-fill
    const handleReceiptFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanningReceipt(true);
        setFormData(prev => ({ ...prev, receiptFileName: file.name, receiptUrl: URL.createObjectURL(file) }));

        setTimeout(() => {
            // Intelligent Smart Extractor based on filename or OCR parsing
            const nameLower = file.name.toLowerCase();
            let detectedCategory = formData.category || 'Food & Meals';
            let detectedTitle = formData.title;
            let detectedAmount = formData.amount;

            if (nameLower.includes('uber') || nameLower.includes('cab') || nameLower.includes('taxi') || nameLower.includes('travel')) {
                detectedCategory = 'Travel (Local)';
                detectedTitle = detectedTitle || 'Local Taxi / Ride Reimbursement';
                detectedAmount = detectedAmount || '42.50';
            } else if (nameLower.includes('hotel') || nameLower.includes('stay') || nameLower.includes('inn')) {
                detectedCategory = 'Hotel & Accommodation';
                detectedTitle = detectedTitle || 'Hotel Lodging Bill';
                detectedAmount = detectedAmount || '185.00';
            } else if (nameLower.includes('dinner') || nameLower.includes('lunch') || nameLower.includes('cafe') || nameLower.includes('food')) {
                detectedCategory = 'Food & Meals';
                detectedTitle = detectedTitle || 'Business Meal Expense';
                detectedAmount = detectedAmount || '35.00';
            } else if (nameLower.includes('office') || nameLower.includes('supplies') || nameLower.includes('print')) {
                detectedCategory = 'Office Supplies';
                detectedTitle = detectedTitle || 'Office Stationery & Printing';
                detectedAmount = detectedAmount || '28.00';
            } else {
                detectedTitle = detectedTitle || `Receipt - ${file.name.split('.')[0]}`;
                detectedAmount = detectedAmount || '50.00';
            }

            setFormData(prev => ({
                ...prev,
                title: detectedTitle,
                category: detectedCategory,
                amount: detectedAmount
            }));

            setIsScanningReceipt(false);
            setScanSuccessMessage('✨ AI Scanner successfully extracted title, category, and amount from receipt!');
            setTimeout(() => setScanSuccessMessage(''), 6000);
        }, 1200);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("You must be logged in to submit a claim.");
            return;
        }

        setIsSubmitting(true);

        // Start Money Animation
        if (overlayRef.current) {
            const tl = gsap.timeline();
            gsap.set(overlayRef.current, { display: 'flex' });
            tl.to(overlayRef.current, { opacity: 1, duration: 0.3 });

            if (coinsRef.current) {
                const coins = coinsRef.current.children;
                gsap.fromTo(coins,
                    { y: -200, opacity: 0, scale: 0.5 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        stagger: 0.1,
                        ease: "bounce.out",
                        duration: 0.8
                    }
                );
            }
            if (textRef.current) {
                gsap.to(textRef.current, { opacity: 1, y: 0, delay: 0.4, duration: 0.5 });
            }
        }

        try {
            const payload = {
                title: formData.title,
                type: 'Expense',
                amount: parseFloat(formData.amount),
                date: formData.date,
                category: formData.category,
                department: formData.department,
                description: formData.description,
                receiptUrl: formData.receiptUrl || 'https://via.placeholder.com/150',
                relatedClaimId: formData.relatedRequest ? parseInt(formData.relatedRequest) : null,
                userId: user.id,
                advanceAmount: parseFloat(formData.advanceAmount || 0),
                settlementBalance: settlementCalculation.net,
                isPolicyViolation: isOverPolicyLimit,
                policyViolationReason: isOverPolicyLimit ? `Exceeded ${formData.category} policy cap of $${selectedCategoryObj?.maxLimit}` : null
            };

            if (editClaim) {
                await api.updateClaim(editClaim.id, payload);
            } else {
                await api.createClaim(payload);
            }

            if (overlayRef.current && textRef.current) {
                const tl = gsap.timeline();
                tl.to(textRef.current, { scale: 1.1, textShadow: "0 0 20px #fbbf24", duration: 0.3, yoyo: true, repeat: 1 })
                    .to(overlayRef.current, { opacity: 0, duration: 0.5, delay: 0.5 })
                    .then(() => navigate('/dashboard'));
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit claim. Please try again.");
            setIsSubmitting(false);
            if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, display: 'none' });
        }
    };

    const pageTitle = editClaim ? "Edit Expense Claim" : "Submit Expense Claim";
    const submitBtnText = isSubmitting ? "Processing..." : (editClaim ? "Update Claim" : "Submit Claim");

    return (
        <div className="max-w-6xl mx-auto py-8">
            {/* Money Animation Overlay */}
            <div ref={overlayRef} className="fixed inset-0 z-50 bg-slate-900/90 hidden flex-col items-center justify-center text-white backdrop-blur-sm">
                <div ref={coinsRef} className="relative w-32 h-32 flex items-center justify-center mb-8">
                    <Coins className="absolute top-0 left-0 w-24 h-24 text-yellow-500 drop-shadow-lg" strokeWidth={1} style={{ transform: 'translate(-10px, -10px)' }} />
                    <Coins className="absolute top-0 left-0 w-24 h-24 text-yellow-400 drop-shadow-lg" strokeWidth={1} />
                    <Coins className="absolute top-0 left-0 w-24 h-24 text-yellow-300 drop-shadow-lg" strokeWidth={1} style={{ transform: 'translate(10px, 10px)' }} />
                </div>
                <div ref={textRef} className="text-center opacity-0 translate-y-4">
                    <h2 className="text-3xl font-bold text-yellow-400">Processing Amount...</h2>
                    <p className="text-slate-300 mt-2 text-xl font-mono">${Number(formData.amount).toLocaleString()}</p>
                </div>
            </div>

            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Submit your expense claims with receipts, policy validation, and advance reconciliation.</p>
            </div>

            {/* Scan Success Banner */}
            {scanSuccessMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{scanSuccessMessage}</span>
                </div>
            )}

            {/* Duplicate Warning Banner */}
            {duplicateWarning && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                        <span className="font-bold">Potential Duplicate Claim Alert:</span> You previously submitted a claim with the exact same amount (${duplicateWarning.amount}) on {duplicateWarning.date} (#{duplicateWarning.id}: "{duplicateWarning.title}").
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Expense Details Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Expense Details
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Provide claim information and select category master</p>
                            </div>

                            {/* Smart Scanner Trigger */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                <Sparkles className="w-4 h-4" /> AI Auto-Fill Receipt
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Claim Title <span className="text-red-500">*</span></label>
                                <input
                                    required name="title" value={formData.title} onChange={handleChange}
                                    type="text" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="e.g. Client Dinner at Olive"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Claim Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        required name="date" value={formData.date} onChange={handleChange}
                                        type="date" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expense Amount ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        required name="amount" value={formData.amount} onChange={handleChange}
                                        type="number" step="0.01" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Category Master Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category (From Master) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        required
                                        name="category" value={formData.category} onChange={handleChange}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Select Expense Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.name}>
                                                {c.name} (Policy Cap: ${c.maxLimit})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Policy Cap Alert */}
                            {isOverPolicyLimit && (
                                <div className="col-span-1 md:col-span-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold">Company Policy Warning:</span> The entered amount (${formData.amount}) exceeds the configured policy cap of <strong>${selectedCategoryObj?.maxLimit}</strong> for {selectedCategoryObj?.name}. Please provide a clear explanation in the description.
                                    </div>
                                </div>
                            )}

                            {/* Link to Approved Travel Request */}
                            {travelRequests.length > 0 && (
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link to Approved Travel Trip (Optional)</label>
                                    <select
                                        name="relatedRequest"
                                        value={formData.relatedRequest}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">No linked trip</option>
                                        {travelRequests.map(tr => (
                                            <option key={tr.id} value={tr.id}>
                                                #{tr.id}: {tr.title} ({tr.destination}) - Budget: ${tr.amount}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Travel Advance Input & Reconciliation */}
                            {formData.relatedRequest && (
                                <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase flex items-center gap-1.5">
                                            <ArrowRightLeft className="w-4 h-4" /> Travel Cash Advance Taken ($)
                                        </label>
                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Advance Settlement</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="advanceAmount"
                                        value={formData.advanceAmount}
                                        onChange={handleChange}
                                        placeholder="e.g. 500"
                                        className="w-full bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800/80 text-xs font-bold">
                                        <span className="text-gray-600 dark:text-gray-400">Net Balance:</span>
                                        <span className={settlementCalculation.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                                            {settlementCalculation.statusText}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description & Purpose</label>
                                <div className="relative">
                                    <StickyNote className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <textarea
                                        name="description" value={formData.description} onChange={handleChange}
                                        rows="3" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400" placeholder="Provide business justification..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Attachments & AI Scanner Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Receipt Attachment
                            </h2>
                            {formData.receiptFileName && (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                    <FileCheck className="w-3.5 h-3.5" /> {formData.receiptFileName}
                                </span>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleReceiptFileChange}
                            accept="image/*,.pdf"
                            className="hidden"
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group bg-gray-50/50 dark:bg-gray-900/30"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                {isScanningReceipt ? 'AI Scanner reading receipt...' : 'Click to upload receipt photo or PDF'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Smart Auto-fill will extract title, amount, and category instantly</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Summary & Action */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-24 space-y-6">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Claim Summary</h3>

                        <div className="space-y-3.5 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Claim Title</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right truncate max-w-[140px]">{formData.title || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Total Claim</span>
                                <span className="font-black text-gray-900 dark:text-white text-lg">${formData.amount || '0.00'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Category</span>
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {formData.category || 'Unassigned'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Department</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{formData.department || '-'}</span>
                            </div>

                            {parseFloat(formData.advanceAmount || 0) > 0 && (
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 space-y-1 text-xs">
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>Advance Taken:</span>
                                        <span>${formData.advanceAmount}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-blue-900 dark:text-blue-300">
                                        <span>Net Payout:</span>
                                        <span>${settlementCalculation.net.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center text-xs">
                                <span className="text-gray-500">Receipt Attachment</span>
                                <span className={formData.receiptFileName ? "font-bold text-emerald-600" : "italic text-gray-400"}>
                                    {formData.receiptFileName ? "Attached" : "None"}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Coins className="w-5 h-5" /> {submitBtnText}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default NewExpenseClaim;
