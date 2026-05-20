import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        first_name: '',
        last_name: '',
        role: 'Project Engineer',
        middle_name: '',
        suffix: '',
        phone_number: '',
        gender: '',
        birthdate: '',
        address: ''
    });

    const roles = [
        'CEO', 'COO', 'Project Engineer', 'Project Coordinator', 
        'Procurement', 'Sales', 'Accounting', 'HR', 'Foreman', 'Staff'
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            setUsers(res.data.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
            toast.error('Could not load user list.');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            await api.post('/admin/users/invite', inviteForm);
            toast.success('Invitation sent to ' + inviteForm.email);
            setShowInviteModal(false);
            setInviteForm({ 
                email: '', 
                first_name: '', 
                last_name: '', 
                role: 'Project Engineer',
                middle_name: '',
                suffix: '',
                phone_number: '',
                gender: '',
                birthdate: '',
                address: ''
            });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await api.patch(`/admin/users/${userId}/status`, { is_active: newStatus });
            toast.success(`Account ${newStatus ? 'activated' : 'deactivated'}`);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const [editingUserId, setEditingUserId] = useState(null);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', role: '' });

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
        });
    };

    const handleSaveEdit = async () => {
        try {
            await api.patch(`/admin/users/${editingUserId}`, editForm);
            toast.success('Personnel details updated');
            setEditingUserId(null);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        }
    };

    return (
        <DashboardLayout pageTitle="Personnel Management">
            <div className="space-y-5 animate-in fade-in duration-500 pb-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-card p-6 rounded-2xl shadow-sm border border-border-primary gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-text-primary tracking-tight">Active Directory</h2>
                            <p className="text-xs font-bold text-text-muted">Directly access and manage personnel designations and credentials.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="w-full md:w-auto bg-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-accent/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <span className="text-lg">+</span>
                        Add Personnel
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-card rounded-2xl shadow-sm border border-border-primary overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-bg-secondary/50 border-b border-border-primary">
                                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Personnel</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Email Address</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Designation</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-primary/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-[4px] border-accent/10 border-t-accent rounded-full animate-spin"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Synchronizing Directory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-text-muted font-bold italic">No personnel records found.</td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const isEditing = editingUserId === user.id;
                                        return (
                                            <tr key={user.id} className={`group hover:bg-bg-hover transition-colors ${!user.is_active && !isEditing ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm transition-transform group-hover:scale-105 ${user.is_active ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-text-muted'}`}>
                                                            {user.first_name[0]}{user.last_name[0]}
                                                        </div>
                                                        {isEditing ? (
                                                            <div className="flex gap-2">
                                                                <input 
                                                                    value={editForm.first_name}
                                                                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                                                                    className="bg-bg-tertiary border border-border-primary rounded px-2 py-1 text-sm font-bold w-24 outline-none focus:border-accent"
                                                                />
                                                                <input 
                                                                    value={editForm.last_name}
                                                                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                                                                    className="bg-bg-tertiary border border-border-primary rounded px-2 py-1 text-sm font-bold w-24 outline-none focus:border-accent"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="block font-bold text-text-primary text-[15px] leading-tight">{user.first_name} {user.last_name}</span>
                                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-0.5 block">{user.role}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isEditing ? (
                                                        <input 
                                                            value={editForm.email}
                                                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                                            className="bg-bg-tertiary border border-border-primary rounded px-3 py-1 text-sm font-semibold w-full outline-none focus:border-accent"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-semibold text-text-muted">{user.email}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative group min-w-[160px]">
                                                        <select 
                                                            value={isEditing ? editForm.role : (roles.find(r => r.toLowerCase() === user.role.toLowerCase()) || user.role)} 
                                                            onChange={(e) => isEditing ? setEditForm({...editForm, role: e.target.value}) : updateRole(user.id, e.target.value)}
                                                            className="w-full bg-bg-tertiary border border-border-primary rounded-lg text-xs font-bold tracking-tight px-3 py-2 pr-8 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none appearance-none cursor-pointer text-text-primary transition-all shadow-sm"
                                                        >
                                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-accent transition-colors">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                        user.is_active 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                        <span className={`w-1 h-1 rounded-full mr-2 ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                                                        {user.is_active ? 'Active' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button 
                                                                onClick={handleSaveEdit}
                                                                className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm"
                                                            >
                                                                Save
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditingUserId(null)}
                                                                className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-bg-tertiary text-text-muted hover:bg-bg-hover transition-all border border-border-primary"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => handleEditClick(user)}
                                                                className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg text-accent hover:bg-accent/10 transition-all border border-accent/20"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                                className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all border ${
                                                                    user.is_active 
                                                                        ? 'text-red-500 border-red-500/20 hover:bg-red-500/10' 
                                                                        : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'
                                                                }`}
                                                            >
                                                                {user.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border-primary overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-accent px-8 py-8 text-white relative">
                                <h3 className="text-2xl font-black tracking-tight">Add Personnel</h3>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">Directory Invitation</p>
                            </div>
                            
                            <form onSubmit={handleInviteSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">First Name *</label>
                                        <input 
                                            required
                                            value={inviteForm.first_name}
                                            onChange={(e) => setInviteForm({...inviteForm, first_name: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Middle Name</label>
                                        <input 
                                            value={inviteForm.middle_name}
                                            onChange={(e) => setInviteForm({...inviteForm, middle_name: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Last Name *</label>
                                        <input 
                                            required
                                            value={inviteForm.last_name}
                                            onChange={(e) => setInviteForm({...inviteForm, last_name: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Suffix</label>
                                        <input 
                                            value={inviteForm.suffix}
                                            placeholder="e.g. Jr., III"
                                            onChange={(e) => setInviteForm({...inviteForm, suffix: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Email Address *</label>
                                        <input 
                                            required
                                            type="email"
                                            value={inviteForm.email}
                                            onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Phone Number</label>
                                        <input 
                                            value={inviteForm.phone_number}
                                            onChange={(e) => setInviteForm({...inviteForm, phone_number: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Gender</label>
                                        <div className="relative group">
                                            <select 
                                                value={inviteForm.gender}
                                                onChange={(e) => setInviteForm({...inviteForm, gender: e.target.value})}
                                                className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 pr-10 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none cursor-pointer text-text-primary animate-none"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                                <option value="Prefer not to say">Prefer not to say</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-accent transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Birthdate</label>
                                        <input 
                                            type="date"
                                            value={inviteForm.birthdate}
                                            onChange={(e) => setInviteForm({...inviteForm, birthdate: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary"
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Role *</label>
                                        <div className="relative group">
                                            <select 
                                                value={inviteForm.role}
                                                onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                                                className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 pr-10 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none cursor-pointer text-text-primary"
                                            >
                                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-accent transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Address</label>
                                        <textarea 
                                            rows={2}
                                            value={inviteForm.address}
                                            onChange={(e) => setInviteForm({...inviteForm, address: e.target.value})}
                                            className="w-full rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text-primary resize-none"
                                            placeholder="Living address details"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="flex-1 py-3 text-[10px] font-black text-text-muted bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-all uppercase tracking-widest border border-border-primary"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={inviting}
                                        className="flex-[2] py-3 text-[10px] font-black text-white bg-accent hover:opacity-90 rounded-xl shadow-lg transition-all disabled:opacity-50 uppercase tracking-widest"
                                    >
                                        {inviting ? 'Adding...' : 'Add Personnel'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
