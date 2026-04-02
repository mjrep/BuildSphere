import React from 'react';

// Generates an initial or simple dot style based on uploader name
const getColorForString = (str) => {
    let hash = 0;
    str = str || 'System';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + ('00000'.substring(0, 6 - c.length) + c);
};

export default function OverviewFilesCard({ project }) {
    const files = project.recent_project_files || [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F8] p-6 w-full flex flex-col mt-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-[#1A1A1A]">Files</h3>
                <button 
                    className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    title="Upload File (Coming soon)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
            
            <div className="flex flex-col gap-5">
                {files.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No files assigned.</p>
                ) : (
                    files.map(file => (
                        <div key={file.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3 min-w-0">
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                                    style={{ backgroundColor: getColorForString(file.uploaded_by) }}
                                >
                                    {file.uploaded_by ? file.uploaded_by.substring(0, 2).toUpperCase() : 'SYS'}
                                </div>
                                <div className="truncate min-w-0 pr-4">
                                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">{file.file_name}</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-[#1A1A1A] whitespace-nowrap flex-shrink-0">
                                {file.uploaded_at_human}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
