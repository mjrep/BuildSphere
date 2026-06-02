import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import login1 from '../../assets/images/login1.svg';
import login2 from '../../assets/images/login2.svg';
import login3 from '../../assets/images/login3.svg';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Carousel state
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            image: login1,
            title: "Manage Construction in One place",
            description: "Centralized project management for teams, tasks, schedules, and site operations."
        },
        {
            image: login2,
            title: "AI-Assisted Progress Tracking",
            description: "Turn site photos and project data into meaningful progress insights."
        },
        {
            image: login3,
            title: "Smarter Construction Decisions",
            description: "Monitor projects, reduce delays, and stay informed with real-time visibility."
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
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
                const message = err.response?.data?.message || 'Something went wrong. Please try again.';
                setErrors({ email: [message] });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#6B66FF] font-sans">
            {/* Left Panel - Carousel */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 text-white h-screen fixed left-0 top-0 overflow-hidden">
                <div className="flex items-center gap-3 z-10">
                    <img src={logo} alt="BuildSphere Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                    <span className="text-2xl font-bold tracking-wide">Buildsphere</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full z-10 text-center transition-opacity duration-500">
                    <img 
                        src={slides[currentSlide].image} 
                        alt={slides[currentSlide].title} 
                        className="w-full max-h-[350px] object-contain mb-10 transition-transform duration-500 ease-in-out hover:scale-105"
                    />
                    <h2 className="text-[28px] font-bold mb-4 leading-tight">
                        {slides[currentSlide].title}
                    </h2>
                    <p className="text-white/80 text-base leading-relaxed px-4">
                        {slides[currentSlide].description}
                    </p>
                </div>

                {/* Carousel Indicators */}
                <div className="flex justify-center gap-3 pb-8 z-10">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 min-h-screen bg-white lg:rounded-l-[3.5rem] lg:absolute lg:right-0 lg:top-0 z-20 flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12 overflow-y-auto shadow-2xl">
                <div className="max-w-md w-full mx-auto">
                    {/* Mobile Logo Header */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
                        <img src={logo} alt="BuildSphere Logo" className="w-10 h-10 object-contain" />
                        <span className="text-2xl font-bold text-[#6B66FF] tracking-wide">Buildsphere</span>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold text-[#1e293b] mb-2 tracking-tight">
                            Welcome back!
                        </h1>
                        <p className="text-[#64748b] text-base">
                            Login to Buildsphere to start your project.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[#1e293b]">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className={`w-full rounded-2xl border px-5 py-4 text-sm transition-all focus:outline-none focus:ring-4 bg-white text-[#1e293b] ${
                                    errors.email
                                        ? 'border-red-400 focus:ring-red-100 placeholder:text-red-300'
                                        : 'border-gray-200 focus:border-[#6B66FF] focus:ring-[#6B66FF]/10 placeholder:text-gray-400 hover:border-gray-300'
                                }`}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[#1e293b]">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`w-full rounded-2xl border px-5 py-4 pr-12 text-sm transition-all focus:outline-none focus:ring-4 bg-white text-[#1e293b] ${
                                        errors.password
                                            ? 'border-red-400 focus:ring-red-100 placeholder:text-red-300'
                                            : 'border-gray-200 focus:border-[#6B66FF] focus:ring-[#6B66FF]/10 placeholder:text-gray-400 hover:border-gray-300'
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
                            {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password[0]}</p>}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#6B66FF] hover:bg-[#5a55f0] disabled:opacity-70 text-white font-semibold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md hover:shadow-lg text-lg"
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-[#6B66FF] checked:border-[#6B66FF] transition-all cursor-pointer group-hover:border-[#6B66FF]/50 outline-none focus:ring-2 focus:ring-[#6B66FF]/20 focus:ring-offset-1"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="ml-3 text-sm text-gray-400 font-medium group-hover:text-gray-600 transition-colors">Remember me</span>
                            </label>
                            
                            <Link to="/forgot-password" className="text-gray-400 hover:text-[#6B66FF] text-sm font-medium transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}