import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import InventoryTable from './InventoryTable';
import AddInventoryItemModal from './AddInventoryItemModal';
import EditInventoryItemModal from './EditInventoryItemModal';
import InventoryTransactionModal from './InventoryTransactionModal';
import InventoryHistoryModal from './InventoryHistoryModal';
import MasterInventoryLedger from './MasterInventoryLedger';
import DeleteInventoryItemModal from './DeleteInventoryItemModal';
import InventorySuccessModal from './InventorySuccessModal';

import { supabase } from '../../utils/supabase';

export default function ProjectInventoryTab({ project }) {
    const { user } = useAuth();
    
    // Roles allowed to Add/Edit/Update stock
    const allowedRoles = ['CEO', 'COO', 'Project Engineer', 'Project Coordinator', 'Foreman', 'Procurement', 'Admin'];
    const canManageInventory = allowedRoles.includes(user?.role) && project.status !== 'completed';

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showMasterLedger, setShowMasterLedger] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState(''); // e.g. "Item added!"
    
    // Target Item for edit/stock update
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchInventory = () => {
        setLoading(true);
        api.get(`/projects/${project.id}/inventory`)
            .then(res => setItems(res.data.data || res.data))
            .catch(err => console.error('Failed to load inventory', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInventory();

        // Real-time subscription
        const channel = supabase
            .channel('inventory-changes')
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'project_inventory_items', filter: `project_id=eq.${project.id}` },
                () => {
                    console.log('Inventory change detected, refreshing...');
                    fetchInventory();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [project.id]);

    const handleSuccess = (message) => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowStockModal(false);
        setShowDeleteModal(false);
        setSuccessMessage(message);
        fetchInventory();
    };

    const closeSuccessModal = () => {
        setSuccessMessage('');
    };

    const handleEditItem = (item) => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const handleUpdateStock = (item) => {
        setSelectedItem(item);
        setShowStockModal(true);
    };
    
    const handleViewHistory = (item) => {
        setSelectedItem(item);
        setShowHistoryModal(true);
    };

    const handleDeleteItem = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border-primary w-full flex flex-col">
            {/* Header - Always visible immediately */}
            <div className="px-6 py-5 border-b border-border-primary flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary">Inventory list</h3>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowMasterLedger(true)}
                        className="px-5 py-2 bg-card border border-[#E0E0E8] text-text-primary text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        View Master Ledger
                    </button>
                    {canManageInventory && (
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-5 py-2 bg-accent text-white text-sm font-bold rounded-xl hover:opacity-90 transition-colors shadow-sm shadow-[#706BFF]/20"
                        >
                            Add Item
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="pb-6">
                <InventoryTable 
                    items={items} 
                    canManage={canManageInventory} 
                    onEdit={handleEditItem}
                    onUpdateStock={handleUpdateStock}
                    onViewHistory={handleViewHistory}
                    onDelete={handleDeleteItem}
                    isLoading={loading}
                />
            </div>

            {/* Modals ... */}

            {/* Modals */}
            {showAddModal && (
                <AddInventoryItemModal 
                    project={project}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => handleSuccess('Item added!')}
                />
            )}

            {showEditModal && selectedItem && (
                <EditInventoryItemModal 
                    project={project}
                    item={selectedItem}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => handleSuccess('Item edited!')}
                />
            )}

            {showStockModal && selectedItem && (
                <InventoryTransactionModal 
                    project={project}
                    item={selectedItem}
                    onClose={() => setShowStockModal(false)}
                    onSuccess={() => handleSuccess('Transaction logged!')}
                />
            )}
            
            {showHistoryModal && selectedItem && (
                <InventoryHistoryModal 
                    project={project}
                    item={selectedItem}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}

            {showMasterLedger && (
                <MasterInventoryLedger 
                    project={project}
                    inventoryItems={items}
                    onClose={() => setShowMasterLedger(false)}
                />
            )}

            {showDeleteModal && selectedItem && (
                <DeleteInventoryItemModal 
                    project={project}
                    item={selectedItem}
                    onClose={() => setShowDeleteModal(false)}
                    onSuccess={() => handleSuccess('Item removed!')}
                />
            )}

            {successMessage && (
                <InventorySuccessModal 
                    message={successMessage} 
                    onClose={closeSuccessModal} 
                />
            )}
        </div>
    );
}
