import React from 'react';
import AppLayout from '@/components/AppLayout';
import ApiCredentialsPanel from './components/ApiCredentialsPanel';
import SymbolSelectorPanel from './components/SymbolSelectorPanel';
import WebSocketConfigPanel from './components/WebSocketConfigPanel';
import ConnectionHealthPanel from './components/ConnectionHealthPanel';
import { Settings, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted border border-border">
              <Settings size={20} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-foreground font-bold text-xl tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Configure Bybit API credentials, target symbols, WebSocket feeds, and monitor connection health
              </p>
            </div>
          </div>
          <a
            href="https://www.bybit.com/app/user/api-management"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink size={12} />
            Bybit API Management
          </a>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* API Credentials — full width on mobile, left col on xl */}
          <div className="xl:col-span-1">
            <ApiCredentialsPanel />
          </div>

          {/* Connection Health — right col on xl */}
          <div className="xl:col-span-1">
            <ConnectionHealthPanel />
          </div>

          {/* Symbol Selector — left col on xl */}
          <div className="xl:col-span-1">
            <SymbolSelectorPanel />
          </div>

          {/* WebSocket Config — right col on xl */}
          <div className="xl:col-span-1">
            <WebSocketConfigPanel />
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          API credentials are stored in browser session only. For production use, store keys server-side via environment variables.
        </p>
      </div>
    </AppLayout>
  );
}
