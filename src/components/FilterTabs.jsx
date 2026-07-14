import { memo } from 'react';
import { FiClock, FiBookmark, FiUserCheck, FiTrendingUp } from 'react-icons/fi';
import { FEED_TABS } from '../lib/feed/feedConfig';
import './FilterTabs.css';

const TABS = [
  { id: FEED_TABS.latest, label: 'Latest', Icon: FiClock },
  { id: FEED_TABS.favourite, label: 'Favourites', Icon: FiBookmark },
  { id: FEED_TABS.following, label: 'Following', Icon: FiUserCheck },
  { id: FEED_TABS.trending, label: 'Trending', Icon: FiTrendingUp },
];

/**
 * Feed view selector. Controlled: the active tab lives in App so it persists
 * while the user navigates between bottom-nav screens.
 */
function FilterTabs({ activeTab, setActiveTab }) {
  return (
    <div className="cf-tabs" role="tablist" aria-label="Feed filters">
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`cf-tab${active ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(FilterTabs);
