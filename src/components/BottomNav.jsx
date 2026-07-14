import { GoHome, GoHomeFill } from "react-icons/go";
import {
  BsCalendar2Week,
  BsCalendar2WeekFill,
  BsTv,
  BsTvFill,
} from "react-icons/bs";
import { TbTable, TbTableFilled } from "react-icons/tb";
import "./BottomNav.css";

const navs = [
  { label: "Home", icon: GoHome, iconActive: GoHomeFill },
  { label: "Fixtures", icon: BsCalendar2Week, iconActive: BsCalendar2WeekFill },
  { label: "Table", icon: TbTable, iconActive: TbTableFilled },
  { label: "Live", icon: BsTv, iconActive: BsTvFill },
];

export default function BottomNav({ activeNav, setActiveNav, onMicClick }) {
  return (
    <div className="bottom-nav-wrap">
      <div className="bottom-nav">
        <img src="/public/new-footer-bg.png" alt="" className="botom_nav_bg" />
        {navs.slice(0, 2).map((n) => {
          const Icon = activeNav === n.label ? n.iconActive : n.icon;
          return (
            <button
              key={n.label}
              className={`nav-item ${activeNav === n.label ? "active" : ""}`}
              onClick={() => setActiveNav(n.label)}
              id={`nav-item-${n.label.toLowerCase()}`}
            >
              <Icon size={24} />
              <span>{n.label}</span>
            </button>
          );
        })}
        <div className="nav-spacer"></div>
        {navs.slice(2).map((n) => {
          const Icon = activeNav === n.label ? n.iconActive : n.icon;
          return (
            <button
              key={n.label}
              className={`nav-item ${activeNav === n.label ? "active" : ""}`}
              onClick={() => setActiveNav(n.label)}
              id={`nav-item-${n.label.toLowerCase()}`}
            >
              <Icon size={24} />
              <span>{n.label}</span>
            </button>
          );
        })}
      </div>
      <button
        className="live-fab"
        aria-label="Go Live"
        id="live-mic-fab"
        onClick={() => onMicClick?.()}
      >
        <img
          src="/public/left-radar-blue-croped.png"
          className="left-radar-blue-croped"
          alt="Go Live"
        />
        <img
          src="/public/s442_new_mic.png"
          className="s442_new_mic"
          alt="Go Live"
        />
        <img
          src="/public/right-radar-blue-croped.png"
          className="right-radar-blue-croped flash"
          alt="Go Live"
        />
      </button>
    </div>
  );
}
