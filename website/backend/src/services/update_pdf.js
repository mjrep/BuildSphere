const fs = require('fs');
const logoBase64 = fs.readFileSync('c:/Users/User/Documents/BuildSphere/website/frontend/src/assets/images/logo.png').toString('base64');
const content = fs.readFileSync('c:/Users/User/Documents/BuildSphere/website/backend/src/services/ReportExportService.js', 'utf8');

const progressStart = '            // PROGRESS SECTION';
const inventoryStart = '            // INVENTORY SECTION';

const newProgressSection = `
            // PROGRESS SECTION
            if (config.includeProgress) {
                const milestones = p.progress?.phases?.flatMap(phase => phase.milestones || []) || [];
                const tasks = p.completedTasks || [];
                const milestonesCompleted = p.progress?.phases?.reduce((acc, phase) => acc + (phase.milestones?.filter(m => m.progress_percentage === 100).length || 0), 0) || 0;
                const tasksCompleted = p.completedTasks?.filter(t => t.status === 'completed').length || 0;

                html += \`
                    <div class="section">
                        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
                            <div style="padding: 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; color: #0f172a;">
                                PROGRESS ANALYSIS REPORT
                            </div>
                            
                            <div style="background: #f8fafc; color: #706BFF; padding: 12px 20px; font-weight: 900; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">
                                MILESTONES
                            </div>
                            
                            <table class="data-table" style="margin-bottom: 0; border: none;">
                                <thead style="background: transparent;">
                                    <tr>
                                        <th style="border: none; border-bottom: 1px solid #e2e8f0; color: #94a3b8; font-weight: 900; font-size: 10px; padding: 16px 20px; text-transform: uppercase;">Milestone Name</th>
                                        <th style="border: none; border-bottom: 1px solid #e2e8f0; color: #94a3b8; font-weight: 900; font-size: 10px; padding: 16px 20px; text-transform: uppercase; text-align: center;">Progress</th>
                                        <th style="border: none; border-bottom: 1px solid #e2e8f0; color: #94a3b8; font-weight: 900; font-size: 10px; padding: 16px 20px; text-transform: uppercase; text-align: center;">Status</th>
                                        <th style="border: none; border-bottom: 1px solid #e2e8f0; color: #94a3b8; font-weight: 900; font-size: 10px; padding: 16px 20px; text-transform: uppercase; text-align: right;">Date Finished</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${milestones.length > 0 
                                        ? milestones.map(m => {
                                            const milestoneTasks = tasks.filter(t => t.milestone_id === m.id);
                                            const isDone = m.progress_percentage === 100;
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
                                            });
                                            return rows;
                                        }).join('') 
                                        : '<tr><td colspan="4" style="text-align: center; color: #94a3b8; font-style: italic; padding: 30px; border: none;">No milestones found.</td></tr>'
                                    }
                                </tbody>
                            </table>
                            
                            <div style="background: #f8fafc; color: #706BFF; padding: 12px 20px; font-weight: 900; font-size: 10px; text-transform: uppercase; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                                SUMMARY
                            </div>
                            <table class="data-table" style="margin-bottom: 0; border: none;">
                                <thead>
                                    <tr>
                                        <th style="border: none; color: #94a3b8; font-weight: 900; font-size: 10px; padding: 16px 20px; text-transform: uppercase; text-align: left;">Milestones Completed</th>
                                        <th style="border: none; color: #94a3b8; font-weight: 900; font-size: 10px; padding: 16px 20px; text-transform: uppercase; text-align: center;">Tasks Completed</th>
                                        <th style="border: none; color: #94a3b8; font-weight: 900; font-size: 10px; padding: 16px 20px; text-transform: uppercase; text-align: right;">Overall Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="border: none; padding: 20px; text-align: left; font-size: 18px; font-weight: 900; color: #0f172a;">\${milestonesCompleted}</td>
                                        <td style="border: none; padding: 20px; text-align: center; font-size: 18px; font-weight: 900; color: #0f172a;">\${tasksCompleted}</td>
                                        <td style="border: none; padding: 20px; text-align: right; font-size: 18px; font-weight: 900; color: #10b981;">\${p.progress?.project_progress || 0}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                \`;
            }
`;

let newContent = content.substring(0, content.indexOf(progressStart)) + newProgressSection + content.substring(content.indexOf(inventoryStart));

const wrapperStart = '        return `';
const htmlReturnStart = newContent.indexOf(wrapperStart) + wrapperStart.length;

const wrapperEnd = '        `;';
const htmlReturnEnd = newContent.lastIndexOf(wrapperEnd);

const newHtmlWrapper = `
            <div id="buildsphere-pdf-wrapper">
                <style>
                    #buildsphere-pdf-wrapper { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; background: white; width: 100%; box-sizing: border-box; }
                    #buildsphere-pdf-wrapper .content { padding: 0 40px 40px 40px; }
                    #buildsphere-pdf-wrapper .project-container { margin-bottom: 60px; page-break-after: always; clear: both; }
                    #buildsphere-pdf-wrapper .project-container:last-child { page-break-after: auto; }
                    
                    #buildsphere-pdf-wrapper .project-header { display: flex; align-items: center; margin-bottom: 30px; }
                    #buildsphere-pdf-wrapper .marker { width: 8px; height: 35px; background: #706BFF; border-radius: 4px; margin-right: 15px; display: inline-block; }
                    #buildsphere-pdf-wrapper .project-name { font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; color: #0f172a; display: inline-block; vertical-align: middle; }
                    
                    #buildsphere-pdf-wrapper .section { margin-bottom: 40px; page-break-inside: avoid; }
                    #buildsphere-pdf-wrapper .section-title { font-size: 14px; font-weight: 900; color: #706BFF; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px; }
                    
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
                    #buildsphere-pdf-wrapper .photo-header .label { font-size: 10px; font-weight: 900; color: #706BFF; }
                    #buildsphere-pdf-wrapper .photo-header .label.green { color: #10b981; }
                    #buildsphere-pdf-wrapper .photo-header .date { font-size: 10px; font-weight: bold; color: #94a3b8; float: right; }
                    #buildsphere-pdf-wrapper .photo-container { width: 100%; height: 220px; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                    #buildsphere-pdf-wrapper .photo-container img { width: 100%; height: 100%; object-fit: cover; }
                    #buildsphere-pdf-wrapper .no-photo { color: #cbd5e1; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 100px; text-align: center; }
                    #buildsphere-pdf-wrapper .photo-footer { padding: 15px 20px; clear: both; }
                    #buildsphere-pdf-wrapper .photo-footer p { margin: 0; font-size: 10px; color: #475569; }
                    #buildsphere-pdf-wrapper .photo-footer p strong { color: #1e293b; text-transform: uppercase; font-size: 9px; }
                </style>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; padding: 15px 0 15px 40px;">
                    <div style="display: flex; align-items: center;">
                        <img src="data:image/png;base64,\${logoBase64}" style="height: 40px; margin-right: 12px;" />
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
                </div>
                <div class="content">
                    \${sections}
                </div>
            </div>
`;

newContent = newContent.substring(0, htmlReturnStart) + '\n' + newHtmlWrapper + newContent.substring(htmlReturnEnd);

fs.writeFileSync('c:/Users/User/Documents/BuildSphere/website/backend/src/services/ReportExportService.js', newContent);
console.log('Successfully updated ReportExportService.js');
