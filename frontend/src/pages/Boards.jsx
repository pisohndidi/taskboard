import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Boards() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  async function loadBoards() {
    const { data } = await api.get('/boards');
    setBoards(data);
  }

  useEffect(() => {
    loadBoards();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/boards', { title });
      setTitle('');
      loadBoards();
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось создать доску');
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Мои доски</h1>
        <div>
          <span>{user?.name}</span>
          <button onClick={logout}>Выйти</button>
        </div>
      </header>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="Название новой доски"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit">Создать доску</button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="board-grid">
        {boards.map((b) => (
          <Link key={b.id} to={`/boards/${b.id}`} className="board-card">
            <h3>{b.title}</h3>
            <p>{b.my_role === 'owner' ? 'Владелец' : 'Участник'}</p>
          </Link>
        ))}
        {boards.length === 0 && <p>У вас пока нет досок — создайте первую выше.</p>}
      </div>
    </div>
  );
}
