import React, { useState, useRef } from 'react';
import { Upload, Calendar, DollarSign, FileText, ChevronLeft, StickyNote, Tag, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';

const NewExpenseClaim = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [travelRequests, setTravelRequests] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        department: user?.department || '',
        employee: user?.name || '',
        relatedRequest: '',
        description: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation Refs
    const overlayRef = useRef(null);
    const coinsRef = useRef(null);
    const textRef = useRef(null);

    React.useEffect(() => {
        const fetchTravelRequests = async () => {
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    employee: user.name,
                    department: prev.department || user.department || ''
                }));

                try {
                    const allClaims = await api.getClaims(user.id);
                    const approvedTravel = allClaims.filter(c => c.type === 'Travel' && c.status === 'Approved');
                    setTravelRequests(approvedTravel);
                } catch (err) {
                    console.error("Failed to fetch travel requests", err);
                }
            }
        };
        fetchTravelRequests();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

            // Show Overlay
            gsap.set(overlayRef.current, { display: 'flex' });
            tl.to(overlayRef.current, { opacity: 1, duration: 0.3 });

            // Animate Coins (falling stack effect)
            if (coinsRef.current) {
                const coins = coinsRef.current.children;
                gsap.fromTo(coins,
                    { y: -200, opacity: 0, scale: 0.5 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: "bounce.out"
                    }
                );
            }

            tl.to(textRef.current, { opacity: 1, y: 0, duration: 0.5 });
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
                relatedClaimId: formData.relatedRequest || null,
                receiptUrl: ''
            };
            await api.createClaim(payload, user.id);

            // Success Animation (Coins turn gold or fade out)
            if (overlayRef.current) {
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

    return (
        <div className="max-w-6xl mx-auto py-8">

            {/* Money Animation Overlay */}
            <div ref={overlayRef} className="fixed inset-0 z-50 bg-slate-900/90 hidden flex-col items-center justify-center text-white backdrop-blur-sm">
                <div ref={coinsRef} className="relative w-32 h-32 flex items-center justify-center mb-8">
                    {/* Generative stack of coins */}
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
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Submit Expense Claim</h1>
                <p className="text-gray-500 mt-2">Submit your expense claims with receipts for reimbursement approval.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Expense Details Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" /> Expense Details
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Provide information about your expense claim</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Claim Title <span className="text-red-500">*</span></label>
                                <input
                                    required name="title" value={formData.title} onChange={handleChange}
                                    type="text" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="Enter claim title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Claim Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        required name="date" value={formData.date} onChange={handleChange}
                                        type="date" className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        required name="amount" value={formData.amount} onChange={handleChange}
                                        type="number" className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expense Category</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        name="category" value={formData.category} onChange={handleChange}
                                        className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Select category</option>
                                        <option value="Food">Food</option>
                                        <option value="Travel">Travel (Local)</option>
                                        <option value="Accommodation">Accommodation</option>
                                        <option value="Office Supplies">Office Supplies</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Employee <span className="text-red-500">*</span></label>
                                <input disabled value={user?.name || 'Current User'} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-500 outline-none cursor-not-allowed" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                <input
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g. Sales"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <div className="relative">
                                    <StickyNote className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <textarea
                                        name="description" value={formData.description} onChange={handleChange}
                                        rows="3" className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none" placeholder="Additional details..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Attachments Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" /> Receipt Attachments
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Attach receipts to provide proof for your expense claim</p>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group bg-gray-50/50">
                            <div className="w-14 h-14 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-7 h-7" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Click to upload receipts</h3>
                            <p className="text-sm text-gray-500 mt-1">Supported formats: Images (JPG, PNG) and PDF files</p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <input type="checkbox" id="receipt-confirm" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="receipt-confirm" className="text-sm font-medium text-gray-700">I confirm that receipts are attached to this claim</label>
                        </div>
                    </div>
                </div>

                {/* Right Column - Summary & Action */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                        <h3 className="font-semibold text-gray-900 mb-6 text-lg">Claim Summary</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500">Title</span>
                                <span className="font-medium text-gray-900 text-right truncate w-32">{formData.title || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-bold text-gray-900 text-lg">${formData.amount || '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500">Date</span>
                                <span className="font-medium text-gray-900">{formData.date}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500">Category</span>
                                <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs font-semibold text-gray-600">{formData.category || '-'}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-4 flex justify-between text-sm items-center">
                                <span className="text-gray-500">Receipts</span>
                                <span className="font-medium text-gray-400 italic">None attached</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Claim'
                                )}
                            </button>
                            <button type="button" onClick={() => navigate(-1)} className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium py-3 rounded-lg transition-all">
                                Cancel
                            </button>
                        </div>

                        <div className="mt-6 bg-blue-50 rounded-lg p-4 text-xs text-blue-700 border border-blue-100 flex gap-2">
                            <div className="w-1 bg-blue-400 rounded-full flex-shrink-0"></div>
                            <p>Attaching receipts increases the chance of claim approval and speeds up processing time.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default NewExpenseClaim;
