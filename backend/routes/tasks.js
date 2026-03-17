const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /tasks?userId=xxx
router.get('/', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /tasks
router.post('/', async (req, res) => {
  const {
    title,
    project,
    due_date,
    status,
    priority,
    user_id,
    description,
    assigned_to,
    phase,
    milestone,
    start_date,
  } = req.body;

  if (!title || !project || !due_date || !user_id) {
    return res.status(400).json({ error: 'Title, project, due date, and user ID are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, project, due_date, status, priority, user_id, description, assigned_to, phase, milestone, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        title,
        project,
        due_date,
        status || 'pending',
        priority || 'medium',
        user_id,
        description,
        assigned_to,
        phase,
        milestone,
        start_date,
      ]
    );
    const task = result.rows[0];

    // Create notification
    await pool.query(
      'INSERT INTO notifications (type, title, message, time, user_id) VALUES ($1, $2, $3, $4, $5)',
      [
        'update',
        'Task Assignment',
        `New task assigned: '${title}' due ${due_date}.`,
        'Just now',
        user_id,
      ]
    );

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

module.exports = router;
