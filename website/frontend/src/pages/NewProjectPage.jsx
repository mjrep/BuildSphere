import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import useAuth from '../hooks/useAuth';
import { createProject, getUsers } from '../services/projectApi';
import toast from 'react-hot-toast';
import { ChevronLeft, Briefcase, User, MapPin, AlignLeft, DollarSign, Calendar, Target, Plus } from 'lucide-react';

export default function NewProjectPage() {
    const navigate = useNavigate();
     const { user, loading } = useAuth();
    const [users, setUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        project_name: '',
        client_name: '',
        address: '',
        description: '',
        contract_price: '',
        contract_unit_price: '',
        start_date: '',
        end_date: '',
        project_in_charge_id: '',
        budget_for_materials: '',
    });

    useEffect(() => {
        if (loading) return;
        const role = (user?.role || '').toLowerCase();
        if (role !== 'sales') {
            navigate('/projects');
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        getUsers({ role: 'Project Engineer' })
            .then((res) => setUsers(res.data))
            .catch(() => {});
    }, []);

    const formatNumber = (val) => {
        if (!val && val !== 0) return '';
        const parts = val.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        // Financial fields handling
        if (['contract_price', 'contract_unit_price', 'budget_for_materials'].includes(name)) {
            // Remove commas and non-numeric chars except decimal point
            finalValue = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
            
            // Prevent multiple decimals
            const dots = finalValue.split('.').length - 1;
            if (dots > 1) return;
        }

        setForm((prev) => ({ ...prev, [name]: finalValue }));
        setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const payload = {
                project_name: form.project_name.trim(),
                client_name: form.client_name.trim(),
                address: form.address.trim(),
                description: form.description.trim(),
                start_date: form.start_date,
                end_date: form.end_date,
                contract_price: parseFloat(form.contract_price) || 0,
                contract_unit_price: form.contract_unit_price ? parseFloat(form.contract_unit_price) : null,
                budget_for_materials: form.budget_for_materials ? parseFloat(form.budget_for_materials) : null,
                project_in_charge_id: form.project_in_charge_id ? parseInt(form.project_in_charge_id) : null,
            };

            if (!payload.project_name || !payload.address || !payload.start_date || !payload.end_date) {
                toast.error('Please fill in all required fields (Project Name, Address, Start and End Dates).');
                setSaving(false);
                return;
            }

            const response = await createProject(payload);
            toast.success('Project created successfully!');
            navigate('/projects/success');
        } catch (err) {
            console.error('Create project failed:', err);
            const errorData = err.response?.data;
            if (err.response?.status === 422) {
                const backendErrors = errorData.errors || {};
                // If backend sent a flat message but no field-specific errors
                if (Object.keys(backendErrors).length === 0 && errorData.message) {
                    setErrors({ project_name: [errorData.message] });
                    toast.error(errorData.message);
                } else {
                    setErrors(backendErrors);
                    toast.error('Please check the form for errors.');
                }
            } else {
                const message = errorData?.message || errorData?.error || 'Something went wrong. Please try again.';
                toast.error(message);
                setErrors({ project_name: [message] });
            }
        } finally {
            setSaving(false);
        }
    };

    const inputClass = (field) =>
        `w-full rounded-2xl border px-5 py-3 text-sm transition-all focus:outline-none focus:ring-2 placeholder:text-[#C1C1C1] ${
            errors[field]
                ? 'border-red-400 focus:ring-red-200'
                : 'border-[#E8E8FF] focus:ring-[#706BFF]/20 focus:border-[#706BFF]'
        }`;

    return (
        <DashboardLayout pageTitle={
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/projects')} 
                    className="p-2 -ml-2 rounded-lg text-[#1A1A1A] hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold">New Project</span>
            </div>
        }>
            <div className="max-w-4xl mx-auto pb-12">
                <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#F0F0F8] overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-[#706BFF] px-8 py-10 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Create New Project</h2>
                            <p className="text-white/80 text-sm max-w-md">
                                Fill in the details below to initiate a new project proposal. Once saved, it will be ready for milestone planning.
                            </p>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute bottom-[-40px] right-[40px] w-32 h-32 rounded-full bg-white/5 blur-2xl" />
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#F0F0F8]">
                                <Briefcase className="w-4 h-4 text-[#706BFF]" />
                                <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Basic Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[#4A4A4A] ml-1">Project Name</label>
                                    <div className="relative">
                                        <input type="text" name="project_name" value={form.project_name} onChange={handleChange}
                                               placeholder="e.g., Sky Garden Condominium" className={inputClass('project_name')} />
                                    </div>
                                    {errors.project_name && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.project_name[0]}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[#4A4A4A] ml-1">Client / Company</label>
                                    <div className="relative">
                                        <input type="text" name="client_name" value={form.client_name} onChange={handleChange}
                                               placeholder="Enter client name" className={inputClass('client_name')} />
                                    </div>
                                    {errors.client_name && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.client_name[0]}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-[#4A4A4A] ml-1 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#A1A1A1]" />
                                    Address
                                </label>
                                <input type="text" name="address" value={form.address} onChange={handleChange}
                                       placeholder="Complete project location address" className={inputClass('address')} />
                                {errors.address && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.address[0]}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-[#4A4A4A] ml-1 flex items-center gap-1.5">
                                    <AlignLeft className="w-3.5 h-3.5 text-[#A1A1A1]" />
                                    Project Description
                                </label>
                                <textarea name="description" value={form.description} onChange={handleChange} rows="4"
                                          placeholder="Describe the scope of work and key deliverables..."
                                          className={inputClass('description') + " resize-none"} />
                                {errors.description && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.description[0]}</p>}
                            </div>
                        </div>

                        {/* Section 2: Financials & Dates */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-[#F0F0F8]">
                                    <DollarSign className="w-4 h-4 text-[#706BFF]" />
                                    <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Financials</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-[#4A4A4A] ml-1">Contract Price</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-[#706BFF] transition-colors">₱</span>
                                            <input type="text" name="contract_price" value={formatNumber(form.contract_price)} onChange={handleChange}
                                                   placeholder="0.00" className={inputClass('contract_price') + " pl-8"} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-[#4A4A4A] ml-1">Unit Price</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-[#706BFF] transition-colors">₱</span>
                                            <input type="text" name="contract_unit_price" value={formatNumber(form.contract_unit_price)} onChange={handleChange}
                                                   placeholder="0.00" className={inputClass('contract_unit_price') + " pl-8"} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[#4A4A4A] ml-1">Budget for Materials</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-[#706BFF] transition-colors">₱</span>
                                        <input type="text" name="budget_for_materials" value={formatNumber(form.budget_for_materials)} onChange={handleChange}
                                               placeholder="0.00" className={inputClass('budget_for_materials') + " pl-8"} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-[#F0F0F8]">
                                    <Calendar className="w-4 h-4 text-[#706BFF]" />
                                    <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Timeline</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-[#4A4A4A] ml-1">Start Date</label>
                                        <input type="date" name="start_date" value={form.start_date} onChange={handleChange}
                                               className={inputClass('start_date')} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-[#4A4A4A] ml-1">End Date</label>
                                        <input type="date" name="end_date" value={form.end_date} onChange={handleChange}
                                               className={inputClass('end_date')} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[#4A4A4A] ml-1 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-[#A1A1A1]" />
                                        Project-in-Charge
                                    </label>
                                    <div className="relative">
                                        <select name="project_in_charge_id" value={form.project_in_charge_id} onChange={handleChange}
                                                className={`${inputClass('project_in_charge_id')} appearance-none pr-10 ${
                                                    form.project_in_charge_id ? 'text-[#1A1A1A]' : 'text-[#C1C1C1]'
                                                }`}>
                                            <option value="">Select an engineer</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#A1A1A1]">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.project_in_charge_id && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.project_in_charge_id[0]}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="pt-6 border-t border-[#F0F0F8] flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/projects')}
                                className="px-8 py-3.5 text-sm font-bold text-[#A1A1A1] hover:text-[#706BFF] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#706BFF] hover:bg-[#5B55E6] disabled:opacity-60 text-white
                                           font-bold py-3.5 px-12 rounded-2xl transition-all flex items-center gap-2
                                           shadow-[0_8px_25px_rgba(112,107,255,0.3)] active:scale-[0.98]"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Create Project
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
