import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Vibrate,
  ShieldCheck,
  Smartphone,
  Info,
  ScrollText,
  Radio,
  BatteryMedium,
  Wifi,
  Compass,
} from 'lucide-react';
import { useAppData } from '@/lib/store';
import { TCard, SectionTitle } from '@/components/tactical';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/pages/Prep';
import { CHECK_IN_INTERVAL_OPTIONS } from '@/lib/checkin';
import {
  isNotificationSupported,
  isVibrateSupported,
  isSpeechSupported,
  isCompassSupported,
  useBattery,
  useOnlineStatus,
  ensureNotificationPermission,
} from '@/lib/device';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const {
    groupName,
    updateGroupName,
    checkInIntervalHours,
    updateCheckInInterval,
    remindersEnabled,
    updateRemindersEnabled,
    shakeSosEnabled,
    updateShakeSos,
    alertLevel,
  } = useAppData();

  const [nameDialog, setNameDialog] = useState(false);
  const [name, setName] = useState(groupName);
  const battery = useBattery();
  const online = useOnlineStatus();

  const capabilities = [
    { icon: Radio, label: 'Notifications', supported: isNotificationSupported(), detail: isNotificationSupported() ? `Permission: ${Notification.permission}` : 'Not supported in this browser' },
    { icon: Vibrate, label: 'Haptics', supported: isVibrateSupported(), detail: isVibrateSupported() ? 'Vibration API' : 'Not supported in this browser' },
    { icon: ShieldCheck, label: 'Read Aloud', supported: isSpeechSupported(), detail: isSpeechSupported() ? 'Web Speech synthesis' : 'Not supported in this browser' },
    { icon: Compass, label: 'Compass', supported: isCompassSupported(), detail: isCompassSupported() ? 'Device orientation' : 'Not supported in this browser' },
    { icon: BatteryMedium, label: 'Battery', supported: battery.supported, detail: battery.supported ? 'Battery Status API' : 'Not supported in this browser' },
    { icon: Wifi, label: 'Network', supported: true, detail: online ? 'Online' : 'Offline' },
  ];

  const toggleReminders = async (enabled: boolean) => {
    if (enabled) {
      const granted = await ensureNotificationPermission();
      if (!granted) return; // switch stays off
    }
    updateRemindersEnabled(enabled);
  };

  return (
    <div>
      <h1 className="text-lg gd-label text-[#E8E4DC] mb-4">SETTINGS</h1>

      <SectionTitle className="mt-1">GROUP</SectionTitle>
      <TCard className="px-3">
        <button
          onClick={() => {
            setName(groupName);
            setNameDialog(true);
          }}
          className="w-full flex items-center justify-between py-3.5 text-left"
          data-testid="edit-group-name"
        >
          <span className="text-[13px] font-semibold text-[#E8E4DC]">Group name</span>
          <span className="text-xs text-[#9A9890]">{groupName}</span>
        </button>
        <div className="border-t border-[#3A3F3A] py-3.5">
          <div className="text-[13px] font-semibold text-[#E8E4DC] mb-2">Alert level</div>
          <div className="flex gap-1.5">
            {(['green', 'amber', 'red'] as const).map((level) => (
              <button
                key={level}
                onClick={() => navigate('/')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[10px] gd-label border transition-colors',
                  alertLevel === level
                    ? level === 'green'
                      ? 'bg-[#4CAF50] border-[#4CAF50] text-white'
                      : level === 'amber'
                      ? 'bg-[#FFC107] border-[#FFC107] text-[#1A1D1A]'
                      : 'bg-[#F44336] border-[#F44336] text-white'
                    : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]'
                )}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </TCard>

      <SectionTitle>CHECK-INS</SectionTitle>
      <TCard className="p-4">
        <div className="text-[13px] font-semibold text-[#E8E4DC] mb-3">Expected check-in interval</div>
        <div className="flex flex-wrap gap-1.5">
          {CHECK_IN_INTERVAL_OPTIONS.map((h) => (
            <button
              key={h}
              onClick={() => updateCheckInInterval(h)}
              data-testid={`interval-${h}`}
              className={cn(
                'px-4 py-2 rounded-lg text-[11px] gd-label border transition-colors',
                checkInIntervalHours === h
                  ? 'bg-[#8B5A1A] border-[#D4822A] text-[#E8A04A]'
                  : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890] hover:text-[#E8E4DC]'
              )}
            >
              {h}H
            </button>
          ))}
        </div>
      </TCard>

      <SectionTitle>REMINDERS & SENSORS</SectionTitle>
      <TCard className="px-3">
        <div className="flex items-center gap-3 py-3.5 border-b border-[#3A3F3A]">
          <Bell className="w-4 h-4 text-[#8B9A6A] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#E8E4DC]">Reminders</div>
            <div className="text-[11px] text-[#6A6860]">
              {remindersEnabled
                ? 'Overdue check-ins and expiring supplies shown while the app is open'
                : 'Browser notifications when overdue or expiring'}
            </div>
          </div>
          <Switch
            checked={remindersEnabled}
            onCheckedChange={toggleReminders}
            disabled={!isNotificationSupported()}
            data-testid="reminders-switch"
          />
        </div>
        <div className="flex items-center gap-3 py-3.5">
          <Vibrate className="w-4 h-4 text-[#8B9A6A] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#E8E4DC]">Shake for SOS</div>
            <div className="text-[11px] text-[#6A6860]">
              Not available on web — use the Lantern SOS button instead
            </div>
          </div>
          <Switch checked={false} onCheckedChange={() => undefined} disabled />
        </div>
      </TCard>
      {shakeSosEnabled && !isVibrateSupported() && (
        <div className="text-[11px] text-[#6A6860] mt-2 px-1">
          Shake detection requires device motion sensors this browser doesn't expose.
        </div>
      )}

      <SectionTitle>DEVICE CAPABILITIES</SectionTitle>
      <TCard className="px-3">
        {capabilities.map(({ icon: Icon, label, supported, detail }, i) => (
          <div key={label} className={`flex items-center gap-3 py-3 ${i < capabilities.length - 1 ? 'border-b border-[#3A3F3A]' : ''}`}>
            <Icon className={`w-4 h-4 shrink-0 ${supported ? 'text-[#4CAF50]' : 'text-[#6A6860]'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#E8E4DC]">{label}</div>
              <div className="text-[11px] text-[#6A6860]">{detail}</div>
            </div>
            <span
              className="text-[9px] gd-label rounded px-1.5 py-0.5"
              style={{
                backgroundColor: supported ? '#4CAF5022' : '#6A686022',
                color: supported ? '#4CAF50' : '#6A6860',
              }}
            >
              {supported ? 'ACTIVE' : 'N/A'}
            </span>
          </div>
        ))}
      </TCard>

      <SectionTitle>ABOUT</SectionTitle>
      <TCard className="px-3">
        <button onClick={() => navigate('/help')} className="w-full flex items-center gap-3 py-3.5 border-b border-[#3A3F3A] text-left">
          <Info className="w-4 h-4 text-[#8B9A6A]" />
          <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC]">Help / FAQ</span>
        </button>
        <button onClick={() => navigate('/legal')} className="w-full flex items-center gap-3 py-3.5 text-left">
          <ScrollText className="w-4 h-4 text-[#8B9A6A]" />
          <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC]">Legal & Privacy</span>
        </button>
      </TCard>

      <div className="mt-8 text-center text-[10px] text-[#6A6860] leading-relaxed">
        GRIDDOWN WEB · PREPAREDNESS PLANNER, NOT AN EMERGENCY SERVICE
        <br />
        © 2026 GRIDDOWN · FORECASTS BY OPEN-METEO · MAP TILES © OPENSTREETMAP
      </div>

      <Dialog open={nameDialog} onOpenChange={setNameDialog}>
        <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC]">
          <DialogHeader>
            <DialogTitle className="gd-label text-sm">GROUP NAME</DialogTitle>
          </DialogHeader>
          <Field label="NAME">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Button
            onClick={() => {
              if (name.trim()) updateGroupName(name.trim());
              setNameDialog(false);
            }}
            className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs"
          >
            SAVE
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
