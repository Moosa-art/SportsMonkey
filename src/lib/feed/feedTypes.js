/**
 * src/lib/feed/feedTypes.js
 *
 * JSDoc typedefs describing BOTH the raw upstream club-feed-new payload and the
 * normalized view-models the UI consumes. This project is plain JS, so we use
 * JSDoc for editor intellisense rather than .ts files. Types-only at runtime.
 *
 * RAW UPSTREAM (what social442.com/api/club-feed-new returns):
 *   response: { status, feed[], global_variable, offsets }
 *   each feed element is identified by feed_layout_type:
 *     - simple_news   single news article (fields at top level)
 *     - youtube_news  youtube video card
 *     - funny_video   mp4 video card (relative link under /public/videos)
 *     - club_post     fixtures card (post_type === club_fixtures)
 *     - glance_post_1 | _2 | _3  container of post_1..post_6 tiles
 *
 * NORMALIZED VIEW-MODELS (what React components consume):
 *   FeedItem.kind is one of: news | video | fixtures | glance
 *
 * @typedef {Object} NewsArticle
 * @property {(number|string)} id
 * @property {string} title
 * @property {(string|null)} image
 * @property {string} link
 * @property {string} source
 * @property {(string|null)} sourceImg
 * @property {string} sourceType
 * @property {boolean} isRedirect
 * @property {(Object|null)} club           Shape: name + image, or null.
 * @property {(string|null)} newsKind
 * @property {string[]} summary             Teaser paragraphs (raw body).
 * @property {string[]} article             Full paragraphs (raw modal_body).
 * @property {(string|null)} createdAt
 *
 * @typedef {Object} NewsItem
 * @property {'news'} kind
 * @property {string} dedupeId
 * @property {string} layout
 * @property {NewsArticle} article
 *
 * @typedef {Object} VideoItem
 * @property {'video'} kind
 * @property {string} dedupeId
 * @property {string} layout
 * @property {('youtube'|'mp4')} provider
 * @property {(number|string)} id
 * @property {string} title
 * @property {(string|null)} thumbnail
 * @property {(string|null)} url
 * @property {(string|null)} youtubeId
 * @property {string} source
 * @property {(string|null)} sourceImg
 * @property {(string|null)} createdAt
 *
 * @typedef {Object} Fixture
 * @property {number} matchId
 * @property {Object} home                  title + image + score
 * @property {Object} away                  title + image + score
 * @property {string} status
 * @property {string} dateTime
 *
 * @typedef {Object} FixturesItem
 * @property {'fixtures'} kind
 * @property {string} dedupeId
 * @property {string} layout
 * @property {Fixture[]} fixtures
 * @property {(string|null)} bottomText
 * @property {string} source
 * @property {(string|null)} sourceImg
 *
 * @typedef {Object} GlanceItem
 * @property {'glance'} kind
 * @property {string} dedupeId
 * @property {string} variant
 * @property {Object[]} tiles
 *
 * @typedef {(NewsItem|VideoItem|FixturesItem|GlanceItem)} FeedItem
 */

export {};
