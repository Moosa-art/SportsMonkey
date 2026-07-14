import { useState } from 'react';
import Header from './components/Header';
import DateSelector from './components/DateSelector';
import Stories from './components/Stories';
import FilterTabs from './components/FilterTabs';
import Feed from './components/Feed';
import BottomNav from './components/BottomNav';
import FixturesPage from './pages/FixturesPage';
import TablePage from './pages/TablePage';
import LivePage from './pages/LivePage';
import MePage from './pages/MePage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import InboxPage from './pages/InboxPage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ClubSelectionPage from './pages/ClubSelectionPage';
import OnboardingCarousel from './pages/OnboardingCarousel';

import CommentsSheet from './components/CommentsSheet';
import ShareSheet from './components/ShareSheet';
import ReportModal from './components/ReportModal';
import MicOptionsSheet from './components/MicOptionsSheet';

import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const { isAuthenticated, selectedClub, loading } = useAuth();
  // onboarding -> login/signup -> club-selection. Onboarding is shown once;
  // returning visitors (flag in localStorage) skip straight to login.
  const [authState, setAuthState] = useState(() =>
    localStorage.getItem('onboardingComplete') ? 'login' : 'onboarding'
  );

  const finishOnboarding = (next) => {
    localStorage.setItem('onboardingComplete', '1');
    setAuthState(next);
  };
  const [activeTab, setActiveTab] = useState('Latest');
  // Default the feed to the unfiltered "All" view (selectedDate = null) so the
  // full curated club feed shows on first paint. The club feed is a curated mix
  // (stories, player ratings, videos, news) and most items aren't stamped
  // exactly "today", so defaulting to a single day hid almost every item and
  // also triggered endless empty load-more (POST) requests. Tapping a date pill
  // still applies a real client-side day filter; "All" (null) is the default.
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeNav, setActiveNav] = useState('Home');
  const [showMe, setShowMe] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMic, setShowMic] = useState(false);
  const [showClubSwitch, setShowClubSwitch] = useState(false);

  // Bottom sheets & overlay state
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [activeSharePost, setActiveSharePost] = useState(null);
  const [activeReportPost, setActiveReportPost] = useState(null);

  const [homeView, setHomeView] = useState('feed');

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader"></div>
      </div>
    );
  }

  const handleNavChange = (navLabel) => {
    setActiveNav(navLabel);
    setShowMe(false);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowInbox(false);
    setShowClubSwitch(false);
    if (navLabel === 'Home') {
      if (!isAuthenticated) {
        setAuthState('onboarding');
      } else {
        setHomeView('feed');
      }
    }
  };

  const renderPage = () => {
    // Full-screen overlays
    if (showClubSwitch) {
      return (
        <ClubSelectionPage
          onSuccess={() => setShowClubSwitch(false)}
          onBack={() => setShowClubSwitch(false)}
        />
      );
    }
    if (showMe) {
      return <MePage onBack={() => setShowMe(false)} />;
    }
    if (showEditProfile) {
      return <EditProfilePage onBack={() => setShowEditProfile(false)} />;
    }
    if (showProfile) {
      return (
        <ProfilePage
          onBack={() => setShowProfile(false)}
          onEdit={() => setShowEditProfile(true)}
        />
      );
    }
    if (showInbox) {
      return <InboxPage onBack={() => setShowInbox(false)} />;
    }
    if (showNotifications) {
      return <NotificationsPage onBack={() => setShowNotifications(false)} />;
    }

    // Standard Bottom Nav routing
    switch (activeNav) {
      case 'Home':
        if (!isAuthenticated) {
          if (authState === 'signup') {
            return (
              <SignupPage
                onSuccess={() => setAuthState('club-selection')}
                onSwitchToLogin={() => setAuthState('login')}
              />
            );
          }
          if (authState === 'club-selection') {
            return (
              <ClubSelectionPage
                onSuccess={() => setAuthState('login')}
              />
            );
          }
          if (authState === 'login') {
            return (
              <LoginPage
                onSuccess={() => setAuthState('club-selection')}
                onSwitchToSignup={() => setAuthState('signup')}
              />
            );
          }
          return (
            <OnboardingCarousel
              isAuthenticated={false}
              onGetStarted={() => finishOnboarding('signup')}
              onLogin={() => finishOnboarding('login')}
            />
          );
        }

        // Authenticated but no club selected yet
        if (!selectedClub || (Array.isArray(selectedClub) && selectedClub.length === 0)) {
          return (
            <ClubSelectionPage
              onSuccess={() => {
                // selectClub() in AuthContext already updated selectedClub state.
              }}
            />
          );
        }

        if (homeView === 'carousel') {
          return (
            <OnboardingCarousel
              isAuthenticated={true}
              selectedClub={selectedClub}
              onClubSelectClick={() => setShowClubSwitch(true)}
              onEnterFeedClick={() => setHomeView('feed')}
            />
          );
        }

        return (
          <>
            <Header
              onAvatarClick={() => setShowMe(true)}
              onProfileClick={() => setShowProfile(true)}
              onInboxClick={() => setShowInbox(true)}
              onNotificationsClick={() => setShowNotifications(true)}
              onLogoClick={() => setHomeView('carousel')}
            />
            <DateSelector
              activeIso={selectedDate}
              onDateChange={(d) => setSelectedDate(d ? d.iso : null)}
            />
            <Stories />
            <FilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <Feed
              activeTab={activeTab}
              selectedDate={selectedDate}
              onCommentClick={(post) => setActiveCommentsPost(post)}
              onShareClick={(post) => setActiveSharePost(post)}
              onReportClick={(post) => setActiveReportPost(post)}
            />
          </>
        );
      case 'Fixtures':
        return <FixturesPage />;
      case 'Table':
        return <TablePage />;
      case 'Live':
        return <LivePage />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="app-bg"></div>
      <div className="phone-container">
        <div className="phone-screen">
          {renderPage()}
          <BottomNav
            activeNav={activeNav}
            setActiveNav={handleNavChange}
            onMicClick={() => setShowMic(true)}
          />
        </div>
      </div>

      {/* Global overlay sheets */}
      {activeCommentsPost && (
        <CommentsSheet
          post={activeCommentsPost}
          onClose={() => setActiveCommentsPost(null)}
        />
      )}
      {activeSharePost && (
        <ShareSheet
          post={activeSharePost}
          onClose={() => setActiveSharePost(null)}
        />
      )}
      {activeReportPost && (
        <ReportModal
          post={activeReportPost}
          onClose={() => setActiveReportPost(null)}
        />
      )}
      {showMic && <MicOptionsSheet onClose={() => setShowMic(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
