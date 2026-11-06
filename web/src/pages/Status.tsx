import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Package,
  CheckSquare,
  BookOpen,
  AlertTriangle,
  Radio,
  Zap,
  Clock,
  Flashlight,
  BatteryMedium,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAppData } from '@/lib/store';
import { AlertLevel, SupplyItem } from '@/lib/types';
import { getInventoryAlerts } from '@/lib/supplyAlerts';
import { useBattery, useOnlineStatus, vibrate } from '@/lib/device';
import {
  getCheckInState,
  checkInStatusLabel,
  checkInStatusColor,
  formatTimeSince,
  overdueBy,
} from '@/lib/checkin';
import { StatCard, SectionTitle, TCard, Chip, ProgressBar, LocalDataFooter } from '@/components/tactical';
import { cn } from '@/lib/utils';

export const alertConfig: Record<AlertLevel, { label: string; color: string; bgColor: string; description: string }> = {
  green: {
    label: 'ALL CLEAR',
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.15)',
    description: 'Normal operations. Continue monitoring.',
  },
  amber: {
    label: 'ELEVATED',
    color: '#FFC107',
    bgColor: 'rgba(255, 193, 7, 0.15)',
    description: 'Heightened awareness. Review checklists.',
  },
  red: {
    label: 'RED ALERT',
    color: '#F44336',
    bgColor: 'rgba(244, 67, 54, 0.15)',
    description: 'Execute emergency protocols now.',
  },
};

const alertLevels: AlertLevel[] = ['green', 'amber', 'red'];

