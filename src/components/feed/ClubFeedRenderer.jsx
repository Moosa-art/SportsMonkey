import { memo, useCallback } from 'react';
import PostErrorBoundary from '../PostErrorBoundary';
import NewsCard from './cards/NewsCard';
import VideoCard from './cards/VideoCard';
import ReelCard from './cards/ReelCard';
import FixturesCard from './cards/FixturesCard';
import PlayerComparisonCard from './cards/PlayerComparisonCard';
import PlayerStatsCard from './cards/PlayerStatsCard';
import SpecialCard from './cards/SpecialCard';
import LeagueTableCard from './cards/LeagueTableCard';
import MatchStatsCard from './cards/MatchStatsCard';
import FreeBetCard from './cards/FreeBetCard';
import GlanceGroup, { RatingsCard, ScorersCard, VoteCard } from './GlanceGroup';

/**
 * Dispatches a normalized FeedItem to its matching card component, wrapped in an
 * error boundary so one malformed item can never take down the whole feed.
 *
 * Perf: the parent passes STABLE (item-agnostic) callbacks; this component binds
 * them to its own `item` via useCallback so memoised cards below don't re-render
 * unless their own item identity changes.
 */
function ClubFeedRenderer({ item, onComment, onShare, onReport, onOpenReel }) {
  const handleComment = useCallback(() => onComment?.(item), [onComment, item]);
  const handleShare = useCallback(() => onShare?.(item), [onShare, item]);
  const handleReport = useCallback(() => onReport?.(item), [onReport, item]);
  const eng = { onComment: handleComment, onShare: handleShare, onReport: handleReport };

  let body;
  switch (item.kind) {
    case 'news':
      body = (
        <NewsCard item={item} onComment={handleComment} onShare={handleShare} onReport={handleReport} />
      );
      break;
    case 'video':
      body =
        item.mediaFormat === 'reel' ? (
          <ReelCard
            item={item}
            onComment={handleComment}
            onShare={handleShare}
            onOpenReel={onOpenReel}
          />
        ) : (
          <VideoCard item={item} onComment={handleComment} onShare={handleShare} onReport={handleReport} />
        );
      break;
    case 'fixtures':
      body = (
        <FixturesCard item={item} onComment={handleComment} onShare={handleShare} onReport={handleReport} />
      );
      break;
    case 'glance':
      body = (
        <GlanceGroup item={item} onComment={handleComment} onShare={handleShare} onReport={handleReport} />
      );
      break;
    case 'playerComparison':
      body = (
        <PlayerComparisonCard
          item={item}
          onComment={handleComment}
          onShare={handleShare}
          onReport={handleReport}
        />
      );
      break;
    case 'playerStats':
      body = (
        <PlayerStatsCard
          item={item}
          onComment={handleComment}
          onShare={handleShare}
          onReport={handleReport}
        />
      );
      break;
    case 'special':
      body = (
        <SpecialCard
          item={item}
          onComment={handleComment}
          onShare={handleShare}
          onReport={handleReport}
        />
      );
      break;
    case 'ratings':
      body = (
        <>
          <RatingsCard tile={item} dedupeId={item.dedupeId} eng={eng} />
          <MatchStatsCard tile={item} dedupeId={`${item.dedupeId}:stats`} eng={eng} />
        </>
      );
      break;
    case 'topScorers':
      body = <ScorersCard tile={item} dedupeId={item.dedupeId} eng={eng} />;
      break;
    case 'interactive':
      body = <VoteCard tile={item} dedupeId={item.dedupeId} eng={eng} />;
      break;
    case 'leagueTable':
      body = <LeagueTableCard tile={item} dedupeId={item.dedupeId} eng={eng} />;
      break;
    case 'freebet':
      body = <FreeBetCard tile={item} dedupeId={item.dedupeId} eng={eng} />;
      break;
    default:
      body = null;
  }

  return <PostErrorBoundary>{body}</PostErrorBoundary>;
}

export default memo(ClubFeedRenderer);
