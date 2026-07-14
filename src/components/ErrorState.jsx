import './StateViews.css';

/**
 * ErrorState — shared error placeholder with an optional retry handler.
 */
export default function ErrorState({
  title = 'Something went wrong',
  hint = 'Please try again in a moment.',
  onRetry,
  retryLabel = 'Try again',
}) {
  return (
    <div className="state-view state-error" role="alert">
      <p className="state-title">{title}</p>
      {hint && <p className="state-hint">{hint}</p>}
      {onRetry && (
        <button type="button" className="state-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
