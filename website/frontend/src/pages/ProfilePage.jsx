import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';

export default function ProfilePage() {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors]     = useState({});
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [success, setSuccess]   = useState(false);

    useEffect(() => {
        api.get('/profile/me')
            .then(res => {
                const { first_name, last_name, email, role } = res.data;
                setForm(f => ({ ...f, first_name, last_name, email, role }));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setSuccess(false);

        const payload = {
            first_name: form.first_name,
            last_name:  form.last_name,
            email:      form.email,
        };
        if (form.password) {
            payload.password              = form.password;
            payload.password_confirmation = form.password_confirmation;
        }

        try {
            await api.put('/profile/update', payload);
            setSuccess(true);
            setForm(f => ({ ...f, password: '', password_confirmation: '' }));
        } catch (err) {
            console.error('Profile update failed:', err);
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                const message = err.response?.data?.message || 'Something went wrong. Please try again.';
                setErrors({ email: [message] });
            }
        } finally {
            setSaving(false);
        }
    };

    const initials = form.first_name && form.last_name
        ? `${form.first_name[0]}${form.last_name[0]}`.toUpperCase()
        : '?';

    const inputClass = (field) =>
        `w-full rounded-2xl border px-5 py-3 text-sm transition-all focus:outline-none focus:ring-2 placeholder:text-text-muted bg-bg-input text-text-primary ${
            errors[field]
                ? 'border-red-400 focus:ring-red-200'
                : 'border-border-primary focus:ring-accent/20 focus:border-accent'
        }`;

    if (loading) {
        return (
            <DashboardLayout pageTitle="Profile">
                <div className="flex items-center justify-center h-48">
                    <p className="text-text-muted text-sm">Loading profile…</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout pageTitle="Profile">
            <div className="max-w-3xl mx-auto space-y-6 pb-12">

                {/* Account card */}
                <div className="bg-card rounded-[2.5rem] shadow-xl border border-border-primary/50 p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16" />
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-[0_10px_30px_rgba(124,116,255,0.4)]">
                        {initials}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">
                            {form.first_name} {form.last_name}
                        </h2>
                        <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-wider">{form.email}</p>
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-accent/10 text-accent uppercase tracking-widest border border-accent/20">
                                {form.role}
                            </span>
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                                Active Account
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form card */}
                <div className="bg-card rounded-[2.5rem] shadow-xl border border-border-primary/50 p-10">
                    <h3 className="text-xl font-black text-text-primary mb-8 tracking-tight flex items-center gap-2">
                        <div className="w-2 h-6 bg-accent rounded-full" />
                        Edit Profile
                    </h3>

                    {/* Success banner */}
                    {success && (
                        <div className="mb-8 px-6 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-3 animate-in zoom-in-95 duration-300">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">✓</div>
                            Profile updated successfully.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    className={inputClass('first_name')}
                                    placeholder="First name"
                                />
                                {errors.first_name && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.first_name[0]}</p>}
                            </div>
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    className={inputClass('last_name')}
                                    placeholder="Last name"
                                />
                                {errors.last_name && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.last_name[0]}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className={inputClass('email')}
                                placeholder="Email address"
                            />
                            {errors.email && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.email[0]}</p>}
                        </div>

                        {/* Role — read only */}
                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Company Role</label>
                            <div className="w-full rounded-2xl border border-border-primary/50 bg-bg-tertiary px-6 py-4 text-sm text-text-muted font-bold italic shadow-inner">
                                {form.role}
                            </div>
                            <p className="text-[10px] text-text-muted font-bold italic ml-1">* Role cannot be changed manually. Contact HR for updates.</p>
                        </div>

                        {/* Divider */}
                        <div className="pt-6 border-t border-border-primary/50">
                            <h4 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6">Security Settings</h4>

                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">New Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        className={inputClass('password')}
                                        placeholder="Leave blank to keep current"
                                    />
                                    {errors.password && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.password[0]}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        value={form.password_confirmation}
                                        onChange={handleChange}
                                        className={inputClass('password_confirmation')}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-accent hover:opacity-90 disabled:opacity-60 text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] transition-all shadow-xl shadow-accent/20 active:scale-[0.98] focus:ring-4 focus:ring-accent/30 outline-none"
                            >
                                {saving ? 'Processing…' : 'Update Profile'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </DashboardLayout>
    );
}
