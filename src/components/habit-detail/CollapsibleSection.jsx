import './CollapsibleSection.css';

export default function CollapsibleSection({ title, children }) {
  return (
    <details className="habit-detail-section" open>
      <summary>
        <span>{title}</span>
        <span className="habit-detail-section__chevron" aria-hidden="true">⌄</span>
      </summary>
      {children}
    </details>
  );
}
