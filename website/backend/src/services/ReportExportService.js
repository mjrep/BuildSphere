let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.warn('Puppeteer not installed, PDF generation will not work.');
}
const ExcelJS = require('exceljs');
const axios = require('axios');

class ReportExportService {
    /**
     * Generates HTML payload for client-side PDF generation.
     */
    static async generatePDF(reportData, config) {
        // Return raw HTML instead of using Puppeteer on the server
        const htmlContent = this.generateReportHTML(reportData, config);
        return { html: htmlContent };
    }

    /**
     * Helper to fetch and add image to workbook
     */
    static async addImageToWorkbook(workbook, url) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            // Detect extension from URL or response
            let extension = url.split('.').pop().split('?')[0].toLowerCase();
            if (!['png', 'jpeg', 'jpg', 'gif'].includes(extension)) extension = 'png';
            if (extension === 'jpg') extension = 'jpeg';

            return workbook.addImage({
                buffer: Buffer.from(response.data),
                extension: extension,
            });
        } catch (err) {
            console.error('Error adding image to Excel:', err);
            return null;
        }
    }

    /**
     * Generates a multi-sheet Excel workbook using ExcelJS.
     */
    static async generateExcel(reportData, config) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BuildSphere';
        workbook.created = new Date();

        // 1. PROGRESS SHEET
        if (config.includeProgress) {
            const summarySheet = workbook.addWorksheet('Progress Analysis');
            summarySheet.columns = [
                { header: 'Project Name', key: 'project', width: 30 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Item Name', key: 'name', width: 40 },
                { header: 'Status / Details', key: 'status', width: 30 }
            ];

            summarySheet.getRow(1).font = { bold: true };
            summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

            reportData.forEach(p => {
                // Milestones & Nested Tasks
                if (p.progress?.phases) {
                    const milestones = p.progress.phases.flatMap(phase => phase.milestones || []);
                    milestones.forEach(m => {
                        summarySheet.addRow({
                            project: p.name,
                            category: 'Milestone',
                            name: m.milestone_name,
                            status: m.progress_percentage === 100 ? (m.updated_at?.split('T')[0] || 'Completed') : `Ongoing (${m.progress_percentage || 0}%)`
                        });

                        const milestoneTasks = p.completedTasks?.filter(t => t.milestone_id === m.id) || [];
                        milestoneTasks.forEach(t => {
                            summarySheet.addRow({
                                project: p.name,
                                category: 'Task',
                                name: `  - ${t.title}`,
                                status: t.status === 'completed' ? (t.date || 'Completed') : '—'
                            });
                        });
                    });
                }
                
                // Unassigned Tasks
                const unassignedTasks = p.completedTasks?.filter(t => !t.milestone_id || !p.progress?.phases?.flatMap(ph => ph.milestones).some(m => m.id === t.milestone_id)) || [];
                unassignedTasks.forEach(t => {
                    summarySheet.addRow({
                        project: p.name,
                        category: 'Task (Uncategorized)',
                        name: t.title,
                        status: t.status === 'completed' ? (t.date || 'Completed') : '—'
                    });
                });

                // Summary
                const milestonesCompleted = p.progress?.phases?.reduce((acc, phase) => acc + (phase.milestones?.filter(m => m.progress_percentage === 100).length || 0), 0) || 0;
                const tasksCompleted = p.completedTasks?.filter(t => t.status === 'completed').length || 0;
                
                summarySheet.addRow({
                    project: p.name,
                    category: 'Summary',
                    name: 'Milestones Completed',
                    status: milestonesCompleted.toString()
                });
                summarySheet.addRow({
                    project: p.name,
                    category: 'Summary',
                    name: 'Tasks Completed',
                    status: tasksCompleted.toString()
                });
                summarySheet.addRow({
                    project: p.name,
                    category: 'Summary',
                    name: 'Overall Progress',
                    status: `${p.progress?.project_progress || 0}%`
                });
                
                // Add an empty row between projects if multiple
                summarySheet.addRow({});
            });
        }

        // 2. INVENTORY SHEET
        if (config.includeInventory) {
            const invSheet = workbook.addWorksheet('Inventory');
            invSheet.columns = [
                { header: 'Project', key: 'project', width: 30 },
                { header: 'Item Name', key: 'item', width: 30 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Total Purchased', key: 'received', width: 15 },
                { header: 'In Stock', key: 'stock', width: 12 },
                { header: 'Unit Price', key: 'price', width: 15 },
                { header: 'Total Value', key: 'totalValue', width: 15 }
            ];
            invSheet.getRow(1).font = { bold: true };
            invSheet.views = [{ state: 'frozen', ySplit: 1 }];

            reportData.forEach(p => {
                (p.inventory || []).forEach(item => {
                    invSheet.addRow({
                        project: p.name,
                        item: item.item,
                        category: item.category,
                        received: item.received || item.stock,
                        stock: item.stock,
                        price: item.price,
                        totalValue: item.totalValueDisplay
                    });
                });

                if (p.inventory.length > 0) {
                    const totalInvValue = p.inventory.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0);
                    const totalRow = invSheet.addRow({
                        price: 'TOTAL INVENTORY VALUE:',
                        totalValue: `₱${totalInvValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    });
                    totalRow.font = { bold: true };
                }
                invSheet.addRow({}); // spacer
            });
        }

        // 3. ACCOMPLISHMENTS SHEET
        if (config.includeAccomplishments && config.accomplishmentViews) {
            const accSheet = workbook.addWorksheet('Accomplishments');
            
            // Set column layout
            accSheet.columns = [
                { header: 'Project', key: 'project', width: 25 },
                { header: 'Before Note', key: 'beforeNote', width: 35 },
                { header: 'Before Image', key: 'beforeImage', width: 50 },
                { header: 'After Note', key: 'afterNote', width: 35 },
                { header: 'After Image', key: 'afterImage', width: 50 }
            ];

            accSheet.getRow(1).font = { bold: true };
            accSheet.getRow(1).height = 30;
            accSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            let currentRow = 2;

            for (const p of reportData) {
                for (const view of config.accomplishmentViews) {
                    const before = p.accomplishments.find(a => a.date === view.beforeDate && (!view.taskId || String(a.task_id) === String(view.taskId)));
                    const after = p.accomplishments.find(a => a.date === view.afterDate && (!view.taskId || String(a.task_id) === String(view.taskId)));

                    const row = accSheet.getRow(currentRow);
                    row.height = 180; // Large height for images

                    row.getCell(1).value = p.name;
                    row.getCell(2).value = before ? `DATE: ${before.date}\nBY: ${before.taken_by}\n\n${before.notes}` : 'No photo selected';
                    row.getCell(4).value = after ? `DATE: ${after.date}\nBY: ${after.taken_by}\n\n${after.notes}` : 'No photo selected';
                    
                    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
                    row.getCell(4).alignment = { wrapText: true, vertical: 'top' };

                    // Embed Images
                    if (before && before.image_url) {
                        const imageId = await this.addImageToWorkbook(workbook, before.image_url);
                        if (imageId !== null) {
                            accSheet.addImage(imageId, {
                                tl: { col: 2, row: currentRow - 1 },
                                ext: { width: 350, height: 220 }
                            });
                        }
                    }

                    if (after && after.image_url) {
                        const imageId = await this.addImageToWorkbook(workbook, after.image_url);
                        if (imageId !== null) {
                            accSheet.addImage(imageId, {
                                tl: { col: 4, row: currentRow - 1 },
                                ext: { width: 350, height: 220 }
                            });
                        }
                    }

                    currentRow++;
                }
            }
        }

        return await workbook.xlsx.writeBuffer();
    }

    static generateReportHTML(reportData, config) {
        const sections = reportData.map(p => {
            let html = `
                <div class="project-container">
                    <div class="project-header">
                        <div class="marker"></div>
                        <h2 class="project-name">${p.name}</h2>
                    </div>
            `;

            // PROGRESS SECTION
            if (config.includeProgress) {
                const milestones = p.progress?.phases?.flatMap(phase => phase.milestones || []) || [];
                const tasks = p.completedTasks || [];
                const milestonesCompleted = p.progress?.phases?.reduce((acc, phase) => acc + (phase.milestones?.filter(m => m.progress_percentage === 100).length || 0), 0) || 0;
                const tasksCompleted = p.completedTasks?.filter(t => t.status === 'completed').length || 0;

                html += `
                    <div class="section">
                        <h3 class="section-title">Progress Analysis</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th colspan="2" style="background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase;">Milestones</th>
                                </tr>
                                <tr>
                                    <th>Milestone Name</th>
                                    <th>Progress</th>
                                    <th>Date Finished / Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${milestones.length > 0 
                                    ? milestones.map(m => {
                                        const milestoneTasks = tasks.filter(t => t.milestone_id === m.id);
                                        let rows = `
                                            <tr>
                                                <td style="font-weight: bold;">${m.milestone_name}</td>
                                                <td style="text-align: center;">${m.progress_percentage || 0}%</td>
                                                <td>${m.progress_percentage === 100 ? m.updated_at?.split('T')[0] || 'Completed' : '—'}</td>
                                            </tr>
                                        `;
                                        milestoneTasks.forEach(t => {
                                            rows += `
                                                <tr>
                                                    <td style="padding-left: 20px; color: #64748b;">&#8226; ${t.title}</td>
                                                    <td style="text-align: center; color: #64748b;"></td>
                                                    <td style="color: #64748b;">${t.status === 'completed' ? (t.date || 'Completed') : '—'}</td>
                                                </tr>
                                            `;
                                        });
                                        return rows;
                                    }).join('') 
                                    : '<tr><td colspan="3" class="empty">No milestones found.</td></tr>'}
                                ${(() => {
                                    const unassignedTasks = tasks.filter(t => !t.milestone_id || !milestones.some(m => m.id === t.milestone_id));
                                    if (unassignedTasks.length > 0) {
                                        return unassignedTasks.map(t => `
                                            <tr>
                                                <td style="padding-left: 20px; color: #64748b;">&#8226; ${t.title} (Uncategorized)</td>
                                                <td style="text-align: center; color: #64748b;"></td>
                                                <td style="color: #64748b;">${t.status === 'completed' ? (t.date || 'Completed') : '—'}</td>
                                            </tr>
                                        `).join('');
                                    }
                                    return '';
                                })()}
                            </tbody>

                            <thead>
                                <tr>
                                    <th colspan="2" style="background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase;">Executive Summary</th>
                                </tr>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Milestones Completed</td>
                                    <td>${milestonesCompleted}</td>
                                </tr>
                                <tr>
                                    <td>Tasks Completed</td>
                                    <td>${tasksCompleted}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Overall Progress</td>
                                    <td class="highlight-green" style="font-weight: bold;">${p.progress?.project_progress || 0}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // INVENTORY SECTION
            if (config.includeInventory) {
                html += `
                    <div class="section">
                        <h3 class="section-title">Inventory Summary</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Total Purchased</th>
                                    <th>In Stock</th>
                                    <th>Unit Price</th>
                                    <th>Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${p.inventory.length === 0 ? '<tr><td colspan="6" class="empty">No inventory data</td></tr>' : 
                                    p.inventory.map(item => `
                                    <tr>
                                        <td>${item.item}</td>
                                        <td>${item.category}</td>
                                        <td>${item.received || item.stock}</td>
                                        <td>${item.stock}</td>
                                        <td>${item.price}</td>
                                        <td class="highlight-green">${item.totalValueDisplay}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="5" style="text-align: right; font-weight: bold; padding-top: 15px; border-top: 2px solid #e2e8f0;">TOTAL INVENTORY VALUE</td>
                                    <td style="font-weight: bold; font-size: 14px; padding-top: 15px; border-top: 2px solid #e2e8f0;" class="highlight-green">
                                        ₱${p.inventory.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;
            }

            // ACCOMPLISHMENTS SECTION
            if (config.includeAccomplishments && config.accomplishmentViews) {
                html += `
                    <div class="section">
                        <h3 class="section-title">Accomplishments & Progress Photos</h3>
                        ${config.accomplishmentViews.map((view, idx) => {
                            const before = p.accomplishments.find(a => a.date === view.beforeDate && (!view.taskId || String(a.task_id) === String(view.taskId)));
                            const after = p.accomplishments.find(a => a.date === view.afterDate && (!view.taskId || String(a.task_id) === String(view.taskId)));

                            return `
                                <div class="comparison-row">
                                    <h4 class="comparison-label">Comparison View #${idx + 1}</h4>
                                    <div class="photo-grid">
                                        <div class="photo-card">
                                            <div class="photo-header">
                                                <span class="label">BEFORE</span>
                                                <span class="date">${view.beforeDate}</span>
                                            </div>
                                            <div class="photo-container">
                                                ${before ? `<img src="${before.image_url}" />` : '<div class="no-photo">No photo available</div>'}
                                            </div>
                                            <div class="photo-footer">
                                                <p><strong>By:</strong> ${before?.taken_by || '—'}</p>
                                                <p><strong>Notes:</strong> ${before?.notes || '—'}</p>
                                            </div>
                                        </div>
                                        <div class="photo-card">
                                            <div class="photo-header">
                                                <span class="label green">AFTER</span>
                                                <span class="date">${view.afterDate}</span>
                                            </div>
                                            <div class="photo-container">
                                                ${after ? `<img src="${after.image_url}" />` : '<div class="no-photo">No photo available</div>'}
                                            </div>
                                            <div class="photo-footer">
                                                <p><strong>By:</strong> ${after?.taken_by || '—'}</p>
                                                <p><strong>Notes:</strong> ${after?.notes || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            html += `</div>`;
            return html;
        }).join('');

        return `
            <div id="buildsphere-pdf-wrapper">
                <style>
                    #buildsphere-pdf-wrapper { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; background: white; width: 100%; box-sizing: border-box; }
                    #buildsphere-pdf-wrapper .report-header { background: #f8fafc; padding: 40px; border-bottom: 2px solid #e2e8f0; margin-bottom: 40px; }
                    #buildsphere-pdf-wrapper h1 { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: -1px; }
                    #buildsphere-pdf-wrapper .meta { color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.2em; }
                    
                    #buildsphere-pdf-wrapper .content { padding: 0 40px 40px 40px; }
                    #buildsphere-pdf-wrapper .project-container { margin-bottom: 60px; page-break-after: always; clear: both; }
                    #buildsphere-pdf-wrapper .project-container:last-child { page-break-after: auto; }
                    
                    #buildsphere-pdf-wrapper .project-header { display: flex; align-items: center; margin-bottom: 30px; }
                    #buildsphere-pdf-wrapper .marker { width: 8px; height: 35px; background: #4f46e5; border-radius: 4px; margin-right: 15px; display: inline-block; }
                    #buildsphere-pdf-wrapper .project-name { font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; color: #0f172a; display: inline-block; vertical-align: middle; }
                    
                    #buildsphere-pdf-wrapper .section { margin-bottom: 40px; page-break-inside: avoid; }
                    #buildsphere-pdf-wrapper .section-title { font-size: 14px; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px; }
                    
                    #buildsphere-pdf-wrapper .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    #buildsphere-pdf-wrapper .data-table th { background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; text-align: left; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; }
                    #buildsphere-pdf-wrapper .data-table td { padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
                    #buildsphere-pdf-wrapper .highlight-green { color: #10b981; font-weight: 900; font-size: 16px; }
                    #buildsphere-pdf-wrapper .empty { text-align: center; color: #94a3b8; font-style: italic; padding: 30px; }
                    
                    #buildsphere-pdf-wrapper .comparison-row { margin-bottom: 30px; page-break-inside: avoid; }
                    #buildsphere-pdf-wrapper .comparison-label { font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px; }
                    #buildsphere-pdf-wrapper .photo-grid { display: block; overflow: hidden; }
                    #buildsphere-pdf-wrapper .photo-card { float: left; width: 48%; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background: #fff; margin-right: 2%; margin-bottom: 20px; box-sizing: border-box; }
                    #buildsphere-pdf-wrapper .photo-card:nth-child(even) { margin-right: 0; }
                    #buildsphere-pdf-wrapper .photo-header { background: #f8fafc; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
                    #buildsphere-pdf-wrapper .photo-header .label { font-size: 10px; font-weight: 900; color: #4f46e5; }
                    #buildsphere-pdf-wrapper .photo-header .label.green { color: #10b981; }
                    #buildsphere-pdf-wrapper .photo-header .date { font-size: 10px; font-weight: bold; color: #94a3b8; float: right; }
                    #buildsphere-pdf-wrapper .photo-container { width: 100%; height: 220px; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                    #buildsphere-pdf-wrapper .photo-container img { width: 100%; height: 100%; object-fit: cover; }
                    #buildsphere-pdf-wrapper .no-photo { color: #cbd5e1; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 100px; text-align: center; }
                    #buildsphere-pdf-wrapper .photo-footer { padding: 15px 20px; clear: both; }
                    #buildsphere-pdf-wrapper .photo-footer p { margin: 0; font-size: 10px; color: #475569; }
                    #buildsphere-pdf-wrapper .photo-footer p strong { color: #1e293b; text-transform: uppercase; font-size: 9px; }
                </style>
                <div class="report-header">
                    <h1>BuildSphere Project Report</h1>
                    <div class="meta">${config.startDate} — ${config.endDate}</div>
                </div>
                <div class="content">
                    ${sections}
                </div>
            </div>
        `;
    }
}

module.exports = ReportExportService;
