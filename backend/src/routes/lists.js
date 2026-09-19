const express = require('express');
const pool = require('../db/pool');
const { requireBoardMember } = require('../middleware/boardAccess');

const router = express.Router();

// PATCH /api/lists/:listId - rename or reposition a list
router.patch('/:listId', requireBoardMember, async (req, res, next) => {
  try {
    const { title, position } = req.body;
    const result = await pool.query(
      `UPDATE lists SET
         title = COALESCE($1, title),
         position = COALESCE($2, position)
       WHERE id = $3 RETURNING *`,
      [title, position, req.params.listId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/lists/:listId
router.delete('/:listId', requireBoardMember, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM lists WHERE id = $1', [req.params.listId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/lists/:listId/cards - create a card in a list
router.post('/:listId/cards', requireBoardMember, async (req, res, next) => {
  try {
    const { title, description, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'title обязателен' });

    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM cards WHERE list_id = $1',
      [req.params.listId]
    );
    const result = await pool.query(
      `INSERT INTO cards (list_id, title, description, due_date, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.listId, title, description || null, due_date || null, posResult.rows[0].next_pos, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
