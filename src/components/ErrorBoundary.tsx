import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: null });
  handleHome = () => { window.location.href = '/'; };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const code = `ERR-${Date.now().toString(36).slice(-6).toUpperCase()}`;
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full rounded-2xl border border-rule bg-card shadow-xl p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-lg font-bold text-foreground">G-GTS — Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error?.message || 'Erreur inattendue'}
            </p>
            <p className="mt-3 text-[11px] font-mono text-muted-foreground/70">Code : {code}</p>
            <div className="mt-6 flex gap-2 justify-center">
              <button onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <RefreshCw className="w-4 h-4" /> Réessayer
              </button>
              <button onClick={this.handleHome}
                className="inline-flex items-center gap-2 rounded-lg border border-rule px-4 py-2 text-sm font-medium hover:bg-muted">
                <Home className="w-4 h-4" /> Accueil
              </button>
            </div>
            <p className="mt-6 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Grants Tracking System · Grow Hub
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
