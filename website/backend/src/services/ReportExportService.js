const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const axios = require('axios');

class ReportExportService {
    /**
     * Generates a high-quality PDF report using Puppeteer.
     */
    static async generatePDF(reportData, config) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            const htmlContent = this.generateReportHTML(reportData, config);
            
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' },
                displayHeaderFooter: true,
                headerTemplate: '<span></span>',
                footerTemplate: '<div style="font-size: 10px; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
            });

            return pdfBuffer;
        } finally {
            if (browser) await browser.close();
        }
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

        // 1. SUMMARY SHEET
        if (config.includeProgress) {
            const summarySheet = workbook.addWorksheet('Progress Summary');
            summarySheet.columns = [
                { header: 'Project Name', key: 'name', width: 40 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Progress %', key: 'progress', width: 15 },
                { header: 'Completed Tasks', key: 'tasks', width: 20 },
                { header: 'Date Range', key: 'range', width: 30 }
            ];

            summarySheet.getRow(1).font = { bold: true };
            summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

            reportData.forEach(p => {
                summarySheet.addRow({
                    name: p.name,
                    status: p.progress?.project_progress === 100 ? 'Completed' : 'Ongoing',
                    progress: `${p.progress?.project_progress || 0}%`,
                    tasks: p.completedTasks?.length || 0,
                    range: `${config.startDate} to ${config.endDate}`
                });
            });
        }

        // 2. INVENTORY SHEET
        if (config.includeInventory) {
            const invSheet = workbook.addWorksheet('Inventory');
            invSheet.columns = [
                { header: 'Project', key: 'project', width: 30 },
                { header: 'Item Name', key: 'item', width: 30 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Stock', key: 'stock', width: 12 },
                { header: 'Price', key: 'price', width: 15 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            invSheet.getRow(1).font = { bold: true };
            invSheet.views = [{ state: 'frozen', ySplit: 1 }];

            reportData.forEach(p => {
                (p.inventory || []).forEach(item => {
                    invSheet.addRow({
                        project: p.name,
                        item: item.item,
                        category: item.category,
                        stock: item.stock,
                        price: item.price,
                        status: item.status
                    });
                });
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
                    const before = p.accomplishments.find(a => a.date === view.beforeDate);
                    const after = p.accomplishments.find(a => a.date === view.afterDate);

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
                html += `
                    <div class="section">
                        <h3 class="section-title">Progress Analysis</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Tasks Completed</th>
                                    <th>Overall Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${p.progress?.project_progress === 100 ? 'Completed' : 'Ongoing'}</td>
                                    <td>${p.completedTasks?.length || 0}</td>
                                    <td class="highlight-green">${p.progress?.project_progress || 0}%</td>
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
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${p.inventory.length === 0 ? '<tr><td colspan="5" class="empty">No inventory data</td></tr>' : 
                                    p.inventory.map(item => `
                                    <tr>
                                        <td>${item.item}</td>
                                        <td>${item.category}</td>
                                        <td>${item.stock}</td>
                                        <td>${item.price}</td>
                                        <td class="${item.status === 'In Stock' ? 'text-green' : 'text-red'}">${item.status}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
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
                            const before = p.accomplishments.find(a => a.date === view.beforeDate);
                            const after = p.accomplishments.find(a => a.date === view.afterDate);

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
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; background: white; }
                    .report-header { background: #f8fafc; padding: 40px; border-bottom: 2px solid #e2e8f0; margin-bottom: 40px; }
                    h1 { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: -1px; }
                    .meta { color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.2em; }
                    
                    .content { padding: 0 40px 40px 40px; }
                    .project-container { margin-bottom: 60px; page-break-after: always; }
                    .project-container:last-child { page-break-after: auto; }
                    
                    .project-header { display: flex; align-items: center; margin-bottom: 30px; }
                    .marker { width: 8px; height: 35px; background: #4f46e5; border-radius: 4px; margin-right: 15px; }
                    .project-name { font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; color: #0f172a; }
                    
                    .section { margin-bottom: 40px; page-break-inside: avoid; }
                    .section-title { font-size: 14px; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px; }
                    
                    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .data-table th { background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; text-align: left; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; }
                    .data-table td { padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
                    .highlight-green { color: #10b981; font-weight: 900; font-size: 16px; }
                    .text-green { color: #059669; font-weight: bold; }
                    .text-red { color: #dc2626; font-weight: bold; }
                    .empty { text-align: center; color: #94a3b8; font-style: italic; padding: 30px; }
                    
                    .comparison-row { margin-bottom: 30px; page-break-inside: avoid; }
                    .comparison-label { font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px; }
                    .photo-grid { display: flex; gap: 20px; }
                    .photo-card { flex: 1; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background: #fff; }
                    .photo-header { background: #f8fafc; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
                    .photo-header .label { font-size: 10px; font-weight: 900; color: #4f46e5; }
                    .photo-header .label.green { color: #10b981; }
                    .photo-header .date { font-size: 10px; font-weight: bold; color: #94a3b8; }
                    .photo-container { aspect-ratio: 16/9; background: #f8fafc; display: flex; items-center: center; justify-content: center; overflow: hidden; }
                    .photo-container img { width: 100%; height: 100%; object-cover: cover; }
                    .no-photo { color: #cbd5e1; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                    .photo-footer { padding: 15px 20px; }
                    .photo-footer p { margin: 0; font-size: 10px; color: #475569; }
                    .photo-footer p strong { color: #1e293b; text-transform: uppercase; font-size: 9px; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>BuildSphere Project Report</h1>
                    <div class="meta">${config.startDate} — ${config.endDate}</div>
                </div>
                <div class="content">
                    ${sections}
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = ReportExportService;
