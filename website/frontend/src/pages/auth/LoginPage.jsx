import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12 transition-colors duration-200">
            <div className="fixed top-6 right-6">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl bg-card border border-border-primary shadow-lg text-text-secondary hover:bg-bg-secondary transition-all"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </button>
            </div>
            <div className="w-full max-w-[480px] bg-card rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 md:p-14 border border-border-primary relative">
                <div className="flex flex-col items-center mb-10">
                    <img src={logo} alt="BuildSphere Logo" className="w-16 h-16 mb-6 object-contain" />
                    <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">
                        Log in to BuildSphere
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-text-primary ml-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className={`w-full rounded-2xl border px-6 py-4 text-base transition-all focus:outline-none focus:ring-2 placeholder:text-text-muted bg-bg-secondary text-text-primary ${
                                errors.email
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-border-primary focus:ring-accent/20 focus:border-accent'
                            }`}
                        />
                        {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email[0]}</p>}
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-text-primary ml-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className={`w-full rounded-2xl border px-6 py-4 text-base transition-all focus:outline-none focus:ring-2 placeholder:text-text-muted bg-bg-secondary text-text-primary ${
                                errors.password
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-border-primary focus:ring-accent/20 focus:border-accent'
                            }`}
                        />
                        {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password[0]}</p>}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:opacity-90 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                        >
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        <Link to="/forgot-password" className="text-text-muted text-sm hover:text-accent transition-colors">
                            Forgot Password?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}