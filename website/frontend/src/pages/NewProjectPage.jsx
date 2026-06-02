import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import useAuth from '../hooks/useAuth';
import { createProject, getUsers } from '../services/projectApi';
import toast from 'react-hot-toast';
import { ChevronLeft, Briefcase, User, MapPin, AlignLeft, Calendar, Target, Plus } from 'lucide-react';

export default function NewProjectPage() {
    const navigate = useNavigate();
     const { user, loading } = useAuth();
    const [users, setUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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

    // Calculate real-time validation errors
    const realTimeErrors = {};

    if (form.start_date && form.end_date) {
        if (new Date(form.end_date) <= new Date(form.start_date)) {
            realTimeErrors.end_date = ['End Date must be later than Start Date.'];
            realTimeErrors.start_date = ['Start Date must be earlier than End Date.'];
        }
    }

    const cp = parseFloat(form.contract_price || 0);
    const up = parseFloat(form.contract_unit_price || 0);
    const bm = parseFloat(form.budget_for_materials || 0);

    if (form.contract_price && form.contract_unit_price && form.budget_for_materials) {
        if (cp <= bm + up) {
            realTimeErrors.contract_price = ['Contract Price must be strictly higher than Budget for Materials + Unit Price.'];
        }
    }

    const getFieldError = (field) => {
        return errors[field] || realTimeErrors[field];
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const requiredFields = [
            'project_name', 'client_name', 'address', 'description', 
            'contract_price', 'contract_unit_price', 'budget_for_materials', 
            'start_date', 'end_date', 'project_in_charge_id'
        ];
        let newErrors = {};
        let hasError = false;

        requiredFields.forEach(field => {
            if (!form[field] || (typeof form[field] === 'string' && !form[field].trim())) {
                newErrors[field] = ['This field is required.'];
                hasError = true;
            }
        });

        if (Object.keys(realTimeErrors).length > 0) {
            hasError = true;
            newErrors = { ...newErrors, ...realTimeErrors };
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmModal(false);
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
                } else {
                    setErrors(backendErrors);
                }
            } else {
                const message = errorData?.message || errorData?.error || 'Something went wrong. Please try again.';
                setErrors({ project_name: [message] });
            }
        } finally {
            setSaving(false);
        }
    };

    const hasRealTimeErrors = Object.keys(realTimeErrors).length > 0;

    const inputClass = (field) => {
        const error = getFieldError(field);
        return `w-full rounded-2xl border px-5 py-3 text-sm transition-all focus:outline-none focus:ring-2 placeholder:text-text-muted ${
            error
                ? 'border-red-400 focus:ring-red-200'
                : 'border-border-primary focus:ring-[#706BFF]/20 focus:border-[#706BFF]'
        }`;
    };

    return (
        <DashboardLayout pageTitle={
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/projects')} 
                    className="p-2 -ml-2 rounded-lg text-text-primary hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold">New Project</span>
            </div>
        }>
            <div className="max-w-4xl mx-auto pb-12">
                <div className="bg-card rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border-primary overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-accent px-8 py-10 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Create New Project</h2>
                            <p className="text-white/80 text-sm max-w-md">
                                Fill in the details below to initiate a new project proposal. Once saved, it will be ready for milestone planning.
                            </p>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full bg-card/10 blur-3xl" />
                        <div className="absolute bottom-[-40px] right-[40px] w-32 h-32 rounded-full bg-card/5 blur-2xl" />
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-border-primary">
                                <Briefcase className="w-4 h-4 text-accent" />
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Basic Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-text-secondary ml-1">Project Name</label>
                                    <div className="relative">
                                        <input type="text" name="project_name" value={form.project_name} onChange={handleChange}
                                               placeholder="e.g., Sky Garden Condominium" className={inputClass('project_name')} />
                                    </div>
                                    {getFieldError('project_name') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('project_name')[0]}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-text-secondary ml-1">Client / Company</label>
                                    <div className="relative">
                                        <input type="text" name="client_name" value={form.client_name} onChange={handleChange}
                                               placeholder="Enter client name" className={inputClass('client_name')} />
                                    </div>
                                    {getFieldError('client_name') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('client_name')[0]}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-text-secondary ml-1 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                                    Address
                                </label>
                                <input type="text" name="address" value={form.address} onChange={handleChange}
                                       placeholder="Complete project location address" className={inputClass('address')} />
                                {getFieldError('address') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('address')[0]}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-text-secondary ml-1 flex items-center gap-1.5">
                                    <AlignLeft className="w-3.5 h-3.5 text-text-muted" />
                                    Project Description
                                </label>
                                <textarea name="description" value={form.description} onChange={handleChange} rows="4"
                                          placeholder="Describe the scope of work and key deliverables..."
                                          className={inputClass('description') + " resize-none"} />
                                {getFieldError('description') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('description')[0]}</p>}
                            </div>
                        </div>

                        {/* Section 2: Financials & Dates */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-border-primary">
                                    <span className="text-accent font-bold text-lg leading-none">₱</span>
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Financials</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-text-secondary ml-1">Contract Price</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-accent transition-colors">₱</span>
                                            <input type="text" name="contract_price" value={formatNumber(form.contract_price)} onChange={handleChange}
                                                   placeholder="0.00" className={inputClass('contract_price') + " pl-8"} />
                                        </div>
                                        {getFieldError('contract_price') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('contract_price')[0]}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-text-secondary ml-1">Unit Price</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-accent transition-colors">₱</span>
                                            <input type="text" name="contract_unit_price" value={formatNumber(form.contract_unit_price)} onChange={handleChange}
                                                   placeholder="0.00" className={inputClass('contract_unit_price') + " pl-8"} />
                                        </div>
                                        {getFieldError('contract_unit_price') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('contract_unit_price')[0]}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-text-secondary ml-1">Budget for Materials</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-accent transition-colors">₱</span>
                                        <input type="text" name="budget_for_materials" value={formatNumber(form.budget_for_materials)} onChange={handleChange}
                                               placeholder="0.00" className={inputClass('budget_for_materials') + " pl-8"} />
                                    </div>
                                    {getFieldError('budget_for_materials') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('budget_for_materials')[0]}</p>}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-border-primary">
                                    <Calendar className="w-4 h-4 text-accent" />
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Timeline</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-text-secondary ml-1">Start Date</label>
                                        <input type="date" name="start_date" value={form.start_date} onChange={handleChange}
                                               className={inputClass('start_date')} />
                                        {getFieldError('start_date') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('start_date')[0]}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-text-secondary ml-1">End Date</label>
                                        <input type="date" name="end_date" value={form.end_date} onChange={handleChange}
                                               className={inputClass('end_date')} />
                                        {getFieldError('end_date') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('end_date')[0]}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-text-secondary ml-1 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-text-muted" />
                                        Project-in-Charge
                                    </label>
                                    <div className="relative">
                                        <select name="project_in_charge_id" value={form.project_in_charge_id} onChange={handleChange}
                                                className={`${inputClass('project_in_charge_id')} appearance-none pr-10 ${
                                                    form.project_in_charge_id ? 'text-text-primary' : 'text-text-muted'
                                                }`}>
                                            <option value="">Select an engineer</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                            </svg>
                                        </div>
                                    </div>
                                    {getFieldError('project_in_charge_id') && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{getFieldError('project_in_charge_id')[0]}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="pt-6 border-t border-border-primary flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/projects')}
                                className="px-8 py-3.5 text-sm font-bold text-text-muted hover:text-accent transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || hasRealTimeErrors}
                                className="bg-accent hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white
                                           font-bold py-3.5 px-12 rounded-2xl transition-all flex items-center gap-2
                                           shadow-lg shadow-accent/20 active:scale-[0.98]"
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

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-primary animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-text-primary mb-2">Confirm Project Creation</h3>
                            <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                                Please review the details below. You won't be able to edit or delete it once created.
                            </p>
                            
                            {/* Summary View */}
                            <div className="bg-accent/5 rounded-xl p-4 mb-6 space-y-3 border border-accent/10 text-sm">
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-text-secondary">Project Name:</span>
                                    <span className="font-semibold text-text-primary text-right">{form.project_name.trim()}</span>
                                </div>
                                {form.client_name && (
                                    <div className="flex justify-between items-start gap-4">
                                        <span className="text-text-secondary">Client:</span>
                                        <span className="font-semibold text-text-primary text-right">{form.client_name.trim()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-text-secondary">Timeline:</span>
                                    <span className="font-semibold text-text-primary text-right">
                                        {form.start_date} to {form.end_date}
                                    </span>
                                </div>
                                {form.contract_price && (
                                    <div className="flex justify-between items-start gap-4 pt-2 border-t border-accent/10">
                                        <span className="text-text-secondary">Contract Price:</span>
                                        <span className="font-semibold text-text-primary text-right">₱ {formatNumber(form.contract_price)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-primary hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSubmit}
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-accent hover:opacity-90 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                                >
                                    Yes, Create Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
