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
        role: 'Project Engineer'
    });

    const roles = [
        'CEO', 'COO', 'Project Engineer', 'Project Coordinator', 
        'Foreman', 'Procurement', 'Accounting', 'HR'
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
            setInviteForm({ email: '', first_name: '', last_name: '', role: 'Project Engineer' });
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

    const updateRole = async (userId, newRole) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            toast.success('Role updated successfully');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update role');
        }
    };

    return (
        <DashboardLayout pageTitle="Personnel Management">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Section Removed (Layout has Header) - Keeping description/button row */}
                <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-[#F0F0F8]">
                    <div>
                        <p className="text-[#6B7280] text-sm">Manage company accounts, roles, and system access.</p>
                    </div>
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="bg-[#706BFF] hover:bg-[#5B55E6] text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-[#706BFF]/20 flex items-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        Invite New Personnel
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-[#F0F0F8] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-[#F0F0F8]">
                                    <th className="px-8 py-5 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Name</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Email</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Role</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F0F8]">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-[#6B7280]">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-[#706BFF]/20 border-t-[#706BFF] rounded-full animate-spin"></div>
                                                <span className="text-sm font-medium">Fetching personnel list...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-[#6B7280]">No personnel accounts found.</td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className={`hover:bg-[#F9FAFB] transition-colors ${!user.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.is_active ? 'bg-[#706BFF]/10 text-[#706BFF]' : 'bg-gray-200 text-gray-500'}`}>
                                                        {user.first_name[0]}{user.last_name[0]}
                                                    </div>
                                                    <span className="font-bold text-[#1A1A1A]">{user.first_name} {user.last_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-[#4B5563]">{user.email}</td>
                                            <td className="px-8 py-5">
                                                <select 
                                                    value={user.role} 
                                                    onChange={(e) => updateRole(user.id, e.target.value)}
                                                    className="bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium px-2 py-1 focus:ring-2 focus:ring-[#706BFF]/20 outline-none"
                                                >
                                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    user.is_active 
                                                        ? 'bg-emerald-50 text-emerald-600' 
                                                        : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {user.is_active ? 'Active' : 'Deactivated'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button 
                                                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                                                        user.is_active 
                                                            ? 'text-red-500 hover:bg-red-50' 
                                                            : 'text-emerald-500 hover:bg-emerald-50'
                                                    }`}
                                                >
                                                    {user.is_active ? 'Deactivate' : 'Activate Account'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-[#706BFF] p-8 text-white">
                                <h3 className="text-2xl font-bold">Invite Personnel</h3>
                                <p className="text-white/70 text-sm mt-1">Send a registration invite to a new member.</p>
                            </div>
                            
                            <form onSubmit={handleInviteSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">First Name</label>
                                        <input 
                                            required
                                            value={inviteForm.first_name}
                                            onChange={(e) => setInviteForm({...inviteForm, first_name: e.target.value})}
                                            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-[#706BFF]/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Last Name</label>
                                        <input 
                                            required
                                            value={inviteForm.last_name}
                                            onChange={(e) => setInviteForm({...inviteForm, last_name: e.target.value})}
                                            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-[#706BFF]/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                                    <input 
                                        required
                                        type="email"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                        className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-[#706BFF]/20 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Designated Role</label>
                                    <select 
                                        value={inviteForm.role}
                                        onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                                        className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-[#706BFF]/20 outline-none transition-all appearance-none"
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="flex-1 py-4 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={inviting}
                                        className="flex-[2] py-4 text-sm font-bold text-white bg-[#706BFF] hover:bg-[#5B55E6] rounded-2xl shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {inviting ? 'Sending Invite...' : 'Send Invitation'}
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
