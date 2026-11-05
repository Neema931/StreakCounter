import './Avatar.css';

export default function Avatar({ name = 'Friend', size = 'medium' }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className={`avatar avatar--${size}`} aria-label={name}>
      {initials || '?'}
    </span>
  );
}
