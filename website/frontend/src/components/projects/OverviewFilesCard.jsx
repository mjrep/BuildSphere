import React, { useRef, useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, Image, FileSpreadsheet, FileArchive, Download, Trash2, Plus, Loader2 } from 'lucide-react';

/**
 * Returns an appropriate icon component for a file based on its MIME type.
 */
function getFileIcon(mimeType) {
    if (!mimeType) return <FileText size={18} className="text-accent" />;
    if (mimeType.startsWith('image/')) return <Image size={18} className="text-emerald-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={18} className="text-green-600" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('compressed')) return <FileArchive size={18} className="text-amber-500" />;
    if (mimeType.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    return <FileText size={18} className="text-accent" />;
}

/**
 * Formats a file size in bytes to a human-readable string.
 */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Returns a relative time string.
 */
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function OverviewFilesCard({ project, onFileUploaded }) {
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchFiles = useCallback(async () => {
        try {
            const res = await api.get(`/projects/${project.id}/files`);
            setFiles(res.data.data || []);
        } catch (err) {
            console.error('Failed to load files:', err);
            // Fall back to embedded project data
            setFiles(project.recent_project_files || []);
        } finally {
            setLoadingFiles(false);
        }
    }, [project.id, project.recent_project_files]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleFileChange = async (e) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('files', selectedFiles[i]);
        }

        try {
            await api.post(`/projects/${project.id}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Files uploaded successfully');
            await fetchFiles();
            if (onFileUploaded) onFileUploaded();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to upload files');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (fileId, fileName) => {
        if (!confirm(`Delete "${fileName}"?`)) return;

        setDeletingId(fileId);
        try {
            await api.delete(`/projects/${project.id}/files/${fileId}`);
            toast.success('File deleted');
            await fetchFiles();
            if (onFileUploaded) onFileUploaded();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete file');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border-primary p-5 w-full flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
                <h3 className="text-base font-bold text-text-primary">Files</h3>
                
                <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-7 h-7 rounded-full bg-bg-tertiary text-text-muted hover:bg-accent/10 hover:text-accent flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Upload File"
                >
                    {isUploading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Plus size={16} strokeWidth={2.5} />
                    )}
                </button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-border-primary scrollbar-track-transparent flex-1 min-h-0">
                {loadingFiles ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={18} className="animate-spin text-text-muted" />
                    </div>
                ) : files.length === 0 ? (
                    <p className="text-sm text-text-muted italic">No files attached.</p>
                ) : (
                    files.map(file => (
                        <div key={file.id} className="flex items-center gap-3 group rounded-xl px-3 py-2.5 -mx-3 hover:bg-bg-secondary transition-colors">
                            {/* File Icon */}
                            <div className="w-9 h-9 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-card">
                                {getFileIcon(file.file_type)}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate" title={file.file_name}>
                                    {file.file_name}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {formatFileSize(file.file_size)}
                                    {file.uploaded_by && <span> · {file.uploaded_by}</span>}
                                    {file.created_at && <span> · {timeAgo(file.created_at)}</span>}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.download_url && (
                                    <a
                                        href={file.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                                        title="Download"
                                    >
                                        <Download size={14} />
                                    </a>
                                )}
                                <button
                                    onClick={() => handleDelete(file.id, file.file_name)}
                                    disabled={deletingId === file.id}
                                    className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Delete"
                                >
                                    {deletingId === file.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
