import { useEffect, useState } from 'react';
import api from '../api';

export default function CardModal({ card, labels, cardLabels, onClose, onChanged }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [description, setDescription] = useState(card.description || '');

  useEffect(() => {
    api.get(`/cards/${card.id}/comments`).then((res) => setComments(res.data));
  }, [card.id]);

  async function addComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const { data } = await api.post(`/cards/${card.id}/comments`, { text });
    setComments([...comments, data]);
    setText('');
  }

  async function saveDescription() {
    await api.patch(`/cards/${card.id}`, { description });
    onChanged();
  }

  async function toggleLabel(labelId) {
    const attached = cardLabels.some((cl) => cl.card_id === card.id && cl.label_id === labelId);
    if (attached) {
      await api.delete(`/cards/${card.id}/labels/${labelId}`);
    } else {
      await api.post(`/cards/${card.id}/labels`, { label_id: labelId });
    }
    onChanged();
  }

  async function deleteCard() {
    if (!window.confirm('Удалить карточку?')) return;
    await api.delete(`/cards/${card.id}`);
    onChanged();
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{card.title}</h2>

        <div className="labels-row">
          {labels.map((l) => {
            const active = cardLabels.some((cl) => cl.card_id === card.id && cl.label_id === l.id);
            return (
              <button
                key={l.id}
                className={`label-chip ${active ? 'active' : ''}`}
                style={{ backgroundColor: l.color }}
                onClick={() => toggleLabel(l.id)}
              >
                {l.name}
              </button>
            );
          })}
        </div>

        <label>
          Описание
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            rows={4}
          />
        </label>

        <h3>Комментарии</h3>
        <ul className="comments-list">
          {comments.map((c) => (
            <li key={c.id}>
              <strong>{c.author_name}:</strong> {c.text}
            </li>
          ))}
        </ul>
        <form className="inline-form" onSubmit={addComment}>
          <input
            placeholder="Написать комментарий..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit">Отправить</button>
        </form>

        <div className="modal-actions">
          <button onClick={deleteCard} className="danger">Удалить карточку</button>
          <button onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
