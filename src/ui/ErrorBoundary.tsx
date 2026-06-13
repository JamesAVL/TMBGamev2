import { Component, type ErrorInfo, type ReactNode } from 'react';

// Last line of defence: without this, any uncaught render/commit error (e.g. a
// thrown effect) unmounts the React root and leaves a blank screen with no clue.
// Here it becomes a visible, reloadable message — and the error is logged.
type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TMB] uncaught error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
          color: '#f4f1e8',
          background: '#0b0d14',
          fontFamily: 'system-ui, sans-serif',
          zIndex: 1000,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h2 style={{ marginBottom: 10 }}>Something broke.</h2>
          <p style={{ opacity: 0.7, fontSize: 13, marginBottom: 18, wordBreak: 'break-word' }}>
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: 'inherit',
              fontSize: 14,
              color: '#0b0d14',
              background: '#ffd76e',
              border: 'none',
              borderRadius: 999,
              padding: '8px 24px',
              cursor: 'pointer',
            }}
          >
            reload
          </button>
        </div>
      </div>
    );
  }
}
