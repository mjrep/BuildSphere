import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        password: '',
        password_confirmation: '',
        current_password: '',
        middle_name: '',
        suffix: '',
        phone_number: '',
        gender: '',
        birthdate: '',
        address: '',
    });
    const [errors, setErrors]     = useState({});
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [success, setSuccess]   = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDirty, setIsDirty]   = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        api.get('/profile/me')
            .then(res => {
                const { 
                    first_name, last_name, email, role,
                    middle_name, suffix, phone_number, gender, birthdate, address 
                } = res.data;
                const formattedBirthdate = birthdate ? birthdate.split('T')[0] : '';
                setForm(f => ({ 
                    ...f, 
                    first_name: first_name || '', 
                    last_name: last_name || '', 
                    email: email || '', 
                    role: role || '',
                    middle_name: middle_name || '',
                    suffix: suffix || '',
                    phone_number: phone_number || '',
                    gender: gender || '',
                    birthdate: formattedBirthdate,
                    address: address || ''
                }));
                setIsDirty(false);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const validatePassword = (pwd) => {
        if (!pwd || pwd.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
        if (!/[^a-zA-Z0-9]/.test(pwd)) return 'Password must contain at least one special character.';
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        
        const newErrors = { ...errors, [name]: null };
        
        if (name === 'password') {
            if (value) {
                const pwdError = validatePassword(value);
                if (pwdError) {
                    newErrors.password = [pwdError];
                } else {
                    delete newErrors.password;
                }
            } else {
                delete newErrors.password;
            }
        }
        
        setErrors(newErrors);
        setSuccess(false);
        setIsDirty(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        setSaving(true);
        setErrors({});
        setSuccess(false);

        const payload = {
            first_name: form.first_name,
            last_name:  form.last_name,
            email:      form.email,
            middle_name: form.middle_name,
            suffix:      form.suffix,
            phone_number: form.phone_number,
            gender:      form.gender,
            birthdate:   form.birthdate || null,
            address:     form.address,
        };
        if (form.password) {
            const pwdError = validatePassword(form.password);
            if (pwdError) {
                setErrors({ ...errors, password: [pwdError] });
                setSaving(false);
                return;
            }
            if (form.password !== form.password_confirmation) {
                setErrors({ ...errors, password_confirmation: ['Passwords do not match.'] });
                setSaving(false);
                return;
            }
            payload.password              = form.password;
            payload.password_confirmation = form.password_confirmation;
            payload.current_password      = form.current_password;
        }

        try {
            await api.put('/profile/update', payload);
            setSuccess(true);
            setForm(f => ({ ...f, password: '', password_confirmation: '', current_password: '' }));
            setIsEditing(false);
            setIsDirty(false);
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
        } ${!isEditing ? 'opacity-70 cursor-not-allowed bg-bg-tertiary/50' : ''}`;

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
                            {[form.first_name, form.middle_name, form.last_name, form.suffix].filter(Boolean).join(' ')}
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Grid */}
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
                                    disabled={!isEditing}
                                />
                                {errors.first_name && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.first_name[0]}</p>}
                            </div>
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Middle Name</label>
                                <input
                                    type="text"
                                    name="middle_name"
                                    value={form.middle_name}
                                    onChange={handleChange}
                                    className={inputClass('middle_name')}
                                    placeholder="Middle name"
                                    disabled={!isEditing}
                                />
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
                                    disabled={!isEditing}
                                />
                                {errors.last_name && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.last_name[0]}</p>}
                            </div>
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Suffix</label>
                                <input
                                    type="text"
                                    name="suffix"
                                    value={form.suffix}
                                    onChange={handleChange}
                                    className={inputClass('suffix')}
                                    placeholder="e.g. Jr., III"
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        {/* Contact Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={inputClass('email')}
                                    placeholder="Email address"
                                    disabled={!isEditing}
                                />
                                {errors.email && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.email[0]}</p>}
                            </div>
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone_number"
                                    value={form.phone_number}
                                    onChange={handleChange}
                                    className={inputClass('phone_number')}
                                    placeholder="Phone number"
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        {/* Personal Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Gender</label>
                                <div className="relative">
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        className={inputClass('gender') + " appearance-none"}
                                        disabled={!isEditing}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-text-muted">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Birthdate</label>
                                <input
                                    type="date"
                                    name="birthdate"
                                    value={form.birthdate}
                                    onChange={handleChange}
                                    className={inputClass('birthdate')}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Address</label>
                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                className={`${inputClass('address')} resize-none`}
                                rows={3}
                                placeholder="Living address details"
                                disabled={!isEditing}
                            />
                        </div>

                        {/* Role — read only */}
                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Company Role</label>
                            <div className="w-full rounded-2xl border border-border-primary/50 bg-bg-tertiary px-6 py-4 text-sm text-text-muted font-bold italic shadow-inner">
                                {form.role}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="pt-6 border-t border-border-primary/50">
                            <h4 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6">Security Settings</h4>

                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            name="current_password"
                                            value={form.current_password}
                                            onChange={handleChange}
                                            className={inputClass('current_password') + " pr-12"}
                                            placeholder="Enter current password to set new password"
                                            disabled={!isEditing}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                                            disabled={!isEditing}
                                        >
                                            {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {errors.current_password && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.current_password[0]}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className={inputClass('password') + " pr-12"}
                                            placeholder="Leave blank to keep current"
                                            disabled={!isEditing}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                                            disabled={!isEditing}
                                        >
                                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.password[0]}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="password_confirmation"
                                            value={form.password_confirmation}
                                            onChange={handleChange}
                                            className={inputClass('password_confirmation') + " pr-12"}
                                            placeholder="Confirm new password"
                                            disabled={!isEditing}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                                            disabled={!isEditing}
                                        >
                                            {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
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
                                {saving ? 'Processing…' : (!isEditing ? 'Update Profile' : (isDirty ? 'Save Changes' : 'Update Profile'))}
                            </button>
                        </div>
                        
                        {/* Success banner */}
                        {success && (
                            <div className="mt-4 px-6 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-3 animate-in zoom-in-95 duration-300">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">✓</div>
                                Profile updated successfully.
                            </div>
                        )}
                    </form>
                </div>

            </div>
        </DashboardLayout>
    );
}
