import React, { useState, useEffect } from 'react';
import api from '../../services/api';
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
    const canManageTeam = ['ceo', 'coo', 'hr'].includes(user?.role?.toLowerCase()) && project.status !== 'completed';
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [users, setUsers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic selections per role
    const [selections, setSelections] = useState({
        Foreman: [],
        'Project Coordinator': [],
        'Procurement Manager': [],
        Staff: []
    });

    const members = project.team_members || [];

    useEffect(() => {
        if (isModalOpen && users.length === 0) {
            api.get('/users')
                 .then(res => setUsers(res.data))
                 .catch(err => console.error(err));
        }
    }, [isModalOpen]);

    const handleSelectUser = (role, userId) => {
        if (!userId) return;
        const selectedUser = users.find(u => u.id === userId);
        if (selectedUser && !selections[role].some(u => u.id === userId)) {
            // Also check if already in the project members
            if (members.some(m => m.id === userId)) {
                toast.error(`${selectedUser.name} is already in the project.`);
                return;
            }
            setSelections(prev => ({
                ...prev,
                [role]: [...prev[role], selectedUser]
            }));
        }
    };

    const handleRemoveSelection = (role, userId) => {
        setSelections(prev => ({
            ...prev,
            [role]: prev[role].filter(u => u.id !== userId)
        }));
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this team member from the project?')) return;
        try {
            await api.delete(`/projects/${project.id}/team/${memberId}`);
            toast.success('Team member removed');
            if (onMemberAdded) onMemberAdded(); // Refreshes project data
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove team member');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        
        const membersToAdd = [];
        Object.entries(selections).forEach(([roleName, selectedUsers]) => {
            selectedUsers.forEach(u => {
                membersToAdd.push({
                    user_id: u.id,
                    role_in_project: roleName
                });
            });
        });

        if (membersToAdd.length === 0) {
            toast.error('Please select at least one employee.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await api.post(`/projects/${project.id}/team`, { members: membersToAdd });
            setShowSuccess(true);
            if (onMemberAdded) onMemberAdded();
            
            // Reset selections
            setSelections({
                Foreman: [],
                'Project Coordinator': [],
                'Procurement Manager': [],
                Staff: []
            });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add members');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setShowSuccess(false);
        setSelections({
            Foreman: [],
            'Project Coordinator': [],
            'Procurement Manager': [],
            Staff: []
        });
    };

    // Helper to render selection inputs
    const renderRoleSelect = (roleName) => (
        <div className="mb-4">
            <label className="block text-xs font-semibold text-text-primary mb-2">{roleName}</label>
            <div className="relative">
                <select 
                    className="w-full rounded-xl border-2 border-border-primary px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#706BFF] focus:border-[#706BFF] bg-card appearance-none transition-colors pr-10"
                    onChange={(e) => {
                        handleSelectUser(roleName, e.target.value);
                        e.target.value = ''; // Reset select after picking
                    }}
                    defaultValue=""
                >
                    <option value="" disabled className="text-text-muted">Select an employee...</option>
                    {users
                        .filter(u => !selections[roleName].some(sel => sel.id === u.id))
                        .map(u => (
                            <option key={u.id} value={u.id}>{u.name} - {u.role || 'No Role'}</option>
                        ))
                    }
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            {/* Selected Chips */}
            {selections[roleName].length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selections[roleName].map(u => (
                        <div key={u.id} className="flex items-center gap-1.5 bg-bg-secondary text-text-primary text-xs font-medium px-2.5 py-1 rounded-lg border border-border-primary">
                            <span>{u.name}</span>
                            <button 
                                type="button" 
                                onClick={() => handleRemoveSelection(roleName, u.id)}
                                className="text-text-muted hover:text-red-500 font-bold ml-1 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-5 w-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-text-primary">Team</h3>
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
                <span className="text-sm font-semibold text-text-muted">Members</span>
                <span className="bg-bg-secondary rounded py-0.5 px-2 text-xs font-semibold text-text-primary">
                    {members.length}
                </span>
            </div>

            <div className="flex gap-2 flex-wrap">
                {members.map(member => {
                    const bgColor = getColorForString(member.name);
                    return (
                        <div key={member.id} className="relative group">
                            <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
                                style={{ backgroundColor: bgColor }}
                                title={`${member.name} - ${member.role_in_project || member.role}`}
                            >
                                {member.initials}
                            </div>
                            
                            {/* Remove button on hover */}
                            {canManageTeam && (
                                <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    title="Remove member"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
                {members.length === 0 && (
                    <p className="text-sm text-gray-400 italic py-2">No team members assigned.</p>
                )}
            </div>

            {/* Add Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    {!showSuccess ? (
                        <div className="bg-card rounded-3xl p-8 shadow-2xl w-full max-w-lg relative pointer-events-auto">
                            <button 
                                onClick={closeModal}
                                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <h3 className="text-lg font-bold mb-6 text-accent text-center">Add an employee</h3>
                            
                            <form onSubmit={handleAddMember} className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                                {renderRoleSelect('Foreman')}
                                {renderRoleSelect('Project Coordinator')}
                                {renderRoleSelect('Procurement Manager')}
                                {renderRoleSelect('Staff')}
                                
                                <div className="pt-4 flex justify-center">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-3 text-sm font-semibold text-white bg-accent hover:opacity-90 rounded-xl disabled:opacity-50 transition-colors"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Members'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-card rounded-3xl p-10 shadow-2xl w-full max-w-sm relative pointer-events-auto text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-[#706BFF] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-accent/30">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">Employee/s added!</h3>
                            <p className="text-sm text-text-muted mb-8 font-medium">Employee/s added to the project.</p>
                            
                            <button
                                onClick={closeModal}
                                className="w-full py-3 text-sm font-semibold text-white bg-accent hover:opacity-90 rounded-xl transition-colors"
                            >
                                Back to Project
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
