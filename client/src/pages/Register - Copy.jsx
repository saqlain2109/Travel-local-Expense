import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Mail, User, Briefcase, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { gsap } from 'gsap';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    // Animation Refs
    const overlayRef = useRef(null);
    const iconRef = useRef(null);
    const textRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        // Start Animation
        if (overlayRef.current) {
            const tl = gsap.timeline();
            tl.to(overlayRef.current, { opacity: 1, duration: 0.3, display: 'flex' })
                .to(iconRef.current, { scale: 1.2, duration: 0.5, yoyo: true, repeat: -1, ease: "power1.inOut" })
                .to(textRef.current, { opacity: 0.5, duration: 0.8, yoyo: true, repeat: -1 }, "<");
        }

        try {
            await api.register(formData);

            // Success Animation
            if (iconRef.current) {
                gsap.killTweensOf(iconRef.current);
                gsap.to(iconRef.current, {
                    scale: 0, duration: 0.3, onComplete: () => {
                        // Need to render success state in overlay or just close it?
                        // User wants to stay on page.
                        setIsLoading(false);
                        setSuccessMessage("Registration successful! Please check your email for your login credentials.");
                        setFormData({ name: '', email: '', department: '' });
                    }
                });
                gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, display: 'none', delay: 0.3 });
            } else {
                setIsLoading(false);
                setSuccessMessage("Registration successful! Please check your email for your login credentials.");
                setFormData({ name: '', email: '', department: '' });
            }

        } catch (err) {
            console.error("Registration Failed", err);
            setError(err.message || "Registration failed. Please try again.");
            setIsLoading(false);
            if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, display: 'none' });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4 relative">

            {/* Loading Overlay */}
            <div
                ref={overlayRef}
                className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm hidden flex-col items-center justify-center text-white"
            >
                <div ref={iconRef} className="bg-blue-600 p-6 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)] mb-6">
                    <UserPlus className="w-12 h-12 text-white" />
                </div>
                <h3 ref={textRef} className="text-2xl font-bold tracking-wider">Creating Your Account...</h3>
                <p className="text-slate-400 mt-2">Please wait while we set things up.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                        <p className="text-gray-500 text-sm mt-2">Register as a new employee</p>
                    </div>

                    {successMessage ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-8 rounded-xl text-center mb-6 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                            <div className="bg-green-100 p-3 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-green-900 mb-2">Welcome Aboard!</h3>
                            <p className="text-sm font-medium mb-6">{successMessage}</p>
                            <Link to="/" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="john@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        name="department"
                                        type="text"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="e.g. Sales"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                Register Account
                            </button>

                            <div className="text-center mt-6">
                                <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1 transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
