import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import loginBg from '../../assets/images/login.jpeg';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, Phone } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const hash = window.location.hash || sessionStorage.getItem('supabase_recovery_hash');

        if (code) {
            navigate('/reset-password' + window.location.search, { replace: true });
            return;
        }

        if (hash && (hash.includes('type=recovery') || hash.includes('type=invite'))) {
            sessionStorage.removeItem('supabase_recovery_hash');
            navigate('/reset-password' + (hash.startsWith('#') ? hash : '#' + hash), { replace: true });
            return;
        }
    }, [navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null, general: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await api.post('/login', form);
            await refreshUser(); // Update global auth state
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                setErrors({ general: 'Incorrect email or password. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const errorMessage = errors.general || (errors.email && errors.email[0]) || (errors.password && errors.password[0]);

    return (
        <div className="flex min-h-screen bg-white font-sans">
            {/* Left Panel - Image with Gradient Overlay */}
            <div className="hidden lg:flex w-1/2 relative h-screen flex-col justify-end overflow-hidden p-12 pb-16">
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${loginBg})` }}
                />
                {/* Purple gradient overlay */}
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#6B66FF]/10 to-[#6B66FF]" />
                
                {/* Text Content */}
                <div className="z-10 text-white drop-shadow-md pl-4 flex flex-col gap-8">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
                            Cityscape Builders, Inc.
                        </h2>
                        <p className="text-xl font-medium leading-relaxed">
                            Committed to build with integrity
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Phone size={24} className="opacity-90" />
                            <span className="text-lg font-medium tracking-wide">286874815</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail size={24} className="opacity-90" />
                            <a href="mailto:sales@cityscapebuildersinc.com" className="text-lg font-medium hover:underline tracking-wide">
                                sales@cityscapebuildersinc.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 py-12">
                <div className="w-full max-w-md mx-auto">
                    
                    {/* Logo Header */}
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-10">
                        <img src={logo} alt="BuildSphere Logo" className="w-12 h-12 object-contain" />
                        <span className="text-3xl font-extrabold text-[#6B66FF] tracking-wide">Buildsphere</span>
                    </div>

                    <div className="mb-8 text-center lg:text-left">
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1e293b] mb-3 tracking-tight">
                            Welcome back!
                        </h1>
                        <p className="text-[#64748b] text-base">
                            Login to Buildsphere to start your project.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#334155]">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="e.g. name@company.com"
                                    className={`w-full rounded-xl border pl-12 pr-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 bg-white text-[#1e293b] ${
                                        errors.email || errors.general
                                            ? 'border-red-400 focus:ring-red-100 placeholder:text-red-300'
                                            : 'border-gray-200 focus:border-[#6B66FF] focus:ring-[#6B66FF]/20 placeholder:text-gray-400 hover:border-gray-300'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#334155]">Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`w-full rounded-xl border pl-12 pr-12 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 bg-white text-[#1e293b] ${
                                        errors.password || errors.general
                                            ? 'border-red-400 focus:ring-red-100 placeholder:text-red-300'
                                            : 'border-gray-200 focus:border-[#6B66FF] focus:ring-[#6B66FF]/20 placeholder:text-gray-400 hover:border-gray-300'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center">
                                <p className="text-sm font-medium text-red-600">
                                    {errorMessage}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-sm checked:bg-[#6B66FF] checked:border-[#6B66FF] transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#6B66FF]/20 focus:ring-offset-1"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="ml-2 text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Remember me</span>
                            </label>
                            
                            <Link to="/forgot-password" className="text-gray-500 hover:text-[#6B66FF] text-sm font-medium transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#6B66FF] hover:bg-[#5a55e0] disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow text-base"
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}