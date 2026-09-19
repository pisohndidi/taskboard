const express = require('express');
const cors = require('cors');

const { requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/boards', requireAuth, boardRoutes);
app.use('/api/lists', requireAuth, listRoutes);
app.use('/api/cards', requireAuth, cardRoutes);

// 404 handler
app.use('/api', (req, res) => res.status(404).json({ error: 'Не найдено' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

module.exports = app;
