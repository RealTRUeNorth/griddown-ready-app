import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Shell from '@/components/Shell';
import { AppProvider, useAppData } from '@/lib/store';
import Onboarding from '@/pages/Onboarding';
import Status from '@/pages/Status';
import Prep from '@/pages/Prep';
import Weather from '@/pages/Weather';
import MapPage from '@/pages/MapPage';
import Comms from '@/pages/Comms';
import Intel from '@/pages/Intel';
import GuideDetail from '@/pages/GuideDetail';
import ChecklistDetail from '@/pages/ChecklistDetail';
import MemberDetail from '@/pages/MemberDetail';
import Settings from '@/pages/Settings';
import Lantern from '@/pages/Lantern';
import HelpFaq from '@/pages/HelpFaq';
import Legal from '@/pages/Legal';
import NotFound from '@/pages/NotFound';
import {
  isNotificationSupported,
  ensureNotificationPermission,
  showNotification,
} from '@/lib/device';
import { getCheckInState, overdueBy } from '@/lib/checkin';
import { getInventoryAlerts } from '@/lib/supplyAlerts';

/** In-page reminder watchdog: while the tab is open and Reminders are on,
 *  surface browser notifications for overdue check-ins and supply alerts. */
function ReminderWatchdog() {
  const { remindersEnabled, members, supplies, checkInIntervalHours } = useAppData();

  useEffect(() => {
    if (!remindersEnabled || !isNotificationSupported()) return;
    void ensureNotificationPermission();
    const notify = () => {
      const overdue = members.filter((m) => {
        const s = getCheckInState(m, checkInIntervalHours);
        return s === 'overdue' || s === 'never';
      });
      if (overdue.length > 0) {
        const names = overdue.map((m) => m.name).join(', ');
        const who = overdueBy(overdue[0], checkInIntervalHours);
        showNotification('CHECK-IN OVERDUE', `${names} ${who ?? 'has not checked in'}`);
      }
      const alerts = getInventoryAlerts(supplies);
      const expired = [...alerts.expired, ...alerts.expiringSoon];
      if (expired.length > 0) {
        showNotification('SUPPLY ALERT', `${expired[0].name}${expired.length > 1 ? ` +${expired.length - 1} more` : ''} needs attention`);
      }
    };
    notify();
    const interval = window.setInterval(notify, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [remindersEnabled, members, supplies, checkInIntervalHours]);

  return null;
}

function AppInner() {
  const { onboardingComplete } = useAppData();
  return (
    <>
      {!onboardingComplete && <Onboarding />}
      <ReminderWatchdog />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Status />} />
          <Route path="/prep" element={<Prep />} />
          <Route path="/prep/weather" element={<Weather />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/comms" element={<Comms />} />
          <Route path="/intel" element={<Intel />} />
          <Route path="/guides/:id" element={<GuideDetail />} />
          <Route path="/checklists/:id" element={<ChecklistDetail />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/lantern" element={<Lantern />} />
          <Route path="/help" element={<HelpFaq />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/index.html" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

const App = () => (
  <AppProvider>
    <TooltipProvider>
      <Toaster position="bottom-center" richColors
        toastOptions={{
          style: { backgroundColor: '#242824', color: '#E8E4DC', border: '1px solid #3A3F3A' },
        }}
      />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </TooltipProvider>
  </AppProvider>
);

export default App;
