import './SkeletonLoader.css';

export function SkeletonPostCard() {
  return (
    <div className="skel-card">
      <div className="skel-header">
        <div className="skel-avatar skel-pulse" />
        <div className="skel-user-info">
          <div className="skel-line skel-pulse" style={{ width: '40%', height: 13 }} />
          <div className="skel-line skel-pulse" style={{ width: '25%', height: 10, marginTop: 5 }} />
        </div>
      </div>
      <div className="skel-body skel-pulse" />
      <div className="skel-footer">
        <div className="skel-line skel-pulse" style={{ width: '20%', height: 11 }} />
        <div className="skel-line skel-pulse" style={{ width: '15%', height: 11 }} />
        <div className="skel-line skel-pulse" style={{ width: '15%', height: 11 }} />
      </div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div className="skel-msg">
      <div className="skel-avatar skel-pulse" style={{ width: 44, height: 44 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skel-line skel-pulse" style={{ width: '35%', height: 12 }} />
        <div className="skel-line skel-pulse" style={{ width: '70%', height: 11 }} />
      </div>
      <div className="skel-line skel-pulse" style={{ width: 30, height: 10 }} />
    </div>
  );
}

export function SkeletonComment() {
  return (
    <div className="skel-msg" style={{ padding: '10px 16px' }}>
      <div className="skel-avatar skel-pulse" style={{ width: 34, height: 34 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div className="skel-line skel-pulse" style={{ width: '30%', height: 11 }} />
        <div className="skel-line skel-pulse" style={{ width: '85%', height: 10 }} />
        <div className="skel-line skel-pulse" style={{ width: '60%', height: 10 }} />
      </div>
    </div>
  );
}

export function SkeletonStory() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <div className="skel-pulse" style={{ width: 58, height: 58, borderRadius: '50%' }} />
      <div className="skel-pulse" style={{ width: 40, height: 9, borderRadius: 4 }} />
    </div>
  );
}
