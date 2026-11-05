import { useEffect, useState } from 'react';
import { getLocalDate } from '../../utils/streaks.js';
import './ArticlesGrid.css';

const TIPS = [
  'Start with one small action. Showing up is the win.',
  'Make your next step easy to see and easy to begin.',
  'A steady routine can grow one kind choice at a time.',
];

export default function ArticlesGrid({ habitName, content }) {
  const [article, setArticle] = useState(null);
  const [year, month, day] = getLocalDate().split('-').map(Number);
  const dayIndex = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) % TIPS.length;
  const articles = content.articles ?? [];

  useEffect(() => {
    if (!article) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') setArticle(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [article]);

  return (
    <section className="habit-panel habit-articles" aria-labelledby="habit-articles-title">
      <div className="habit-articles__tip">
        <span aria-hidden="true">✦</span>
        <div><small>DAILY TIP</small><p>{TIPS[dayIndex]} {content.tip}</p></div>
      </div>
      <div className="habit-panel__heading">
        <div><p className="habit-detail-eyebrow">KEEP LEARNING</p><h2 id="habit-articles-title">Tips for {habitName.toLowerCase()}</h2></div>
      </div>
      <div className="habit-articles__grid">
        {articles.map((item) => (
          <article className="habit-article-card" key={item.id}>
            <div className="habit-article-card__thumb" aria-hidden="true">{item.thumbnail}</div>
            <span className="habit-article-card__category">{item.category}</span>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <div><small>{item.readMinutes} min read</small><button type="button" onClick={() => setArticle(item)}>Read more <span aria-hidden="true">→</span></button></div>
          </article>
        ))}
      </div>
      {article && (
        <div className="habit-article-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setArticle(null);
        }}>
          <section className="habit-article-modal" role="dialog" aria-modal="true" aria-labelledby="habit-article-modal-title">
            <button type="button" className="habit-article-modal__close" aria-label="Close article" onClick={() => setArticle(null)}>×</button>
            <span className="habit-article-modal__thumb" aria-hidden="true">{article.thumbnail}</span>
            <p className="habit-detail-eyebrow">{article.category} · {article.readMinutes} MIN READ</p>
            <h2 id="habit-article-modal-title">{article.title}</h2>
            <p>{article.summary}</p>
            <p>Try one idea that feels right for you today. Keep your plan gentle and realistic, and adjust it as you learn what works in your routine.</p>
            <button className="habit-article-modal__done" type="button" onClick={() => setArticle(null)}>Back to my habit</button>
          </section>
        </div>
      )}
    </section>
  );
}
