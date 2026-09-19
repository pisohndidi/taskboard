const pool = require('../db/pool');

// Ensures req.user is a member (owner or member) of the board given by :boardId
// or of the board that the given list/card belongs to. Attaches req.boardRole.
async function requireBoardMember(req, res, next) {
  try {
    let boardId = req.params.boardId;

    if (!boardId && req.params.listId) {
      const r = await pool.query('SELECT board_id FROM lists WHERE id = $1', [req.params.listId]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Список не найден' });
      boardId = r.rows[0].board_id;
    }

    if (!boardId && req.params.cardId) {
      const r = await pool.query(
        `SELECT l.board_id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = $1`,
        [req.params.cardId]
      );
      if (!r.rows[0]) return res.status(404).json({ error: 'Карточка не найдена' });
      boardId = r.rows[0].board_id;
    }

    const member = await pool.query(
      'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, req.user.id]
    );

    if (!member.rows[0]) {
      return res.status(403).json({ error: 'Нет доступа к этой доске' });
    }

    req.boardId = Number(boardId);
    req.boardRole = member.rows[0].role;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireBoardMember };
