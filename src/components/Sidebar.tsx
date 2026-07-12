'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bot,
  Shield,
  Activity,
  Settings,
  Bell,
  Circle,
  Zap,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'positive' | 'warning' | 'negative' | 'info';
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'group-core',
    label: 'Operations',
    items: [
      {
        id: 'nav-dashboard',
        label: 'Live Dashboard',
        href: '/',
        icon: LayoutDashboard,
        badge: 'LIVE',
        badgeVariant: 'positive',
      },
      {
        id: 'nav-analytics',
        label: 'Performance',
        href: '/performance-analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'group-system',
    label: 'System',
    items: [
      {
        id: 'nav-bot',
        label: 'Bot Config',
        href: '/bot-config',
        icon: Bot,
      },
      {
        id: 'nav-risk',
        label: 'Risk Rules',
        href: '/risk-rules',
        icon: Shield,
        badge: '1',
        badgeVariant: 'warning',
      },
      {
        id: 'nav-signals',
        label: 'Signal Engine',
        href: '/signal-engine',
        icon: Zap,
      },
      {
        id: 'nav-alerts',
        label: 'Alerts',
        href: '/alerts',
        icon: Bell,
        badge: '3',
        badgeVariant: 'info',
      },
    ],
  },
  {
    id: 'group-admin',
    label: 'Admin',
    items: [
      {
        id: 'nav-logs',
        label: 'Trade Logs',
        href: '/trade-logs',
        icon: Activity,
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
];

const BADGE_CLASSES: Record<string, string> = {
  positive: 'bg-positive-subtle text-positive border border-positive/20',
  warning: 'bg-warning-subtle text-warning border border-warning/20',
  negative: 'bg-negative-subtle text-negative border border-negative/20',
  info: 'bg-info-subtle text-info border border-info/20',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        relative flex flex-col h-full
        bg-card border-r border-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div
        className={`
          flex items-center border-b border-border
          ${collapsed ? 'justify-center px-3 py-4' : 'px-4 py-4 gap-3'}
        `}
      >
        <AppLogo size={32} />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-foreground font-semibold text-sm leading-tight tracking-tight">
              SniperBot
            </span>
            <span className="text-muted-foreground text-[10px] font-mono tracking-widest uppercase">
              v2.4.1
            </span>
          </div>
        )}
      </div>

      {/* Bot Status Pill */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-md bg-positive-subtle border border-positive/20 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-positive" />
          </span>
          <span className="text-positive text-xs font-semibold tracking-wide">
            BOT ACTIVE
          </span>
          <span className="ml-auto text-muted-foreground text-[10px] font-mono">
            PAPER
          </span>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center mt-3 mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-positive" />
          </span>
        </div>
      )}

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href) && item.href !== '#';

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`
                        group relative flex items-center rounded-md
                        transition-all duration-150
                        ${collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2 gap-2.5'}
                        ${
                          isActive
                            ? 'bg-primary/10 text-primary' :'text-secondary-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 ${isActive ? 'text-primary' : ''}`}
                      />
                      {!collapsed && (
                        <>
                          <span className="text-sm font-medium flex-1 truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={`
                                text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                                ${BADGE_CLASSES[item.badgeVariant ?? 'info']}
                              `}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {/* Tooltip for collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-md text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                          {item.label}
                          {item.badge && (
                            <span className="ml-1.5 text-warning font-semibold">
                              ({item.badge})
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: Collapse toggle + user */}
      <div className="border-t border-border">
        {!collapsed && (
          <div className="px-3 py-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-primary text-[10px] font-bold">KW</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                Kyle Weston
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Trader · Paper Mode
              </p>
            </div>
            <Circle size={8} className="text-positive fill-positive shrink-0" />
          </div>
        )}
        <div
          className={`px-2 pb-3 ${collapsed ? 'flex justify-center pt-3' : ''}`}
        >
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 text-xs"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}