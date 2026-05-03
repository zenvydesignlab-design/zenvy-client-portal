import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Portal runtime error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell grid min-h-screen place-items-center p-4">
          <div className="glass-strong relative z-10 max-w-lg rounded-3xl p-6 text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-ember">Runtime error</p>
            <h1 className="mt-3 text-3xl font-black">The portal hit an unexpected state.</h1>
            <p className="mt-3 text-sm leading-6 text-white/52">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="focus-ring mt-6 rounded-2xl bg-white px-5 py-3 font-black text-night transition hover:bg-aqua"
            >
              Reload portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
