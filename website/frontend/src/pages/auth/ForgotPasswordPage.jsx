import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import api from '../../services/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    const inputClass = (field) =>
        `w-full rounded-2xl border px-6 py-4 text-base transition-all focus:outline-none focus:ring-2 placeholder:text-text-muted bg-bg-secondary text-text-primary ${
            errors[field]
                ? 'border-red-400 focus:ring-red-200'
                : 'border-border-primary focus:ring-accent/20 focus:border-accent'
        }`;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setSuccess('');

        try {
            const res = await api.post('/forgot-password', { email });
            setSuccess(res.data.message || 'If the email exists in our system, a password reset link has been sent.');
            setEmail('');
        } catch (error) {
            console.error('Password reset request failed:', error);
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || { email: [error.response.data.message] });
            } else {
                const message = error.response?.data?.message || 'Unable to request password reset. Please try again.';
                setErrors({ form: [message] });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12 transition-colors duration-200">
            <div className="w-full max-w-[520px] bg-card rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-12 border border-border-primary relative overflow-hidden">

                <div className="flex flex-col items-center mb-8 text-center">
                    <img src={logo} alt="BuildSphere Logo" className="w-16 h-16 mb-5 object-contain" />
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-[0.25em] mb-4">
                        <KeyRound size={14} />
                        Forgot Password
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                        Reset your password
                    </h1>
                    <p className="text-text-muted text-sm md:text-base max-w-md">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {errors.form && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-3">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span>{errors.form[0]}</span>
                    </div>
                )}

                {success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-center">
                        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm text-emerald-700 leading-6 font-medium">{success}</p>
                        <p className="text-xs text-emerald-600 mt-2 opacity-80">
                            Check your inbox and click the link to set your new password.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-text-primary ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    id="forgot-email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrors({});
                                    }}
                                    placeholder="Enter your email address"
                                    className={`${inputClass('email')} pl-12`}
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email[0]}</p>}
                        </div>

                        <button
                            id="send-reset-link-btn"
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-accent hover:opacity-90 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Sending link...
                                </span>
                            ) : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="text-center mt-6">
                    <Link to="/login" className="text-text-muted text-sm hover:text-accent transition-colors">
                        ← Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
