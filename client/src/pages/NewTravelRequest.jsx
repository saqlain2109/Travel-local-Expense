import React, { useState, useRef } from 'react';
import { Calendar, MapPin, Briefcase, User, ChevronLeft, Plane, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';

const NewTravelRequest = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        cost: '',
        purpose: '',
        department: user?.department || ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation Refs
    const overlayRef = useRef(null);
    const planeRef = useRef(null);
    const textRef = useRef(null);

    React.useEffect(() => {
        if (user && !formData.department && user.department) {
            setFormData(prev => ({ ...prev, department: user.department }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("You must be logged in to submit a request.");
            return;
        }

        setIsSubmitting(true);

        // Start Takeoff Animation
        if (overlayRef.current && planeRef.current) {
            const tl = gsap.timeline();

            // Initial State
            gsap.set(planeRef.current, { x: -100, y: 100, rotation: -15, scale: 0.8, opacity: 0 });

            tl.to(overlayRef.current, { display: 'flex', opacity: 1, duration: 0.3 })
                .to(planeRef.current, {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out"
                })
                .to(textRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.5")
                // Takeoff Loop while waiting
                .to(planeRef.current, {
                    y: -20,
                    rotation: 0,
                    duration: 2,
                    yoyo: true,
                    repeat: -1,
                    ease: "sine.inOut"
                });
        }

        try {
            const payload = {
                title: formData.title,
                type: 'Travel',
                destination: formData.destination,
                startDate: formData.startDate,
                endDate: formData.endDate,
                date: new Date().toISOString().split('T')[0], // Required by DB
                amount: parseFloat(formData.cost) || 0, // Mapping 'cost' to 'amount' in DB
                description: formData.purpose, // Mapping 'purpose' to 'description'
                department: formData.department,
                status: 'Pending'
            };

            await api.createClaim(payload, user.id);

            // Success Takeoff
            if (planeRef.current) {
                gsap.killTweensOf(planeRef.current);
                const tl = gsap.timeline();

                tl.to(textRef.current, { opacity: 0, duration: 0.3 })
                    .to(planeRef.current, {
                        x: window.innerWidth, // Fly off screen
                        y: -window.innerHeight,
                        rotation: 45,
                        scale: 1.5,
                        duration: 1.5,
                        ease: "power2.in"
                    })
                    .to(overlayRef.current, { opacity: 0, duration: 0.5 }, "-=0.5")
                    .then(() => {
                        navigate('/dashboard');
                    });
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit travel request.");
            setIsSubmitting(false);
            if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, display: 'none' });
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8">
            {/* Animation Overlay */}
            <div ref={overlayRef} className="fixed inset-0 z-50 bg-slate-900/90 hidden flex-col items-center justify-center text-white backdrop-blur-sm">
                <div className="relative w-full max-w-lg h-64 flex items-center justify-center overflow-hidden">
                    {/* Runway/Clouds effect could be added here */}
                    <div ref={planeRef} className="text-blue-400 drop-shadow-[0_0_30px_rgba(96,165,250,0.6)]">
                        <Plane className="w-32 h-32" strokeWidth={1.5} />
                    </div>
                </div>
                <div ref={textRef} className="text-center opacity-0 translate-y-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">Preparing for Takeoff...</h2>
                    <p className="text-blue-300 mt-2">Submitting your travel request</p>
                </div>
            </div>

            <div className="mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Plane className="w-6 h-6" />
                    </div>
                    New Travel Request
                </h1>
                <p className="text-gray-500 mt-2 ml-14">Submit your travel request for approval. Provide all required details about your trip.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Trip Details */}
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" /> Trip Details
                    </h2>
                    <p className="text-sm text-gray-500 mb-8">Basic information about your travel</p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Trip Title <span className="text-red-500">*</span></label>
                            <input
                                required name="title" onChange={handleChange}
                                type="text" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="e.g., Annual Conference 2024"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Employee <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input disabled value={user?.name || 'Current User'} className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-500 outline-none cursor-not-allowed" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Sales"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Destination</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    name="destination" onChange={handleChange}
                                    type="text" className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g., New York, NY"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Purpose of Travel</label>
                            <textarea
                                name="purpose" onChange={handleChange}
                                rows="4" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none" placeholder="Describe the purpose and objectives of your trip..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Right Column - Dates & Budget */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" /> Dates & Budget
                        </h2>
                        <p className="text-sm text-gray-500 mb-8">Schedule and cost estimates</p>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                                <input
                                    required name="startDate" onChange={handleChange}
                                    type="date" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                                <input
                                    required name="endDate" onChange={handleChange}
                                    type="date" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Total Estimated Cost</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">$</span>
                                <input
                                    name="cost" type="number" onChange={handleChange}
                                    className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Include estimated costs for transportation, accommodation, meals, and other expenses.</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3">What happens next?</h3>
                        <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                            <li>Your request will be submitted for manager approval</li>
                            <li>You will receive notification once reviewed</li>
                            <li>Track status in your request history</li>
                        </ul>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => navigate(-1)} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-3 rounded-lg transition-all">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Plane className="w-4 h-4" />
                            )}
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default NewTravelRequest;
