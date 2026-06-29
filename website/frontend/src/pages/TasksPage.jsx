import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import TaskToolbar from '../components/tasks/TaskToolbar';
import TaskProjectFilter from '../components/tasks/TaskProjectFilter';
import TaskListTable from '../components/tasks/TaskListTable';
import TaskKanbanBoard from '../components/tasks/TaskKanbanBoard';
import AddTaskModal from '../components/tasks/AddTaskModal';
import ViewTaskModal from '../components/tasks/ViewTaskModal';
import EmptyTaskState from '../components/tasks/EmptyTaskState';
import TaskLoadingState from '../components/tasks/TaskLoadingState';
import useTasks from '../hooks/useTasks';
import useTaskFilters from '../hooks/useTaskFilters';
import useTaskPermissions from '../hooks/useTaskPermissions';
import useAuth from '../hooks/useAuth';
import { getTaskMeta, updateTaskStatus, createTaskComment, uploadTaskAttachments, deleteTask } from '../services/taskApi';

export default function TasksPage() {
    const [searchParams] = useSearchParams();
    const initialProject = searchParams.get('project') || 'all';

    const { user }        = useAuth();
    const permissions     = useTaskPermissions(user);
    const { tasks, meta, loading, error, fetchTasks, setTasks } = useTasks();

    const {
        search, setSearch,
        sort, setSort,
        filters, setFilter,
        resetFilters, toQueryParams, hasActiveFilters,
        page, setPage,
    } = useTaskFilters();

    const [view, setView]               = useState('list');
    const [metaData, setMetaData]       = useState(null);
    const [showAddModal, setShowAddModal]= useState(false);
    const [taskToEdit, setTaskToEdit]   = useState(null);
    const [selectedTask, setSelectedTask]= useState(null);
    const [selectedProject, setSelectedProject] = useState(initialProject);

    // Initial data fetch
    const loadTasks = useCallback(() => {
        const queryParams = toQueryParams();
        if (selectedProject !== 'all') {
            queryParams.project_id = selectedProject;
        }
        fetchTasks(queryParams);
    }, [fetchTasks, toQueryParams, selectedProject]);

    useEffect(() => { loadTasks(); }, [search, sort, filters, selectedProject, page]);

    // Load filter meta once
    useEffect(() => {
        getTaskMeta().then(setMetaData).catch(() => {});
    }, []);

    // ── Handlers ─────────────────────────────────────────────────────────

    const handleStatusChange = useCallback(async (id, status) => {
        try {
            await updateTaskStatus(id, status);
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        } catch {
            toast.error('Failed to update status.');
        }
    }, [setTasks]);

    const handleCommentAdd = useCallback(async (taskId, comment) => {
        try {
            return await createTaskComment(taskId, comment);
        } catch {
            toast.error('Failed to post comment.');
            return null;
        }
    }, []);

    const handleAttachmentUpload = useCallback(async (taskId, fd) => {
        try {
            return await uploadTaskAttachments(taskId, fd);
        } catch {
            toast.error('Upload failed.');
            return null;
        }
    }, []);

    const handleDeleteTask = useCallback(async (id) => {
        try {
            await deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            toast.success('Task deleted successfully.');
        } catch {
            toast.error('Failed to delete task.');
        }
    }, [setTasks]);

    const handleEditTask = useCallback((task) => {
        setTaskToEdit(task);
    }, []);

    return (
        <DashboardLayout pageTitle="Tasks">
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

            <div className="space-y-6">
                {/* Controls Area */}
                <div className="bg-card rounded-[2rem] border border-border-primary/50 shadow-xl p-6 flex flex-col gap-6">
                    {/* Top Toolbar */}
                    <TaskToolbar
                        view={view}
                        onViewChange={setView}
                        search={search}
                        onSearchChange={setSearch}
                        sort={sort}
                        onSortChange={setSort}
                        filters={filters}
                        onFilterChange={setFilter}
                        onResetFilters={resetFilters}
                        hasActiveFilters={hasActiveFilters}
                        meta={metaData}
                        canCreate={permissions.canCreateTask}
                        onAddTask={() => setShowAddModal(true)}
                    />

                    {/* Divider */}
                    <div className="w-full h-px bg-border-primary/30"></div>

                    {/* Bottom Project Filter */}
                    <TaskProjectFilter 
                        projects={metaData?.projects || []} 
                        selected={selectedProject} 
                        onSelect={setSelectedProject} 
                    />
                </div>

                {/* Content area */}
                <div className="bg-card rounded-[2rem] border border-border-primary/50 shadow-xl p-8">
                    {error ? (
                        <div className="py-24 text-center">
                            <p className="text-sm text-red-500 font-bold">{error}</p>
                            <button onClick={loadTasks} className="mt-4 text-xs text-accent font-black uppercase tracking-widest hover:underline">Retry</button>
                        </div>
                    ) : loading ? (
                        <TaskLoadingState view={view} />
                    ) : tasks.length === 0 ? (
                        <EmptyTaskState
                            message="No tasks found."
                            canAdd={permissions.canCreateTask}
                            onAdd={() => setShowAddModal(true)}
                        />
                    ) : view === 'list' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-lg font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                                    <div className="w-2 h-6 bg-accent rounded-full" />
                                    Task List
                                </h2>
                                {meta && (
                                    <span className="text-[11px] font-bold text-text-muted bg-bg-secondary px-3 py-1 rounded-full">{meta.total} tasks total</span>
                                )}
                            </div>
                             <TaskListTable 
                                tasks={tasks} 
                                onTaskClick={setSelectedTask} 
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                            />

                            {/* Pagination */}
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button 
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={meta.current_page === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-border-primary text-text-muted hover:bg-bg-secondary disabled:opacity-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                                        Page {meta.current_page} of {meta.last_page}
                                    </span>
                                    <button 
                                        onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                        disabled={meta.current_page === meta.last_page}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-border-primary text-text-muted hover:bg-bg-secondary disabled:opacity-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                     ) : (
                        <TaskKanbanBoard 
                            tasks={tasks} 
                            onTaskClick={setSelectedTask} 
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                        />
                    )}
                </div>
            </div>

            {/* Add/Edit Task Modal */}
            {(showAddModal || taskToEdit) && (
                <AddTaskModal
                    user={user}
                    task={taskToEdit}
                    onClose={() => { setShowAddModal(false); setTaskToEdit(null); }}
                    onSuccess={loadTasks}
                />
            )}

            {/* View Task Modal */}
            {selectedTask && (
                <ViewTaskModal
                    taskId={selectedTask.id}
                    task={null}
                    user={user}
                    permissions={permissions}
                    onClose={() => setSelectedTask(null)}
                    onStatusChange={handleStatusChange}
                    onCommentAdd={handleCommentAdd}
                    onAttachmentUpload={handleAttachmentUpload}
                />
            )}
        </DashboardLayout>
    );
}