export default function Status() {
  const navigate = useNavigate();
  const {
    alertLevel,
    updateAlertLevel,
    members,
    supplies,
    checklists,
    supplyStats,
    checklistStats,
    checkInIntervalHours,
  } = useAppData();

  const currentAlert = alertConfig[alertLevel];
  const readyMembers = members.filter((m) => m.status === 'ready').length;
  const battery = useBattery();
  const isOnline = useOnlineStatus();

  const batteryText = battery.levelPercent >= 0 ? `${battery.levelPercent}%` : '--';
  const batteryColor =
    battery.levelPercent < 0
      ? '#9A9890'
      : battery.levelPercent <= 20
      ? '#F44336'
      : battery.levelPercent <= 40
      ? '#FFC107'
      : '#4CAF50';

  const inventoryAlertRows = useMemo(() => {
    const summary = getInventoryAlerts(supplies);
    const map = new Map<string, { item: SupplyItem; reasons: { label: string; color: string }[] }>();
    const push = (item: SupplyItem, label: string, color: string) => {
      const entry = map.get(item.id) ?? { item, reasons: [] };
      entry.reasons.push({ label, color });
      map.set(item.id, entry);
    };
    summary.expired.forEach((i) => push(i, 'EXPIRED', '#F44336'));
    summary.low.forEach((i) => push(i, 'LOW STOCK', '#F44336'));
    summary.expiringSoon.forEach((i) => push(i, 'EXPIRES SOON', '#FFC107'));
    return [...map.values()];
  }, [supplies]);

  const checkInRows = useMemo(
    () =>
      members.map((m) => {
        const state = getCheckInState(m, checkInIntervalHours);
        return { member: m, state, overdue: overdueBy(m, checkInIntervalHours) };
      }),
    [members, checkInIntervalHours]
  );

  const overdueCount = useMemo(
    () => checkInRows.filter((r) => r.state === 'overdue' || r.state === 'never').length,
    [checkInRows]
  );

  const totalChecked = checklistStats.reduce((sum, s) => sum + s.completed, 0);
  const totalItems = checklistStats.reduce((sum, s) => sum + s.total, 0);
  const overallPercent = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const bugOutChecklist = checklists.find((c) => /bug.?out/i.test(c.title)) ?? checklists[0];
  const commsChecklist = checklists.find((c) => /comms/i.test(c.title)) ?? checklists[1];
  
  const firstAidGuide = '/guides/g2';

  const handleAlertChange = useCallback(
    (level: AlertLevel) => {
      vibrate(30);
      updateAlertLevel(level);
    },
    [updateAlertLevel]
  );

  return (
    <div>
      <TCard className="p-4 mb-4" >
        <div style={{ backgroundColor: 'transparent' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle style={{ color: currentAlert.color }} className="w-5 h-5" />
            <span className="text-base gd-label" style={{ color: currentAlert.color }}>
              {currentAlert.label}
            </span>
          </div>
          <p className="text-[13px] text-[#9A9890] mb-3.5">{currentAlert.description}</p>
          <div className="flex gap-2">
            {alertLevels.map((level) => {
              const config = alertConfig[level];
              const isActive = alertLevel === level;
              return (
                <button
                  key={level}
                  data-testid={`alert-${level}`}
                  onClick={() => handleAlertChange(level)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-xs gd-label border transition-all',
                    isActive ? 'text-white' : 'bg-[#242824] text-[#9A9890] hover:text-[#E8E4DC]'
                  )}
                  style={{
                    backgroundColor: isActive ? config.color : undefined,
                    borderColor: isActive ? config.color : '#3A3F3A',
                  }}
                >
                  {level.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </TCard>

      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <StatCard
          icon={<Users className="w-5 h-5 text-[#8B9A6A]" />}
          label="PERSONNEL"
          value={`${readyMembers}/${members.length}`}
          sublabel={overdueCount > 0 ? `${overdueCount} overdue` : 'Ready'}
          alert={overdueCount > 0}
          onClick={() => navigate('/intel/group')}
          testId="stat-personnel"
        />
        <StatCard
          icon={<Package className="w-5 h-5 text-[#E8A04A]" />}
          label="SUPPLIES"
          value={`${supplies.length}`}
          sublabel={supplyStats.low > 0 ? `${supplyStats.low} low` : 'Stocked'}
          alert={supplyStats.low > 0}
          onClick={() => navigate('/prep')}
          testId="stat-supplies"
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5 text-[#6AAB6A]" />}
          label="READINESS"
          value={`${overallPercent}%`}
          sublabel={`${totalChecked}/${totalItems} items`}
          onClick={() => navigate('/prep?tab=checklists')}
          testId="stat-readiness"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-[#E8C04A]" />}
          label="GUIDES"
          value="8"
          sublabel="Available"
          onClick={() => navigate('/intel')}
          testId="stat-guides"
        />
      </div>

      <SectionTitle>DEVICE STATUS</SectionTitle>
      <TCard className="px-3">
        <button
          className="w-full flex items-center gap-2 py-3 text-left border-b border-[#3A3F3A] hover:opacity-80 transition-opacity"
          onClick={() => navigate('/lantern')}
          data-testid="device-lantern"
        >
          <Flashlight className="w-4 h-4 text-[#E8C04A]" />
          <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC]">Lantern</span>
          <span className="text-xs font-bold text-[#E8E4DC]">Screen Light · SOS</span>
        </button>
        <div className="flex items-center gap-2 py-3 border-b border-[#3A3F3A]">
          <BatteryMedium style={{ color: batteryColor }} className="w-4 h-4" />
          <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC]">Battery</span>
          <span className="text-xs font-bold" style={{ color: batteryColor }}>
            {batteryText}
            {battery.isCharging ? ' · charging' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 py-3">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-[#4CAF50]" />
          ) : (
            <WifiOff className="w-4 h-4 text-[#F44336]" />
          )}
          <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC]">Network</span>
          <span
            className="text-xs font-bold"
            style={{ color: isOnline ? '#4CAF50' : '#F44336' }}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </TCard>

      {inventoryAlertRows.length > 0 && (
        <>
          <SectionTitle>INVENTORY ALERTS</SectionTitle>
          <div className="space-y-2">
            {inventoryAlertRows.map(({ item, reasons }) => (
              <TCard
                key={item.id}
                onClick={() => navigate('/prep?tab=supplies')}
                className="p-3 flex items-center gap-2.5"
              >
                <AlertTriangle style={{ color: reasons[0].color }} className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#E8E4DC] truncate">{item.name}</div>
                  <div className="text-[11px] text-[#6A6860] truncate">
                    {item.quantity} {item.unit}
                    {item.expirationDate ? ` · Exp ${item.expirationDate}` : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {reasons.map((r) => (
                    <Chip key={r.label} label={r.label} color={r.color} />
                  ))}
                </div>
              </TCard>
            ))}
          </div>
        </>
      )}

      {members.length > 0 && (
        <>
          <SectionTitle>CHECK-IN STATUS · EVERY {checkInIntervalHours}H</SectionTitle>
          <TCard className="px-3 py-1">
            {checkInRows.map(({ member, state, overdue }, i) => (
              <button
                key={member.id}
                onClick={() => navigate(`/members/${member.id}`)}
                className={cn(
                  'w-full flex items-center gap-2 py-2.5 text-left hover:opacity-80 transition-opacity',
                  i < checkInRows.length - 1 && 'border-b border-[#3A3F3A]'
                )}
              >
                <Clock style={{ color: checkInStatusColor(state) }} className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC] truncate">
                  {member.name}
                </span>
                <span className="text-[11px] text-[#6A6860] shrink-0">
                  {member.lastCheckInAt ? formatTimeSince(member.lastCheckInAt) : 'never'}
                </span>
                <Chip
                  label={overdue ?? checkInStatusLabel(state)}
                  color={checkInStatusColor(state)}
                  className="shrink-0"
                />
              </button>
            ))}
          </TCard>
        </>
      )}

      <SectionTitle>QUICK ACCESS</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {bugOutChecklist && (
          <QuickAction
            icon={<Zap className="w-5 h-5 text-[#D4822A]" />}
            label="Bug-Out Bag"
            onClick={() => navigate(`/checklists/${bugOutChecklist.id}`)}
          />
        )}
        {commsChecklist && (
          <QuickAction
            icon={<Radio className="w-5 h-5 text-[#D4822A]" />}
            label="Comms Plan"
            onClick={() => navigate(`/checklists/${commsChecklist.id}`)}
          />
        )}
        <QuickAction
          icon={<Shield className="w-5 h-5 text-[#D4822A]" />}
          label="Security"
          onClick={() => navigate('/guides/g6')}
        />
        <QuickAction
          icon={<AlertTriangle className="w-5 h-5 text-[#D4822A]" />}
          label="First Aid"
          onClick={() => navigate('/guides/g2')}
        />
      </div>

      {checklists.length > 0 && (
        <>
          <SectionTitle>CHECKLIST STATUS</SectionTitle>
          <div className="space-y-2">
            {checklists.map((cl) => {
              const stat = checklistStats.find((s) => s.id === cl.id);
              if (!stat) return null;
              return (
                <TCard
                  key={cl.id}
                  onClick={() => navigate(`/checklists/${cl.id}`)}
                  className="p-3.5 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#E8E4DC]">{cl.title}</div>
                    <div className="text-[11px] text-[#6A6860] mt-0.5">
                      {stat.completed}/{stat.total} complete
                    </div>
                  </div>
                  <ProgressBar percent={stat.percent} className="w-24" />
                </TCard>
              );
            })}
          </div>
        </>
      )}

      <LocalDataFooter />
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <TCard onClick={onClick} className="p-4 flex flex-col items-center gap-2.5">
      <div className="w-11 h-11 rounded-full bg-[#8B5A1A] flex items-center justify-center">{icon}</div>
      <span className="text-xs font-semibold text-[#E8E4DC] text-center">{label}</span>
    </TCard>
  );
}
