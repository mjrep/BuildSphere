import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Simple deterministic color hash for avatars based on name
const getColorForString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + ('00000'.substring(0, 6 - c.length) + c);
};

export default function OverviewTeamCard({ project, onMemberAdded }) {
    const { user } = useAuth();
    const canManageTeam = ['CEO', 'COO', 'HR'].includes(user?.role);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [roleInProject, setRoleInProject] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const members = project.team_members || [];

    useEffect(() => {
        if (isModalOpen && users.length === 0) {
            axios.get('/api/users')
                 .then(res => setUsers(res.data))
                 .catch(err => console.error(err));
        }
    }, [isModalOpen]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserId) return;
        
        setIsSubmitting(true);
        try {
            await axios.post(`/api/projects/${project.id}/team`, {
                user_id: selectedUserId,
                role_in_project: roleInProject
            });
            toast.success('Team member added successfully');
            setIsModalOpen(false);
            if (onMemberAdded) onMemberAdded();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add member');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 w-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-[#1A1A1A]">Team</h3>
                {canManageTeam && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-[#A1A1A1]">Members</span>
                <span className="bg-[#F0F0F8] rounded py-0.5 px-2 text-xs font-semibold text-[#1A1A1A]">
                    {members.length}
                </span>
            </div>

            <div className="flex gap-2.5 flex-wrap">
                {members.slice(0, 5).map(member => {
                    const bgColor = getColorForString(member.name);
                    return (
                        <div 
                            key={member.id} 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: bgColor }}
                            title={`${member.name} - ${member.role_in_project || member.role}`}
                        >
                            {member.initials}
                        </div>
                    );
                })}
                {members.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm border border-gray-300">
                        {members.length - 5}+
                    </div>
                )}
                {members.length === 0 && (
                    <p className="text-sm text-gray-400 italic py-2">No team members assigned.</p>
                )}
            </div>

            {/* Add Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative pointer-events-auto">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-bold mb-4">Add Team Member</h3>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Select User</label>
                                <select 
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#706BFF]"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select a user...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Role in Project (Optional)</label>
                                <input 
                                    type="text"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#706BFF]"
                                    placeholder="e.g. Lead Installer"
                                    value={roleInProject}
                                    onChange={(e) => setRoleInProject(e.target.value)}
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedUserId}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-[#706BFF] hover:bg-[#5B55E6] rounded-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
