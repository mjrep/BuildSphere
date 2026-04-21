const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
const authController = require('./controllers/AuthController');
const projectController = require('./controllers/ProjectController');
const dashboardController = require('./controllers/DashboardController');
const profileController = require('./controllers/ProfileController');
const clientController = require('./controllers/ClientController');
const projectApprovalController = require('./controllers/ProjectApprovalController');
const projectInventoryController = require('./controllers/ProjectInventoryController');
const taskController = require('./controllers/TaskController');
const taskCommentController = require('./controllers/TaskCommentController');
const { TaskAttachmentController, uploadMiddleware } = require('./controllers/TaskAttachmentController');
const { TaskProgressLogController, progressUploadMiddleware } = require('./controllers/TaskProgressLogController');

const authenticateToken = require('./middleware/auth');

// Auth Routes
app.post('/api/login', authController.login);
app.post('/api/register', authController.register);
app.post('/api/logout', authController.logout);
app.get('/api/users', authenticateToken, authController.index);

// Protected Core Routes
app.get('/api/dashboard/stats', authenticateToken, dashboardController.stats);
app.get('/api/auth/user', authenticateToken, profileController.show);
app.get('/api/profile/me', authenticateToken, profileController.show);
app.put('/api/profile/update', authenticateToken, profileController.update);

// Client Routes
app.get('/api/clients', authenticateToken, clientController.index);
app.post('/api/clients', authenticateToken, clientController.store);

// Project Routes
app.get('/api/project-statuses', authenticateToken, projectController.statuses);
app.get('/api/projects', authenticateToken, projectController.index);
app.post('/api/projects', authenticateToken, projectController.store);
app.get('/api/projects/statuses', authenticateToken, projectController.statuses);
app.get('/api/projects/phase-titles', authenticateToken, projectController.phaseTitles);
app.get('/api/projects/:id', authenticateToken, projectController.show);
app.put('/api/projects/:id', authenticateToken, projectController.update);
app.delete('/api/projects/:id', authenticateToken, projectController.destroy);
app.post('/api/projects/:id/team', authenticateToken, projectController.addTeamMember);

// Approvals
app.post('/api/projects/:project/accounting-approval', authenticateToken, projectApprovalController.accountingApproval);
app.post('/api/projects/:project/executive-approval', authenticateToken, projectApprovalController.executiveApproval);

// Inventory
app.get('/api/projects/:project/inventory', authenticateToken, projectInventoryController.index);
app.post('/api/projects/:project/inventory', authenticateToken, projectInventoryController.store);
app.put('/api/projects/:project/inventory/:item', authenticateToken, projectInventoryController.update);
app.patch('/api/projects/:project/inventory/:item/stock', authenticateToken, projectInventoryController.updateStock);
app.delete('/api/projects/:project/inventory/:item', authenticateToken, projectInventoryController.destroy);

// Project Milestone Routes
app.get('/api/projects/:id/milestones', authenticateToken, projectController.getMilestones);
app.get('/api/projects/:id/milestone-plan', authenticateToken, projectController.getMilestonePlan);
app.post('/api/projects/:id/milestone-plan', authenticateToken, projectController.storeMilestonePlan);
app.get('/api/projects/:id/milestone-chart', authenticateToken, projectController.getMilestoneChart);
app.post('/api/projects/:id/milestone-submit', authenticateToken, projectController.submitMilestoneReview);

// Task Routes
app.get('/api/tasks/meta', authenticateToken, taskController.meta);
app.get('/api/tasks', authenticateToken, taskController.index);
app.post('/api/tasks', authenticateToken, taskController.store);
app.get('/api/tasks/:task', authenticateToken, taskController.show);
app.put('/api/tasks/:task', authenticateToken, taskController.update);
app.patch('/api/tasks/:task/status', authenticateToken, taskController.updateStatus);
app.delete('/api/tasks/:task', authenticateToken, taskController.destroy);

// Task Modules
app.get('/api/tasks/:task/comments', authenticateToken, taskCommentController.index);
app.post('/api/tasks/:task/comments', authenticateToken, taskCommentController.store);

app.get('/api/tasks/:task/attachments', authenticateToken, TaskAttachmentController.index);
app.post('/api/tasks/:task/attachments', authenticateToken, uploadMiddleware, TaskAttachmentController.store);
app.get('/api/tasks/:task/attachments/:attachment/download', authenticateToken, TaskAttachmentController.download);

app.get('/api/projects/:project/progress-logs', authenticateToken, TaskProgressLogController.index);
app.post('/api/task-progress-logs', authenticateToken, progressUploadMiddleware, TaskProgressLogController.store);
app.patch('/api/progress-logs/:id', authenticateToken, TaskProgressLogController.update);

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
