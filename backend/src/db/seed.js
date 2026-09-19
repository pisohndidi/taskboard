// Seeds a demo account + board so reviewers don't need to register themselves.
// Usage: node src/db/seed.js
const bcrypt = require('bcryptjs');
const pool = require('./pool');

const DEMO_EMAIL = 'demo@taskboard.dev';
const DEMO_PASSWORD = 'demo12345';

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const userResult = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Demo User', $1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [DEMO_EMAIL, hash]
  );
  const userId = userResult.rows[0].id;

  const boardResult = await pool.query(
    `INSERT INTO boards (title, description, owner_id)
     VALUES ('Демо-доска', 'Пример доски для проверки проекта', $1)
     RETURNING id`,
    [userId]
  );
  const boardId = boardResult.rows[0].id;

  await pool.query(
    `INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'owner')
     ON CONFLICT DO NOTHING`,
    [boardId, userId]
  );

  const listsResult = await pool.query(
    `INSERT INTO lists (board_id, title, position) VALUES
       ($1, 'To Do', 0), ($1, 'In Progress', 1), ($1, 'Done', 2)
     RETURNING id, title`,
    [boardId]
  );

  const todoList = listsResult.rows.find((l) => l.title === 'To Do');
  await pool.query(
    `INSERT INTO cards (list_id, title, description, position, created_by) VALUES
       ($1, 'Настроить проект', 'Инициализация backend и frontend', 0, $2),
       ($1, 'Написать README', 'Описание, стек, запуск, деплой', 1, $2)`,
    [todoList.id, userId]
  );

  await pool.query(
    `INSERT INTO labels (board_id, name, color) VALUES
       ($1, 'Важно', '#de350b'), ($1, 'Идея', '#00875a')`,
    [boardId]
  );

  console.log('Seed complete.');
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
