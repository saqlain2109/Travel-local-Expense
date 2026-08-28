import React, { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const containerRef = useRef(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(containerRef.current, { opacity: 0, duration: 1, ease: "power3.out" });
            gsap.from(".anim-item", {
                y: 20,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "back.out(1.7)"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const user = await login(username, password);
            if (user.role === 'admin') {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Login failed. Please check console.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse delay-1000"></div>

            <div ref={containerRef} className="glass-panel p-8 md:p-12 w-full max-w-md z-10 mx-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 anim-item">Welcome Back</h2>
                    <p className="text-slate-400 anim-item">Enter your credentials to access your dashboard.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center anim-item">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="anim-item">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="username"
                                required
                                className="input-field pl-10"
                                placeholder="Enter your username"
                                defaultValue="admin"
                            />
                        </div>
                    </div>

                    <div className="anim-item">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                name="password"
                                required
                                className="input-field pl-10"
                                placeholder="••••••••"
                                defaultValue="password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm anim-item">
                        <label className="flex items-center text-slate-400">
                            <input type="checkbox" className="mr-2 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
                            Remember me
                        </label>
                        <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300">Forgot Password?</Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Sign In
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400 anim-item">
                    Don't have an account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
