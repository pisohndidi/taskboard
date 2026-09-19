const express = require('express');
const pool = require('../db/pool');
const { requireBoardMember } = require('../middleware/boardAccess');

const router = express.Router();

// GET /api/boards - boards the current user is a member of
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT b.*, bm.role AS my_role
       FROM boards b
       JOIN board_members bm ON bm.board_id = b.id
       WHERE bm.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/boards - create a board (creator becomes owner)
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title обязателен' });

    await client.query('BEGIN');
    const board = await client.query(
      'INSERT INTO boards (title, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description || null, req.user.id]
    );
    await client.query(
      'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)',
      [board.rows[0].id, req.user.id, 'owner']
    );
    // default lists, like a real Trello template
    await client.query(
      `INSERT INTO lists (board_id, title, position) VALUES
       ($1, 'To Do', 0), ($1, 'In Progress', 1), ($1, 'Done', 2)`,
      [board.rows[0].id]
    );
    await client.query('COMMIT');
    res.status(201).json(board.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/boards/:boardId - full board with lists, cards, labels, members
router.get('/:boardId', requireBoardMember, async (req, res, next) => {
  try {
    const boardId = req.boardId;

    const board = await pool.query('SELECT * FROM boards WHERE id = $1', [boardId]);
    const lists = await pool.query(
      'SELECT * FROM lists WHERE board_id = $1 ORDER BY position', [boardId]
    );
    const cards = await pool.query(
      `SELECT c.* FROM cards c JOIN lists l ON l.id = c.list_id
       WHERE l.board_id = $1 ORDER BY c.position`,
      [boardId]
    );
    const labels = await pool.query('SELECT * FROM labels WHERE board_id = $1', [boardId]);
    const cardLabels = await pool.query(
      `SELECT cl.* FROM card_labels cl
       JOIN cards c ON c.id = cl.card_id
       JOIN lists l ON l.id = c.list_id
       WHERE l.board_id = $1`,
      [boardId]
    );
    const members = await pool.query(
      `SELECT u.id, u.name, u.email, bm.role FROM board_members bm
       JOIN users u ON u.id = bm.user_id WHERE bm.board_id = $1`,
      [boardId]
    );

    res.json({
      board: board.rows[0],
      lists: lists.rows,
      cards: cards.rows,
      labels: labels.rows,
      cardLabels: cardLabels.rows,
      members: members.rows,
      myRole: req.boardRole,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/boards/:boardId/members - invite an existing user by email (owner only)
router.post('/:boardId/members', requireBoardMember, async (req, res, next) => {
  try {
    if (req.boardRole !== 'owner') {
      return res.status(403).json({ error: 'Только владелец доски может приглашать участников' });
    }
    const { email } = req.body;
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email?.toLowerCase()]);
    if (!user.rows[0]) return res.status(404).json({ error: 'Пользователь с таким email не найден' });

    await pool.query(
      `INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'member')
       ON CONFLICT (board_id, user_id) DO NOTHING`,
      [req.boardId, user.rows[0].id]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/boards/:boardId/labels
router.post('/:boardId/labels', requireBoardMember, async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name обязателен' });
    const result = await pool.query(
      'INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [req.boardId, name, color || '#999999']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/boards/:boardId/lists
router.post('/:boardId/lists', requireBoardMember, async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title обязателен' });
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM lists WHERE board_id = $1',
      [req.boardId]
    );
    const result = await pool.query(
      'INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [req.boardId, title, posResult.rows[0].next_pos]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
