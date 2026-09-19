import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import CardModal from '../components/CardModal';

export default function BoardDetail() {
  const { boardId } = useParams();
  const [data, setData] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState({});
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get(`/boards/${boardId}`);
    setData(data);
  }

  useEffect(() => {
    load();
  }, [boardId]);

  if (!data) return <p className="page">Загрузка...</p>;

  const { board, lists, cards, labels, cardLabels, members, myRole } = data;

  async function addCard(listId) {
    const title = newCardTitle[listId];
    if (!title?.trim()) return;
    await api.post(`/lists/${listId}/cards`, { title });
    setNewCardTitle({ ...newCardTitle, [listId]: '' });
    load();
  }

  async function addList(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await api.post(`/boards/${boardId}/lists`, { title: newListTitle });
    setNewListTitle('');
    load();
  }

  async function moveCard(card, direction) {
    const idx = lists.findIndex((l) => l.id === card.list_id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= lists.length) return;
    await api.patch(`/cards/${card.id}`, { list_id: lists[targetIdx].id });
    load();
  }

  async function invite(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/boards/${boardId}/members`, { email: inviteEmail });
      setInviteEmail('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось пригласить участника');
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to="/boards">&larr; Все доски</Link>
          <h1>{board.title}</h1>
        </div>
      </header>

      {myRole === 'owner' && (
        <form className="inline-form" onSubmit={invite}>
          <input
            placeholder="Email участника для приглашения"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button type="submit">Пригласить</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      <p className="members-line">
        Участники: {members.map((m) => m.name).join(', ')}
      </p>

      <div className="board-columns">
        {lists.map((list) => (
          <div key={list.id} className="list-column">
            <h3>{list.title}</h3>
            <div className="card-list">
              {cards
                .filter((c) => c.list_id === list.id)
                .map((card) => (
                  <div key={card.id} className="card-item" onClick={() => setSelectedCard(card)}>
                    <div className="card-title">{card.title}</div>
                    <div className="card-labels">
                      {cardLabels
                        .filter((cl) => cl.card_id === card.id)
                        .map((cl) => {
                          const label = labels.find((l) => l.id === cl.label_id);
                          return label ? (
                            <span
                              key={label.id}
                              className="label-dot"
                              style={{ backgroundColor: label.color }}
                              title={label.name}
                            />
                          ) : null;
                        })}
                    </div>
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => moveCard(card, -1)} title="Влево">←</button>
                      <button onClick={() => moveCard(card, 1)} title="Вправо">→</button>
                    </div>
                  </div>
                ))}
            </div>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                addCard(list.id);
              }}
            >
              <input
                placeholder="Новая карточка..."
                value={newCardTitle[list.id] || ''}
                onChange={(e) => setNewCardTitle({ ...newCardTitle, [list.id]: e.target.value })}
              />
              <button type="submit">+</button>
            </form>
          </div>
        ))}

        <form className="list-column new-list-form" onSubmit={addList}>
          <input
            placeholder="Название нового списка"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
          />
          <button type="submit">Добавить список</button>
        </form>
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          labels={labels}
          cardLabels={cardLabels}
          onClose={() => setSelectedCard(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
