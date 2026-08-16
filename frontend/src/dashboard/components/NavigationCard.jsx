import { Chip } from "../../components/ui/primitives.jsx";

export function NavigationCard({ icon, label, description, badge, onClick }) {
  return (
    <button type="button" className="pcgo-command-card" onClick={onClick}>
      <span className="pcgo-command-card__icon" aria-hidden="true">{icon}</span>
      <span className="pcgo-command-card__body">
        <span className="pcgo-command-card__label">{label}</span>
        {description && <span className="pcgo-command-card__description">{description}</span>}
      </span>
      <span className="pcgo-command-card__tail">
        {badge != null && <Chip tone="blue">{badge}</Chip>}
        <span className="pcgo-command-card__arrow" aria-hidden="true">↗</span>
      </span>
    </button>
  );
}
