import React, { Suspense } from 'react';

interface Props { children: React.ReactNode; label: string; active?: boolean; overlay?: boolean; onCancel?: () => void }

export class DeferredContent extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    const { children, label, active = true, overlay = false, onCancel } = this.props;
    const panelClass = overlay ? 'fixed inset-0 z-50 p-6 bg-slate-950/95 flex flex-col items-center justify-center text-slate-200 gap-4' : 'p-6 text-slate-200 space-y-3';
    if (this.state.failed) return active ? <div className={panelClass}>
      <p role="alert">Could not load {label}. Check your connection and reload the page to try again.</p>
      <button type="button" onClick={() => window.location.reload()} className="text-blue-300 underline mr-4">Reload page</button>
      {onCancel && <button type="button" className="text-blue-300 underline" onClick={onCancel}>Close</button>}
    </div> : null;
    return <Suspense fallback={active ? <div className={panelClass}>
      <p role="status">Loading {label}…</p>
      {onCancel && <button type="button" className="text-blue-300 underline" onClick={onCancel}>Close</button>}
    </div> : null}>{children}</Suspense>;
  }
}
