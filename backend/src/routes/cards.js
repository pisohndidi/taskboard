const express = require('express');
const pool = require('../db/pool');
const { requireBoardMember } = require('../middleware/boardAccess');

const router = express.Router();

// PATCH /api/cards/:cardId - edit fields and/or move to another list/position
router.patch('/:cardId', requireBoardMember, async (req, res, next) => {
  try {
    const { title, description, due_date, list_id, position } = req.body;
    const result = await pool.query(
      `UPDATE cards SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date = COALESCE($3, due_date),
         list_id = COALESCE($4, list_id),
         position = COALESCE($5, position),
         updated_at = now()
       WHERE id = $6 RETURNING *`,
      [title, description, due_date, list_id, position, req.params.cardId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Карточка не найдена' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cards/:cardId
router.delete('/:cardId', requireBoardMember, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = $1', [req.params.cardId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/cards/:cardId/comments
router.get('/:cardId/comments', requireBoardMember, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS author_name FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.card_id = $1 ORDER BY c.created_at ASC`,
      [req.params.cardId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/cards/:cardId/comments
router.post('/:cardId/comments', requireBoardMember, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text обязателен' });
    const result = await pool.query(
      'INSERT INTO comments (card_id, user_id, text) VALUES ($1, $2, $3) RETURNING *',
      [req.params.cardId, req.user.id, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/cards/:cardId/labels - attach a label
router.post('/:cardId/labels', requireBoardMember, async (req, res, next) => {
  try {
    const { label_id } = req.body;
    await pool.query(
      `INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.params.cardId, label_id]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cards/:cardId/labels/:labelId
router.delete('/:cardId/labels/:labelId', requireBoardMember, async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2',
      [req.params.cardId, req.params.labelId]
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
