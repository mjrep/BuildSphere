import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { supabase } from '../../utils/supabase';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const initializeRecoverySession = async () => {
            try {
                const currentUrl = new URL(window.location.href);
                const code = currentUrl.searchParams.get('code');

                // Flow 1: PKCE code exchange (query param ?code=...)
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;

                    const { data } = await supabase.auth.getSession();
                    if (!isMounted) return;

                    if (!data.session) {
                        setErrors({ form: ['This reset link is invalid or expired. Please request a new one.'] });
                        setSessionReady(false);
                    } else {
                        setSessionReady(true);
                    }
                    setLoading(false);
                    return;
                }

                // Flow 2: Hash fragment tokens (#access_token=...&type=recovery)
                // Supabase may redirect with tokens in the hash fragment.
                // The Supabase client auto-detects these and fires onAuthStateChange
                // with PASSWORD_RECOVERY event. We listen for that below.
                // Also check if hash contains recovery-related tokens.
                const hash = window.location.hash;
                if (hash && (hash.includes('type=recovery') || hash.includes('type=invite'))) {
                    // Supabase JS client will automatically pick up the hash tokens
                    // and trigger onAuthStateChange. We wait for that event.
                    return;
                }

                // Flow 3: Check if there's already an active session (e.g., page refresh)
                const { data } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (data.session) {
                    setSessionReady(true);
                    setLoading(false);
                    return;
                }

                // No recovery code, no hash tokens, no existing session
                // Redirect to forgot password page
                navigate('/forgot-password', { replace: true });
            } catch (error) {
                if (!isMounted) return;
                setErrors({ form: [error.message || 'Unable to start the password reset session.'] });
                setSessionReady(false);
                setLoading(false);
            }
        };

        // Listen for Supabase auth state changes (PASSWORD_RECOVERY event)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return;

            if (event === 'PASSWORD_RECOVERY' && session) {
                setSessionReady(true);
                setLoading(false);
            } else if (event === 'SIGNED_IN' && session) {
                // Some Supabase versions fire SIGNED_IN instead of PASSWORD_RECOVERY
                // when processing recovery tokens from hash fragments
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                if (hashParams.get('type') === 'recovery') {
                    setSessionReady(true);
                    setLoading(false);
                }
            }
        });

        initializeRecoverySession();

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [navigate]);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
        setErrors({ ...errors, [event.target.name]: null, form: null });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setSuccess('');

        if (form.password !== form.password_confirmation) {
            setErrors({ password_confirmation: ['Passwords do not match.'] });
            setSubmitting(false);
            return;
        }

        try {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                throw new Error('Your reset session has expired. Please request a new password reset email.');
            }

            const { error } = await supabase.auth.updateUser({ password: form.password });
            if (error) throw error;

            setSuccess('Your password has been updated successfully. Redirecting to login...');
            setForm({ password: '', password_confirmation: '' });

            window.setTimeout(() => {
                navigate('/login', { replace: true });
            }, 1800);
        } catch (error) {
            setErrors({ form: [error.message || 'Unable to update your password. Please try again.'] });
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = (field) =>
        `w-full rounded-2xl border px-6 py-4 text-base transition-all focus:outline-none focus:ring-2 placeholder:text-text-muted bg-bg-secondary text-text-primary ${
            errors[field]
                ? 'border-red-400 focus:ring-red-200'
                : 'border-border-primary focus:ring-accent/20 focus:border-accent'
        }`;

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12 transition-colors duration-200">
            <div className="w-full max-w-[520px] bg-card rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-12 border border-border-primary relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-accent via-[#8F89FF] to-[#67D4FF]" />

                <div className="flex flex-col items-center mb-8 text-center">
                    <img src={logo} alt="BuildSphere Logo" className="w-16 h-16 mb-5 object-contain" />
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-[0.25em] mb-4">
                        <KeyRound size={14} />
                        Password Reset
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                        Set your new password
                    </h1>
                    <p className="text-text-muted text-sm md:text-base max-w-md">
                        Choose a strong, secure new password for your BuildSphere account.
                    </p>
                </div>

                {loading ? (
                    <div className="py-14 flex flex-col items-center justify-center gap-3">
                        <div className="h-10 w-10 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                        <p className="text-text-muted text-sm">Verifying your recovery link...</p>
                    </div>
                ) : !sessionReady ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
                        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                            <AlertCircle size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary mb-2">Reset link unavailable</h2>
                        <p className="text-sm text-text-muted leading-6">
                            {errors.form?.[0] || 'This recovery link is invalid or has expired.'}
                        </p>
                        <div className="mt-6 flex flex-col gap-3">
                            <Link
                                to="/forgot-password"
                                className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-all"
                            >
                                Request a new link
                            </Link>
                            <Link to="/login" className="text-text-muted text-sm hover:text-accent transition-colors">
                                Back to login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.form && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-3">
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                <span>{errors.form[0]}</span>
                            </div>
                        )}

                        {success && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-3">
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-text-primary ml-1">New password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter a new password"
                                    className={`${inputClass('password')} pl-12 pr-14`}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password[0]}</p>}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-text-primary ml-1">Confirm new password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="password_confirmation"
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="Re-enter your new password"
                                    className={`${inputClass('password_confirmation')} pl-12 pr-14`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-red-500 text-xs ml-1">{errors.password_confirmation[0]}</p>
                            )}
                        </div>

                        <button
                            id="set-password-btn"
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-accent hover:opacity-90 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Updating password...
                                </span>
                            ) : 'Set new password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}