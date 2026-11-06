import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Shield,
  Package,
  Map,
  Radio,
  BookOpen,
  Settings,
  Flashlight,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppData } from '@/lib/store';
import { isReadAloudSupported, stopSpeaking } from '@/lib/readAloud';

const tabs = [
  { to: '/', label: 'STATUS', icon: Shield, end: true },
  { to: '/prep', label: 'PREP', icon: Package, end: false },
  { to: '/map', label: 'MAP', icon: Map, end: false },
  { to: '/comms', label: 'COMMS', icon: Radio, end: false },
  { to: '/intel', label: 'INTEL', icon: BookOpen, end: false },
];

const alertColors: Record<string, string> = {
  green: '#4CAF50',
  amber: '#FFC107',
  red: '#F44336',
};

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[#3A3F3A]">
      <div className="w-8 h-8 rounded-lg bg-[#333833] border border-[#4A504A] flex items-center justify-center">
        <Shield className="w-4 h-4 text-[#D4822A]" />
      </div>
      <div>
        <div className="gd-label text-sm text-[#E8E4DC] leading-none">GRIDDOWN</div>
        <div className="text-[9px] text-[#6A6860] tracking-[0.2em] mt-1">TACTICAL PLANNER</div>
      </div>
    </div>
  );
}

function SidebarNav() {
  const { alertLevel, groupName } = useAppData();
  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 h-screen sticky top-0 bg-[#1E221E] border-r border-[#3A3F3A]">
      <BrandMark />
      <nav className="flex-1 p-3 space-y-1">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs gd-label transition-colors',
                isActive
                  ? 'bg-[#333833] text-[#E8A04A] border border-[#4A504A]'
                  : 'text-[#9A9890] hover:text-[#E8E4DC] hover:bg-[#242824] border border-transparent'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
        <div className="pt-3 mt-3 border-t border-[#3A3F3A] space-y-1">
          <NavLink
            to="/lantern"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs gd-label transition-colors border',
                isActive
                  ? 'bg-[#333833] text-[#E8A04A] border-[#4A504A]'
                  : 'text-[#9A9890] hover:text-[#E8E4DC] hover:bg-[#242824] border-transparent'
              )
            }
          >
            <Flashlight className="w-4 h-4" />
            LANTERN
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs gd-label transition-colors border',
                isActive
                  ? 'bg-[#333833] text-[#E8A04A] border-[#4A504A]'
                  : 'text-[#9A9890] hover:text-[#E8E4DC] hover:bg-[#242824] border-transparent'
              )
            }
          >
            <Settings className="w-4 h-4" />
            SETTINGS
          </NavLink>
        </div>
      </nav>
      <div className="p-4 border-t border-[#3A3F3A] space-y-2">
        <NavLink
          to="/help"
          className="flex items-center gap-2 text-[10px] gd-label text-[#6A6860] hover:text-[#9A9890] transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" /> HELP / FAQ
        </NavLink>
        <div className="flex items-center gap-2 text-[10px] text-[#6A6860]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alertColors[alertLevel] }} />
          <span className="truncate">{groupName.toUpperCase()}</span>
        </div>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  const { alertLevel, groupName } = useAppData();
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-[#1E221E]/95 backdrop-blur border-b border-[#3A3F3A]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[#333833] border border-[#4A504A] flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-[#D4822A]" />
        </div>
        <span className="gd-label text-sm text-[#E8E4DC]">GRIDDOWN</span>
      </div>
      <NavLink to="/settings" className="flex items-center gap-2 text-[10px] gd-label text-[#9A9890]">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alertColors[alertLevel] }} />
        <span className="max-w-28 truncate">{groupName.toUpperCase()}</span>
        <Settings className="w-4 h-4" />
      </NavLink>
    </header>
  );
}

function MobileTabBar() {
  return (
    <nav className="md:hidden sticky bottom-0 z-40 flex bg-[#1E221E]/95 backdrop-blur border-t border-[#3A3F3A] pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] gd-label transition-colors',
              isActive ? 'text-[#E8A04A]' : 'text-[#6A6860]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(232,160,74,0.4)]')} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Shell() {
  const location = useLocation();
  // Stop any guide read-aloud when navigating away
  React.useEffect(() => {
    if (isReadAloudSupported()) stopSpeaking();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#1A1D1A] gd-grid-bg">
      <div className="flex">
        <SidebarNav />
        <div className="flex-1 min-w-0 min-h-screen flex flex-col">
          <MobileTopBar />
          <main className="flex-1 w-full max-w-3xl lg:max-w-4xl mx-auto px-4 py-5 pb-24 md:pb-8">
            <Outlet />
          </main>
          <MobileTabBar />
        </div>
      </div>
    </div>
  );
}
