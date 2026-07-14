import { memo, useEffect, useRef, useState } from 'react';
import './DateSelector.css';

/** How many past days to show before today */
const PAST_DAYS = 4;
/** How many future days to show after today */
const FUTURE_DAYS = 4;

function buildDateList() {
  const list = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let offset = -PAST_DAYS; offset <= FUTURE_DAYS; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);

    let day;
    if (offset === -1) day = 'Yesterday';
    else if (offset === 0) day = 'Today';
    else if (offset === 1) day = 'Tomorrow';
    else day = d.toLocaleString('default', { weekday: 'short' });

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    list.push({
      offset,
      day,
      date: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
      dateStr: d.toDateString(),
      iso: `${y}-${m}-${dd}`, // local-day ISO (matches feedFilters.toLocalIsoDay)
      isToday: offset === 0,
    });
  }
  return list;
}

/**
 * Horizontal date slider that filters the feed by day.
 *
 * Controlled-friendly: emits the selected day object (or null for "All") via
 * onDateChange. Defaults to "All" so the feed is never hidden on first paint;
 * selecting a specific day applies a real client-side date filter.
 */
function DateSelector({ onDateChange, activeIso = null }) {
  const [dates] = useState(buildDateList);
  const scrollRef = useRef(null);
  const itemRefs = useRef([]);

  // Fully controlled: the active key is derived directly from the prop, so the
  // parent (App) is the single source of truth and no syncing effect is needed.
  const activeKey = activeIso || 'all';

  // Center the active item.
  useEffect(() => {
    const idx = activeKey === 'all' ? 0 : dates.findIndex((d) => d.iso === activeKey) + 1;
    const el = itemRefs.current[idx < 0 ? 0 : idx];
    const container = scrollRef.current;
    if (el && container) {
      container.scrollTo({
        left: el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [activeKey, dates]);

  const selectAll = () => onDateChange?.(null);
  const selectDay = (d) => onDateChange?.(d);

  return (
    <div className="date-selector" ref={scrollRef}>
      <button
        type="button"
        ref={(el) => (itemRefs.current[0] = el)}
        className={`date-pill date-all${activeKey === 'all' ? ' active' : ''}`}
        onClick={selectAll}
      >
        <span className="date-all-label">All</span>
      </button>

      {dates.map((d, i) => (
        <button
          type="button"
          key={d.iso}
          ref={(el) => (itemRefs.current[i + 1] = el)}
          className={`date-pill${activeKey === d.iso ? ' active' : ''}${d.isToday ? ' is-today' : ''}`}
          onClick={() => selectDay(d)}
        >
          <span className="date-dow">{d.day}</span>
          <span className="date-num">{d.date}</span>
          <span className="date-mon">{d.month}</span>
        </button>
      ))}
    </div>
  );
}

export default memo(DateSelector);
