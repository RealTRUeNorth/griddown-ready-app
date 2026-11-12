import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, ShieldAlert, CloudLightning, Pencil, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/lib/store';
import { Threat, ThreatCategory, ThreatLevel, ThreatStatus } from '@/lib/types';
import { TCard, SectionTitle, Chip } from '@/components/tactical';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SEVERITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

export function severity(likelihood: ThreatLevel, impact: ThreatLevel): ThreatLevel {
  const score = SEVERITY_ORDER[likelihood] * SEVERITY_ORDER[impact];
  return score >= 9 ? 'high' : score >= 4 ? 'medium' : 'low';
}

export const SEVERITY_COLOR: Record<ThreatLevel, string> = {
  high: '#F44336',
  medium: '#FFC107',
  low: '#4CAF50',
};

export const CATEGORY_LABEL: Record<ThreatCategory, string> = {
  natural: 'Natural',
  infrastructure: 'Infrastructure',
  civil: 'Civil',
  health: 'Health',
  security: 'Security',
  other: 'Other',
};

export const STATUS_LABEL: Record<ThreatStatus, string> = {
  monitoring: 'Monitoring',
  active: 'Active',
  mitigated: 'Mitigated',
};

type SortId = 'severity' | 'recent';

export default function Threats() {
  const navigate = useNavigate();
  const { threats, removeThreat, addPoi, updateAlertLevel, alertLevel } = useAppData();
  const [sortBy, setSortBy] = useState<SortId>('severity');
  const [deleteTarget, setDeleteTarget] = useState<Threat | null>(null);

  const sorted = useMemo(() => {
    const list = [...threats];
    if (sortBy === 'severity') {
      list.sort((a, b) => {
        const sa = SEVERITY_ORDER[severity(a.likelihood, a.impact)];
        const sb = SEVERITY_ORDER[severity(b.likelihood, b.impact)];
        if (sb !== sa) return sb - sa;
        return a.updatedAt < b.updatedAt ? 1 : -1;
      });
    } else {
      list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    return list;
  }, [threats, sortBy]);

  const activeCount = threats.filter((t) => t.status === 'active').length;

  const handlePinToMap = useCallback(
    (threat: Threat) => {
      if (!threat.coordinates) return;
      addPoi({
        id: `poi-threat-${threat.id}-${Date.now()}`,
        name: threat.name,
        category: 'hazard',
        coordinates: threat.coordinates,
        notes: `Pinned from Threat Register. ${threat.notes ?? ''}`.trim(),
        createdAt: new Date().toISOString(),
      });
      toast.success(`"${threat.name}" is now a hazard marker on the Map tab`);
    },
    [addPoi]
  );

  const handleRaiseAlert = useCallback(
    (threat: Threat) => {
      const target: 'amber' | 'red' = severity(threat.likelihood, threat.impact) === 'high' ? 'red' : 'amber';
      const order = ['green', 'amber', 'red'];
      if (order.indexOf(alertLevel) >= order.indexOf(target)) {
        toast.info(`Alert level is already ${alertLevel.toUpperCase()}`);
        return;
      }
      updateAlertLevel(target);
      toast.warning(`Group alert level raised to ${target.toUpperCase()}`);
    },
    [alertLevel, updateAlertLevel]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg gd-label text-[#E8E4DC]">THREAT REGISTER</h1>
        <button
          onClick={() => setSortBy((s) => (s === 'severity' ? 'recent' : 'severity'))}
          className="text-[9px] gd-label bg-[#242824] border border-[#3A3F3A] rounded px-2.5 py-1.5 text-[#6A6860] hover:text-[#E8E4DC] transition-colors"
        >
          {sortBy === 'severity' ? 'BY SEVERITY' : 'BY RECENT'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert
          className="w-4 h-4"
          style={{ color: activeCount > 0 ? '#F44336' : '#8B9A6A' }}
        />
        <span className="text-[13px] font-semibold text-[#9A9890]">
          {threats.length} tracked
          {activeCount > 0 ? ` · ${activeCount} active` : ' · none active'}
        </span>
      </div>

      {sorted.map((threat) => {
        const sev = severity(threat.likelihood, threat.impact);
        const sevColor = SEVERITY_COLOR[sev];
        return (
          <div
            key={threat.id}
            className={cn(
              'flex bg-[#242824] border rounded-xl mb-2.5 overflow-hidden',
              threat.status === 'active' ? 'border-[#F44336]' : 'border-[#3A3F3A]'
            )}
          >
            <div className="w-1 shrink-0" style={{ backgroundColor: sevColor }} />
            <div className="flex-1 p-3.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[15px] font-bold text-[#E8E4DC] truncate">{threat.name}</span>
                <Chip label={sev.toUpperCase()} color={sevColor} />
              </div>
              <div className="text-[11px] font-semibold text-[#6A6860] mt-1">
                {CATEGORY_LABEL[threat.category]} · L: {threat.likelihood} · I: {threat.impact} ·{' '}
                {STATUS_LABEL[threat.status]}
              </div>
              {threat.notes && (
                <div className="text-xs text-[#9A9890] leading-relaxed mt-1.5 line-clamp-3">{threat.notes}</div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <button
                  onClick={() => navigate(`/add-threat?id=${threat.id}`)}
                  className="flex items-center gap-1 bg-[#333833] rounded px-2 py-1 text-[9px] gd-label font-bold text-[#9A9890] hover:text-[#E8E4DC] transition-colors"
                >
                  <Pencil className="w-3 h-3" /> EDIT
                </button>
                {threat.coordinates && (
                  <button
                    onClick={() => handlePinToMap(threat)}
                    className="flex items-center gap-1 bg-[#333833] rounded px-2 py-1 text-[9px] gd-label font-bold text-[#E8A04A] hover:text-[#FFC107] transition-colors"
                  >
                    <MapPin className="w-3 h-3" /> PIN TO MAP
                  </button>
                )}
                {threat.status === 'active' && (
                  <button
                    onClick={() => handleRaiseAlert(threat)}
                    className="flex items-center gap-1 bg-[#333833] rounded px-2 py-1 text-[9px] gd-label font-bold text-[#F44336] hover:text-[#FF6659] transition-colors"
                  >
                    <ArrowUp className="w-3 h-3" /> RAISE ALERT
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(threat)}
                  className="ml-auto p-1 text-[#6A6860] hover:text-[#F44336] transition-colors"
                  aria-label="Delete threat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {threats.length === 0 && (
        <div className="flex flex-col items-center py-9 gap-2 mb-2">
          <CloudLightning className="w-8 h-8 text-[#6A6860]" />
          <div className="text-sm font-semibold text-[#9A9890]">No threats tracked yet</div>
          <div className="text-xs text-[#6A6860] text-center leading-relaxed px-6">
            Log local hazards — flood zones, storm seasons, unsafe areas — and triage them here.
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/add-threat')}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] text-[13px] gd-label font-bold transition-colors mt-2"
      >
        <Plus className="w-4 h-4" /> ADD THREAT
      </button>

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC]">
          <DialogHeader>
            <DialogTitle className="gd-label text-sm">REMOVE THREAT</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[#9A9890]">
            Remove "{deleteTarget?.name}" from the register?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-lg bg-[#333833] border border-[#4A504A] text-xs gd-label text-[#9A9890] hover:text-[#E8E4DC] transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={() => {
                if (deleteTarget) {
                  removeThreat(deleteTarget.id);
                  toast.success('Threat removed');
                }
                setDeleteTarget(null);
              }}
              className="flex-1 py-2.5 rounded-lg bg-[#F44336] text-white text-xs gd-label font-bold hover:bg-[#FF6659] transition-colors"
            >
              REMOVE
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <SectionTitle className="mt-6">TRIAGE GUIDE</SectionTitle>
      <p className="text-xs text-[#6A6860] leading-relaxed -mt-2">
        Likelihood × impact gives severity: high/high or near it is HIGH (red), mixed mids are
        MEDIUM (amber). Raise the group alert level only from ACTIVE threats.
      </p>
    </div>
  );
}
