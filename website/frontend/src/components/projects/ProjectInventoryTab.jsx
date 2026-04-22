import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import InventoryTable from './InventoryTable';
import AddInventoryItemModal from './AddInventoryItemModal';
import EditInventoryItemModal from './EditInventoryItemModal';
import UpdateStockModal from './UpdateStockModal';
import DeleteInventoryItemModal from './DeleteInventoryItemModal';
import InventorySuccessModal from './InventorySuccessModal';

import { supabase } from '../../utils/supabase';

export default function ProjectInventoryTab({ project }) {
    const { user } = useAuth();
    
    // Roles allowed to Add/Edit/Update stock
    const allowedRoles = ['CEO', 'COO', 'Project Engineer', 'Project Coordinator', 'Foreman', 'Procurement', 'Admin'];
    const canManageInventory = allowedRoles.includes(user?.role);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
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

    const handleDeleteItem = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] w-full flex flex-col">
            {/* Header - Always visible immediately */}
            <div className="px-6 py-5 border-b border-[#F0F0F8] flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Inventory list</h3>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2 bg-[#706BFF] text-white text-sm font-bold rounded-xl hover:bg-[#5B55E6] transition-colors shadow-sm shadow-[#706BFF]/20"
                >
                    Add Item
                </button>
            </div>

            {/* Content Area */}
            <div className="pb-6">
                <InventoryTable 
                    items={items} 
                    canManage={true} 
                    onEdit={handleEditItem}
                    onUpdateStock={handleUpdateStock}
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
                <UpdateStockModal 
                    project={project}
                    item={selectedItem}
                    onClose={() => setShowStockModal(false)}
                    onSuccess={() => handleSuccess('Item updated!')}
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
