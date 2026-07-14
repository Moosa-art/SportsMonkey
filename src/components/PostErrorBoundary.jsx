import { Component } from 'react';

export default class PostErrorBoundary extends Component {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(err) {
    console.warn('[PostCard] Render error suppressed:', err.message);
  }

  render() {
    if (this.state.crashed) return null; // silently skip broken cards
    return this.props.children;
  }
}
