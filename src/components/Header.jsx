import { useState, useEffect } from "react";
import { FiSearch, FiBell, FiMail } from "react-icons/fi";
import { GoPerson } from "react-icons/go";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api, connectSocket } from "../lib/api";
import logoUrl from "../assets/social442-logo.png";
import "./Header.css";

export default function Header({
  onAvatarClick,
  onProfileClick,
  onInboxClick,
  onNotificationsClick,
  onLogoClick,
}) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  // Seed the unread bell count from the server, then keep it live over the socket.
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    api
      .getNotifications()
      .then((res) => {
        if (!active) return;
        const list = res?.notifications || [];
        setUnread(list.filter((n) => !(Number(n.is_read) || n.is_read === true)).length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = connectSocket();
    const onNotif = () => setUnread((n) => n + 1);
    socket.on("notification", onNotif);
    return () => socket.off("notification", onNotif);
  }, [isAuthenticated]);

  const openNotifications = () => {
    setUnread(0);
    onNotificationsClick?.();
  };
  // Resolve the signed-in user's avatar from whichever field the profile API
  // provides; fall back to the app logo if none is set or the image 404s.
  const avatarSrc = user?.avatar_url || user?.avatar || user?.photo_url || logoUrl;

  return (
    <div className="header">
      <div
        className="header-logo"
        role="button"
        tabIndex={0}
        onClick={onLogoClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onLogoClick?.();
          }
        }}
      >
        <div className="logo-circle">
          <img src={logoUrl} alt="" />
        </div>
        <span className="logo-text">
          {t("social")} <span className="logo-442">{t("logo_442")}</span>
        </span>
      </div>
      <div className="header-icons">
        <button className="icon-btn" aria-label="search">
          <FiSearch size={18} />
        </button>
        {isAuthenticated && (
          <>
            <button
              className="icon-btn"
              onClick={onInboxClick}
              aria-label="inbox"
              id="header-inbox-btn"
            >
              <FiMail size={18} />
            </button>
            <button
              className="icon-btn header-bell-wrap"
              onClick={openNotifications}
              aria-label="notifications"
              id="header-notif-btn"
            >
              <FiBell size={18} />
              {unread > 0 && (
                <span className="header-bell-badge">{unread > 99 ? "99+" : unread}</span>
              )}
            </button>
            <button
              className="icon-btn"
              onClick={onAvatarClick}
              aria-label="me-page"
              id="header-profile-btn"
            >
              <GoPerson size={18} />
            </button>
            <button
              className="header-avatar"
              onClick={onProfileClick}
              aria-label="profile"
              id="header-avatar-btn"
            >
              <img
                src={avatarSrc}
                alt={user?.display_name || user?.username || "me"}
                onError={(e) => {
                  if (e.currentTarget.src !== logoUrl) e.currentTarget.src = logoUrl;
                }}
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
