import './StateViews.css';

/**
 * EmptyState — shared empty-result placeholder.
 *
 * Presentational only. Pass an optional icon node, a title, an optional hint,
 * and an optional action element (e.g. a button).
 */
export default function EmptyState({ icon = null, title, hint, action }) {
  return (
    <div className="state-view state-empty" role="status">
      {icon && (
        <div className="state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      {title && <p className="state-title">{title}</p>}
      {hint && <p className="state-hint">{hint}</p>}
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}
