import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Check } from 'lucide-react';
import { useAppData } from '@/lib/store';
import { Threat, ThreatCategory, ThreatLevel, ThreatStatus } from '@/lib/types';
import { PageHeader } from '@/components/tactical';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/pages/Prep';
import { cn } from '@/lib/utils';

const CATEGORIES: { id: ThreatCategory; label: string }[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'civil', label: 'Civil' },
  { id: 'health', label: 'Health' },
  { id: 'security', label: 'Security' },
  { id: 'other', label: 'Other' },
];

const LEVELS: ThreatLevel[] = ['low', 'medium', 'high'];
const STATUSES: { id: ThreatStatus; label: string }[] = [
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'active', label: 'Active' },
  { id: 'mitigated', label: 'Mitigated' },
];

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  activeClass = 'bg-[#6B7A4A] border-[#6B7A4A] text-white',
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  activeClass?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors',
            value === o.id
              ? activeClass
              : 'bg-[#242824] border-[#3A3F3A] text-[#9A9890] hover:text-[#E8E4DC]'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AddThreat() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id') ?? undefined;
  const { threats, addThreat, updateThreat } = useAppData();
  const existing = id ? threats.find((t) => t.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<ThreatCategory>(existing?.category ?? 'natural');
  const [likelihood, setLikelihood] = useState<ThreatLevel>(existing?.likelihood ?? 'medium');
  const [impact, setImpact] = useState<ThreatLevel>(existing?.impact ?? 'medium');
  const [status, setStatus] = useState<ThreatStatus>(existing?.status ?? 'monitoring');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [latInput, setLatInput] = useState(
    existing?.coordinates ? String(existing.coordinates.latitude) : ''
  );
  const [lngInput, setLngInput] = useState(
    existing?.coordinates ? String(existing.coordinates.longitude) : ''
  );

  const canSave = name.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    const coordinates =
      !isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : undefined;
    const payload: Threat = {
      id: existing?.id ?? `threat-${Date.now()}`,
      name: name.trim(),
      category,
      likelihood,
      impact,
      status,
      notes: notes.trim() || undefined,
      coordinates,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      updateThreat(payload);
    } else {
      addThreat(payload);
    }
    navigate('/threats');
  }, [canSave, name, category, likelihood, impact, status, notes, latInput, lngInput, existing, addThreat, updateThreat, navigate]);

  return (
    <div>
      <PageHeader
        title={existing ? 'EDIT THREAT' : 'ADD THREAT'}
        subtitle="Triage a local hazard by likelihood and impact"
        onBack={() => navigate('/threats')}
      />

      <div className="space-y-1">
        <Field label="NAME">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flash flooding on Route 9"
            className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860]"
          />
        </Field>

        <Field label="CATEGORY">
          <ChoiceChips options={CATEGORIES} value={category} onChange={(v) => setCategory(v)} />
        </Field>

        <Field label="LIKELIHOOD">
          <ChoiceChips
            options={LEVELS.map((l) => ({ id: l, label: l.toUpperCase() }))}
            value={likelihood}
            onChange={(v) => setLikelihood(v)}
          />
        </Field>

        <Field label="IMPACT">
          <ChoiceChips
            options={LEVELS.map((l) => ({ id: l, label: l.toUpperCase() }))}
            value={impact}
            onChange={(v) => setImpact(v)}
          />
        </Field>

        <Field label="STATUS">
          <ChoiceChips options={STATUSES} value={status} onChange={(v) => setStatus(v)} />
        </Field>

        <Field label="LOCATION (OPTIONAL — FOR MAP PIN)">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[#9A9890] mb-1">Lat</div>
              <Input
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="38.6270"
                inputMode="decimal"
                className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860]"
              />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[#9A9890] mb-1">Lng</div>
              <Input
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                placeholder="-90.1994"
                inputMode="decimal"
                className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860]"
              />
            </div>
          </div>
        </Field>

        <Field label="NOTES (OPTIONAL)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mitigations, watch conditions, who monitors it..."
            className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] min-h-[88px]"
          />
        </Field>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-bold transition-colors mt-6',
          canSave
            ? 'bg-[#6B7A4A] hover:bg-[#7A8A55] text-white'
            : 'bg-[#6B7A4A]/40 text-white/40 cursor-not-allowed'
        )}
      >
        <Check className="w-4 h-4" /> {existing ? 'Save Changes' : 'Add Threat'}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-[#6A6860]">
        <ShieldAlert className="w-3 h-3" />
        Severity is computed from likelihood × impact and drives sorting and alerts.
      </div>
    </div>
  );
}
