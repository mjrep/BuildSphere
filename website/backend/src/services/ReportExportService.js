const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

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
     * Generates a multi-sheet Excel workbook using ExcelJS.
     */
    static async generateExcel(reportData, config) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BuildSphere';
        workbook.created = new Date();

        // 1. SUMMARY SHEET
        const summarySheet = workbook.addWorksheet('Progress Summary');
        summarySheet.columns = [
            { header: 'Project Name', key: 'name', width: 40 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Progress %', key: 'progress', width: 15 },
            { header: 'Completed Tasks', key: 'tasks', width: 20 },
            { header: 'Date Range', key: 'range', width: 30 }
        ];

        // Style header
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

        // 2. INVENTORY SHEET
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

        // 3. ACCOMPLISHMENTS SHEET
        const accSheet = workbook.addWorksheet('Accomplishments');
        accSheet.columns = [
            { header: 'Project', key: 'project', width: 30 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Notes', key: 'notes', width: 60 },
            { header: 'Reported By', key: 'by', width: 20 }
        ];
        accSheet.getRow(1).font = { bold: true };
        accSheet.views = [{ state: 'frozen', ySplit: 1 }];

        reportData.forEach(p => {
            (p.accomplishments || []).forEach(acc => {
                accSheet.addRow({
                    project: p.name,
                    date: acc.date,
                    notes: acc.notes,
                    by: acc.taken_by
                });
            });
        });

        return await workbook.xlsx.writeBuffer();
    }

    static generateReportHTML(reportData, config) {
        const rows = reportData.map(p => `
            <div style="margin-bottom: 40px; page-break-inside: avoid;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                    <div style="width: 8px; height: 30px; background: #4f46e5; border-radius: 4px;"></div>
                    <h2 style="font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase;">${p.name}</h2>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead style="background: #f8fafc;">
                        <tr>
                            <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Project Status</th>
                            <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">Tasks Completed</th>
                            <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">Overall Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.progress?.project_progress === 100 ? 'Completed' : 'Ongoing'}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${p.completedTasks?.length || 0}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #10b981; font-weight: bold;">${p.progress?.project_progress || 0}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; }
                    h1 { font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 8px; }
                    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 40px; }
                    .meta { color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BuildSphere Project Report</h1>
                    <div class="meta">${config.startDate} — ${config.endDate}</div>
                </div>
                ${rows}
            </body>
            </html>
        `;
    }
}

module.exports = ReportExportService;
