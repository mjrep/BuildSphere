const fs = require('fs');
let content = fs.readFileSync('c:/Users/User/Documents/BuildSphere/website/backend/src/services/ReportExportService.js', 'utf8');

// 1. Upgrade Progress Analysis Section
const oldProgressStart = `<tr>
                                    <th>Milestone Name</th>
                                    <th>Progress</th>
                                    <th>Date Finished / Status</th>
                                </tr>
                            </thead>
                            <tbody>`;
const newProgressStart = `<tr style='background: #f8fafc;'>
                                    <th style='padding: 12px 20px; text-align: left; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;'>Milestone Name</th>
                                    <th style='padding: 12px 20px; text-align: center; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;'>Progress</th>
                                    <th style='padding: 12px 20px; text-align: center; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;'>Status</th>
                                    <th style='padding: 12px 20px; text-align: right; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;'>Date Finished</th>
                                </tr>
                            </thead>
                            <tbody>`;
content = content.replace(oldProgressStart, newProgressStart);

const oldProgressRow = `let rows = \`
                                            <tr>
                                                <td style="font-weight: bold;">\${m.milestone_name}</td>
                                                <td style="text-align: center;">\${m.progress_percentage || 0}%</td>
                                                <td>\${m.progress_percentage === 100 ? m.updated_at?.split('T')[0] || 'Completed' : '—'}</td>
                                            </tr>
                                        \`;
                                        milestoneTasks.forEach(t => {
                                            rows += \`
                                                <tr>
                                                    <td style="padding-left: 20px; color: #64748b;">&#8226; \${t.title}</td>
                                                    <td style="text-align: center; color: #64748b;"></td>
                                                    <td style="color: #64748b;">\${t.status === 'completed' ? (t.date || 'Completed') : '—'}</td>
                                                </tr>
                                            \`;
                                        });`;

const newProgressRow = `const isDone = m.progress_percentage === 100;
                                        let rows = "<tr style='border-bottom: 1px solid #f1f5f9;'>" +
                                            "<td style='padding: 16px 20px; font-weight: 900; color: #1e293b; border: none; font-size: 11px;'>" + m.milestone_name + "</td>" +
                                            "<td style='padding: 16px 20px; text-align: center; font-weight: 600; color: #475569; border: none; font-size: 11px;'>" + (m.progress_percentage || 0) + "%</td>" +
                                            "<td style='padding: 16px 20px; text-align: center; border: none;'>" + 
                                                (isDone ? "<span style='background: #ecfdf5; color: #10b981; padding: 4px 10px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase;'>COMPLETED</span>"
                                                        : "<span style='background: #fff7ed; color: #f97316; padding: 4px 10px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase;'>ONGOING</span>") +
                                            "</td>" +
                                            "<td style='padding: 16px 20px; text-align: right; color: #94a3b8; border: none; font-size: 11px;'>" + (isDone ? (m.updated_at?.split('T')[0] || 'Completed') : '—') + "</td>" +
                                            "</tr>";
                                        milestoneTasks.forEach(t => {
                                            const taskDone = t.status === 'completed';
                                            rows += "<tr style='border-bottom: 1px solid #f8fafc;'>" +
                                                "<td style='padding: 12px 20px 12px 40px; color: #64748b; border: none; font-size: 11px;'><span style='color: #cbd5e1; margin-right: 8px;'>•</span>" + t.title + "</td>" +
                                                "<td style='border: none;'></td>" +
                                                "<td style='padding: 12px 20px; text-align: center; border: none;'>" +
                                                    (taskDone ? "<span style='background: #ecfdf5; color: #10b981; padding: 4px 10px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase;'>COMPLETED</span>"
                                                              : "<span style='background: #fff7ed; color: #f97316; padding: 4px 10px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase;'>ONGOING</span>") +
                                                "</td>" +
                                                "<td style='padding: 12px 20px; text-align: right; color: #94a3b8; border: none; font-size: 11px;'>" + (taskDone ? (t.date || 'Completed') : '—') + "</td>" +
                                                "</tr>";
                                        });`;

content = content.replace(oldProgressRow, newProgressRow);

const oldEmptyRow = `'<tr><td colspan="3" class="empty">No milestones found.</td></tr>'`;
const newEmptyRow = `'<tr><td colspan="4" class="empty">No milestones found.</td></tr>'`;
content = content.replace(oldEmptyRow, newEmptyRow);

// 2. Fix the wrapper header to use the actual URL and fix the styling
const oldHeader = `<div class="report-header">
                    <h1>BuildSphere Project Report</h1>
                    <div class="meta">\${config.startDate} — \${config.endDate}</div>
                </div>`;
const newHeader = `<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; padding: 15px 0 15px 40px;">
                    <div style="display: flex; align-items: center;">
                        <img src="https://buildsphere.cityscapebuildersinc.com/assets/logo-BTc8iO0L.png" style="height: 40px; margin-right: 12px;" />
                        <div style="font-family: Arial, sans-serif;">
                            <div style="font-size: 20px; font-weight: 900; color: #000; line-height: 1; margin-bottom: 2px;">CITYSCAPE</div>
                            <div style="font-size: 12px; font-weight: bold; color: #000; letter-spacing: 1px;">BUILDERS INC.</div>
                        </div>
                    </div>
                    <div style="flex-grow: 1; margin-left: 40px; height: 35px; background: linear-gradient(to right, #091f5b 80%, #d81b1b 80%); clip-path: polygon(25px 0, 100% 0, 100% 100%, 0 100%);"></div>
                </div>
                <div style="padding: 0 40px; margin-bottom: 40px;">
                    <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: -1px;">PROJECT REPORT PREVIEW</h1>
                    <div style="color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.2em;">\${config.startDate} — \${config.endDate}</div>
                </div>`;
content = content.replace(oldHeader, newHeader);

// 3. Fix the page-break-inside: avoid issue so tables don't get sliced
content = content.replace('#buildsphere-pdf-wrapper .section { margin-bottom: 40px; page-break-inside: avoid; }', '#buildsphere-pdf-wrapper .section { margin-bottom: 40px; page-break-inside: auto; }');

// 4. Update the "Executive Summary" row inside Progress Analysis to span the new 4 columns
content = content.replace(
    `<th colspan="2" style="background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase;">Executive Summary</th>`,
    `<th colspan="4" style="background: #f1f5f9; color: #4f46e5; font-size: 11px; text-transform: uppercase;">Executive Summary</th>`
);

content = content.replace(
    `<td>\${milestonesCompleted}</td>`,
    `<td colspan="3" style="font-weight: 900;">\${milestonesCompleted}</td>`
);
content = content.replace(
    `<td>\${tasksCompleted}</td>`,
    `<td colspan="3" style="font-weight: 900;">\${tasksCompleted}</td>`
);
content = content.replace(
    `<td class="highlight-green" style="font-weight: bold;">\${p.progress?.project_progress || 0}%</td>`,
    `<td colspan="3" class="highlight-green" style="font-weight: 900;">\${p.progress?.project_progress || 0}%</td>`
);

fs.writeFileSync('c:/Users/User/Documents/BuildSphere/website/backend/src/services/ReportExportService.js', content);
console.log('Update Complete!');
