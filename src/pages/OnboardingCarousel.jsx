import { useState, useRef, useCallback } from "react";
import logo from "../assets/social442-logo.png";
import "./OnboardingCarousel.css";

/* ─── Slide data ─────────────────────────────────────────────── */
const SLIDES = [
  {
    key: "social-network",
    art: "network",
    title: "Largest Football\nSocial Network",
    subtitle: "1 Million+ Users",
    bg: "https://images.unsplash.com/photo-1540747913346-19212a4b1289?w=900&auto=format&fit=crop&q=80",
  },
  {
    key: "news-views",
    art: "feed-card",
    title: "More News\n& Views",
    subtitle: "",
    bg: "https://images.unsplash.com/photo-1555538995-72c03623def8?w=900&auto=format&fit=crop&q=80",
  },
  {
    key: "interactive",
    art: "pitch",
    title: "Interactive\nPlatform",
    subtitle: "",
    bg: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&auto=format&fit=crop&q=80",
  },
];

/* ─── Network graphic data ───────────────────────────────────── */
// Centre node + 8 outer nodes arranged like original design
const NETWORK_NODES = [
  // centre (mic / brand logo)
  { id: 0, isCenter: true, x: 50, y: 50 },
  // top
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=150&auto=format&fit=crop",
    x: 50,
    y: 17,
    label: "Charlotte",
    text: "Welcome",
  },
  // top-left, top-right
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1606131731446-5568d87113aa?w=150&auto=format&fit=crop",
    x: 18,
    y: 30,
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop",
    x: 82,
    y: 30,
  },
  // mid-left, mid-right
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1585779034823-7e9ac8faec70?w=150&auto=format&fit=crop",
    x: 10,
    y: 52,
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=150&auto=format&fit=crop",
    x: 90,
    y: 52,
  },
  // bottom-left, bottom-centre, bottom-right
  {
    id: 6,
    img: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=150&auto=format&fit=crop",
    x: 22,
    y: 73,
  },
  {
    id: 7,
    img: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=150&auto=format&fit=crop",
    x: 50,
    y: 81,
  },
  {
    id: 8,
    img: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=150&auto=format&fit=crop",
    x: 78,
    y: 73,
  },
];

// Lines: [from-node-id, to-node-id]
const NETWORK_EDGES = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 8],
  [6, 7],
  [7, 8],
];

/* ─── Pitch graphic data ──────────────────────────────────────── */
const PITCH_PLAYERS = [
  // left col – sitting on the left penalty box line
  {
    img: "https://images.unsplash.com/photo-1600878459138-e1123b37cb30?w=150&auto=format&fit=crop",
    x: 0,
    y: 11,
    bubble: "Great Pass!",
    side: "right",
    outside: true,
  },
  {
    img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&auto=format&fit=crop",
    x: -0,
    y: 50,
    bubble: "We need a striker",
    side: "right",
    outside: true,
  },
  {
    img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&auto=format&fit=crop",
    x: -0,
    y: 89,
    bubble: "Defense looks weak today",
    side: "right",
    outside: true,
  },
  // right col – sitting on the right penalty box line / center area
  {
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
    x: 100,
    y: 11,
    bubble: "4-4-2 Could work better",
    side: "left",
    outside: true,
  },
  {
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop",
    x: 100,
    y: 88,
    bubble: "What a goal",
    side: "left",
    outside: true,
  },

  // on-pitch small player tokens
  { img: "https://i.pravatar.cc/80?img=12", x: 30, y: 35 },
  { img: "https://i.pravatar.cc/80?img=18", x: 30, y: 65 },
  { img: "https://i.pravatar.cc/80?img=25", x: 50, y: 28 },
  { img: "https://i.pravatar.cc/80?img=27", x: 50, y: 72 },
  { img: "https://i.pravatar.cc/80?img=33", x: 90, y: 48 }, // small player right edge

  // Hero player - large avatar, to the right of center circle
  {
    img: "https://images.unsplash.com/photo-1606131731446-5568d87113aa?w=200&auto=format&fit=crop",
    x: 100,
    y: 50,
    bubble: "Change formation",
    side: "left",
    hero: true,
  },
];

/* ─── Art renderers ──────────────────────────────────────────── */
function NetworkArt() {
  const byId = Object.fromEntries(NETWORK_NODES.map((n) => [n.id, n]));
  return (
    <div className="ob-art-network">
      <svg
        className="ob-net-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {NETWORK_EDGES.map(([a, b], i) => {
          const na = byId[a],
            nb = byId[b];
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.6"
              strokeDasharray="1.8,1.8"
            />
          );
        })}
      </svg>

      {/* Centre mic node */}
      <div className="ob-net-center" style={{ left: "50%", top: "50%" }}>
        <img
          src={logo}
          alt="Social 442"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>

      {/* Outer nodes */}
      {NETWORK_NODES.filter((n) => !n.isCenter).map((node) => (
        <div
          key={node.id}
          className="ob-net-node"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div className="ob-net-img-wrap">
            <img src={node.img} alt="" />
          </div>
          {node.label && (
            <div className="ob-net-bubble">
              <span className="ob-net-bubble-name">{node.label}</span>
              <span className="ob-net-bubble-msg">{node.text}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FeedCardArt() {
  return (
    <div className="ob-art-feedcard">
      <div className="ob-feedcard">
        {/* Header */}
        <div className="ob-fc-header">
          <img
            className="ob-fc-avatar"
            src="https://i.pravatar.cc/100?img=33"
            alt=""
          />
          <span className="ob-fc-username">Tamryn Wright</span>
        </div>

        {/* Image + overlapping logos */}
        <div className="ob-fc-imgwrap">
          <img
            className="ob-fc-img"
            src="https://backend.liverpoolfc.com/sites/default/files/styles/xl/public/2025-09/alexander-isak-liverpool-fc-230925_f745eec229dadb04da2881879b5531d7.webp?itok=vc1YA9w0"
            alt=""
          />
          {/* Sky Sports – left middle */}
          <div
            className="ob-logo-pin ob-pin-left-mid ob-pin-bg-sky"
            title="Sky Sports"
          >
            <svg viewBox="0 0 100 100" className="ob-svg-logo">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="#c8102e"
                stroke="#fff"
                strokeWidth="3"
              />
              <text
                x="50"
                y="45"
                fill="#fff"
                fontSize="24"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="Arial, Helvetica, sans-serif"
              >
                sky
              </text>
              <text
                x="50"
                y="70"
                fill="#fff"
                fontSize="16"
                fontWeight="bold"
                letterSpacing="1"
                textAnchor="middle"
                fontFamily="Arial, Helvetica, sans-serif"
              >
                SPORTS
              </text>
            </svg>
          </div>
          {/* Premier League – top right */}
          <div
            className="ob-logo-pin ob-pin-top-right ob-pin-bg-pl"
            title="Premier League"
          >
            <svg viewBox="0 0 100 100" className="ob-svg-logo">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="#3d185a"
                stroke="#fff"
                strokeWidth="3"
              />
              <path
                d="M50 20 L54 28 L62 25 L60 33 L67 36 L59 42 L62 50 L50 44 L38 50 L41 42 L33 36 L40 33 L38 25 L46 28 Z"
                fill="#fff"
              />
              <circle cx="50" cy="62" r="10" fill="#fff" />
              <path d="M40 62 Q50 72 60 62 Q50 68 40 62" fill="#3d185a" />
            </svg>
          </div>
          {/* Football365 – right middle */}
          <div
            className="ob-logo-pin ob-pin-right-mid ob-pin-bg-f365"
            title="Football 365"
          >
            <svg viewBox="0 0 100 100" className="ob-svg-logo">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="#132435"
                stroke="#fff"
                strokeWidth="3"
              />
              <rect
                x="25"
                y="30"
                width="50"
                height="40"
                rx="6"
                fill="#00ff87"
              />
              <text
                x="50"
                y="56"
                fill="#132435"
                fontSize="22"
                fontWeight="900"
                textAnchor="middle"
                fontFamily="Arial, Helvetica, sans-serif"
              >
                365
              </text>
            </svg>
          </div>
          {/* ESPN – left bottom-ish */}
          <div
            className="ob-logo-pin ob-pin-left-low ob-pin-bg-espn"
            title="ESPN"
          >
            <svg viewBox="0 0 100 100" className="ob-svg-logo">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="#e11b22"
                stroke="#fff"
                strokeWidth="3"
              />
              <text
                x="50"
                y="58"
                fill="#fff"
                fontSize="26"
                fontWeight="bold"
                fontStyle="italic"
                letterSpacing="-1"
                textAnchor="middle"
                fontFamily="Impact, Arial Black, sans-serif"
              >
                ESPN
              </text>
              <line
                x1="20"
                y1="46"
                x2="80"
                y2="46"
                stroke="#e11b22"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>

        {/* Actions */}
        <div className="ob-fc-body">
          <div className="ob-fc-actions">
            <div className="ob-fc-acts-left">
              <span className="ob-fc-icon">❤️</span>
              <span className="ob-fc-icon">💬</span>
              <span className="ob-fc-icon">✈️</span>
            </div>
            <span className="ob-fc-icon">🔖</span>
          </div>
          <div className="ob-fc-likes">10225 Likes</div>
          <div className="ob-fc-title">
            Liverpool boss Slot reveals timeframe for Isak return as he gives
            blunt reply to Elliott question
          </div>
          <div className="ob-fc-text">
            Liverpool head coach Arne Slot has revealed that Reds striker
            Alexander Isak will miss "a couple of months" of action after
            breaking his lower leg he Sweden international had to be taken off
            ... <span className="ob-fc-more">more</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PitchArt() {
  return (
    <div className="ob-art-pitch">
      <div className="ob-pitch">
        {/* Pitch markings */}
        <div className="ob-pitch-inner">
          <span className="ob-p-midline" />
          <span className="ob-p-circle" />
          <span className="ob-p-box ob-p-box-left" />
          <span className="ob-p-box ob-p-box-right" />
          {/* Soccer ball centre */}
          <span className="ob-p-ball">⚽</span>

          {/* Players */}
          {PITCH_PLAYERS.map((p, i) => (
            <div
              key={i}
              className={`ob-pp ${p.hero ? "ob-pp-hero" : ""} ${p.outside ? "ob-pp-outside" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <img src={p.img} alt="" />
              {p.bubble && (
                <span className={`ob-pp-bubble ob-pp-bubble-${p.side}`}>
                  {p.bubble}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function OnboardingCarousel({
  isAuthenticated,
  selectedClub,
  onGetStarted,
  onLogin,
  onClubSelectClick,
  onEnterFeedClick,
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const goTo = useCallback(
    (i) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, i))),
    [],
  );

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      else setIndex((i) => Math.max(0, i - 1));
    }
    touchStartX.current = null;
  };

  const slide = SLIDES[index];
  const clubName =
    isAuthenticated && selectedClub && selectedClub.length > 0
      ? selectedClub[0]?.name || "Select Club"
      : "Crystal Palace";

  return (
    <div className="ob-root">
      {/* Full-bleed background per slide */}
      <div
        className="ob-fullbg"
        style={{ backgroundImage: `url(${slide.bg})` }}
        aria-hidden="true"
      />
      <div className="ob-fullbg-overlay" aria-hidden="true" />

      {/* Top bar */}
      <header className="ob-topbar">
        <div
          className="ob-brand"
          role="button"
          tabIndex={0}
          style={isAuthenticated ? { cursor: "pointer" } : {}}
          onClick={isAuthenticated ? onEnterFeedClick : undefined}
          onKeyDown={(e) => {
            if (isAuthenticated && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onEnterFeedClick?.();
            }
          }}
        >
          <img src={logo} alt="" className="ob-brand-logo" />
          <span className="ob-brand-name">
            Social <span className="ob-brand-442">442</span>
          </span>
        </div>
      </header>

      {/* Scrollable body area */}
      <div
        className="ob-body"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="ob-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s, i) => (
            <div key={s.key} className="ob-slide" aria-hidden={i !== index}>
              {/* Title block – top left */}
              <div className="ob-copy">
                <h1 className="ob-title">
                  {s.title.split("\n").map((line, li) => (
                    <span key={li} className="ob-title-line">
                      {line}
                    </span>
                  ))}
                </h1>
                {s.subtitle && <p className="ob-subtitle">{s.subtitle}</p>}
              </div>

              {/* Art */}
              <div className="ob-art-wrap">
                {s.art === "network" && <NetworkArt />}
                {s.art === "feed-card" && <FeedCardArt />}
                {s.art === "pitch" && <PitchArt />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="ob-footer">
        {/* Action Buttons */}
        <div className="ob-btns">
          <button
            type="button"
            className="ob-btn ob-btn-outline"
            onClick={isAuthenticated ? onClubSelectClick : onGetStarted}
          >
            Get Started
          </button>
          <button
            type="button"
            className="ob-btn ob-btn-filled"
            onClick={isAuthenticated ? onEnterFeedClick : onLogin}
          >
            {clubName}
          </button>
        </div>

        {/* App store badges – slide 1 only */}
        {index === 0 && (
          <div className="ob-store-badges">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="Google Play"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play"
                className="ob-store-badge"
              />
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="App Store"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="Download on the App Store"
                className="ob-store-badge"
              />
            </a>
          </div>
        )}

        {/* Dots */}
        <div className="ob-dots" role="tablist">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className={`ob-dot ${i === index ? "ob-dot-active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}
