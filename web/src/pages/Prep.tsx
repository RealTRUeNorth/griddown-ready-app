import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  AlertTriangle,
  CheckSquare,
  Package,
  Cloud,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAppData } from '@/lib/store';
import { SupplyCategory, SupplyItem } from '@/lib/types';
import { getExpirationStatus, isSupplyLow } from '@/lib/supplyAlerts';
import { SectionTitle, TCard, Chip, ProgressBar } from '@/components/tactical';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORIES: SupplyCategory[] = ['water', 'food', 'medical', 'tools', 'comms', 'shelter', 'clothing', 'documents', 'other'];

const CATEGORY_COLORS: Record<SupplyCategory, string> = {
  water: '#42A5F5',
  food: '#D4822A',
  medical: '#F44336',
  tools: '#9A9890',
  comms: '#4CAF50',
  shelter: '#8B9A6A',
  clothing: '#E8A04A',
  documents: '#FFC107',
  other: '#6A6860',
};

type Tab = 'supplies' | 'checklists';

export default function Prep() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'supplies';
  const setTab = (t: Tab) => setParams({ tab: t });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg gd-label text-[#E8E4DC]">PREP</h1>
        <button
          onClick={() => navigate('/prep/weather')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#242824] border border-[#3A3F3A] text-[10px] gd-label text-[#9A9890] hover:text-[#E8A04A] transition-colors"
          data-testid="weather-link"
        >
          <Cloud className="w-3.5 h-3.5" /> WEATHER
        </button>
      </div>
      <div className="flex gap-1.5 mb-4 bg-[#242824] border border-[#3A3F3A] rounded-xl p-1">
        {(['supplies', 'checklists'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-[11px] gd-label transition-colors flex items-center justify-center gap-1.5',
              tab === t ? 'bg-[#333833] text-[#E8A04A]' : 'text-[#9A9890] hover:text-[#E8E4DC]'
            )}
          >
            {t === 'supplies' ? <Package className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      {tab === 'supplies' ? <SuppliesTab /> : <ChecklistsTab />}
    </div>
  );
}

/* ── Supplies ─────────────────────────────────────────────── */

function SuppliesTab() {
  const { supplies, removeSupply } = useAppData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SupplyCategory | 'all'>('all');
  const [editing, setEditing] = useState<SupplyItem | 'new' | null>(null);

  const filtered = useMemo(() => {
    return supplies
      .filter((s) => (category === 'all' ? true : s.category === category))
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        const aAlert = isSupplyLow(a) || getExpirationStatus(a) === 'expired';
        const bAlert = isSupplyLow(b) || getExpirationStatus(b) === 'expired';
        return aAlert === bAlert ? a.name.localeCompare(b.name) : aAlert ? -1 : 1;
      });
  }, [supplies, category, query]);

  const usedCategories = useMemo(() => [...new Set(supplies.map((s) => s.category))], [supplies]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6860]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search supplies…"
            className="pl-9 bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] text-sm"
          />
        </div>
        <Button
          onClick={() => setEditing('new')}
          className="bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-[11px] gap-1.5"
          data-testid="add-supply"
        >
          <Plus className="w-4 h-4" /> ADD
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 mb-3">
        <CategoryPill active={category === 'all'} onClick={() => setCategory('all')} label="ALL" color="#9A9890" />
        {usedCategories.map((c) => (
          <CategoryPill
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
            label={c.toUpperCase()}
            color={CATEGORY_COLORS[c]}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#6A6860] text-sm">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No supplies match.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((item) => (
          <SupplyRow key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => removeSupply(item.id)} />
        ))}
      </div>

      <SupplyDialog
        open={editing !== null}
        item={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function CategoryPill({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 text-[9px] gd-label rounded-full px-3 py-1.5 border transition-colors"
      style={{
        backgroundColor: active ? `${color}22` : '#242824',
        borderColor: active ? color : '#3A3F3A',
        color: active ? color : '#9A9890',
      }}
    >
      {label}
    </button>
  );
}

function SupplyRow({ item, onEdit, onDelete }: { item: SupplyItem; onEdit: () => void; onDelete: () => void }) {
  const expStatus = getExpirationStatus(item);
  const low = isSupplyLow(item);
  return (
    <TCard className="p-3 flex items-center gap-3" testId={`supply-${item.id}`}>
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[item.category] }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#E8E4DC] truncate">{item.name}</span>
          {item.isSample && <Chip label="SAMPLE" color="#6A6860" />}
        </div>
        <div className="text-[11px] text-[#6A6860] mt-0.5">
          {item.quantity} {item.unit} · min {item.minimumQuantity}
          {item.expirationDate ? ` · exp ${item.expirationDate}` : ''}
        </div>
        {item.notes && <div className="text-[11px] text-[#9A9890] mt-0.5 line-clamp-1">{item.notes}</div>}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {expStatus === 'expired' && <Chip label="EXPIRED" color="#F44336" />}
        {expStatus === 'soon' && <Chip label="EXPIRES SOON" color="#FFC107" />}
        {low && <Chip label="LOW" color="#F44336" />}
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 text-[#9A9890] hover:text-[#E8A04A] transition-colors" aria-label="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-[#9A9890] hover:text-[#F44336] transition-colors"
            aria-label="Delete"
            data-testid={`delete-supply-${item.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </TCard>
  );
}

function SupplyDialog({ open, item, onClose }: { open: boolean; item: SupplyItem | null; onClose: () => void }) {
  const { addSupply, updateSupply } = useAppData();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SupplyCategory>('water');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('ea');
  const [minimumQuantity, setMinimumQuantity] = useState('1');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      setName(item?.name ?? '');
      setCategory(item?.category ?? 'water');
      setQuantity(String(item?.quantity ?? '1'));
      setUnit(item?.unit ?? 'ea');
      setMinimumQuantity(String(item?.minimumQuantity ?? '1'));
      setExpirationDate(item?.expirationDate ?? '');
      setNotes(item?.notes ?? '');
      setError('');
    }
  }, [open, item]);

  const save = () => {
    const qty = parseFloat(quantity);
    const minQty = parseFloat(minimumQuantity);
    if (!name.trim()) return setError('Name is required');
    if (Number.isNaN(qty) || qty < 0) return setError('Invalid quantity');
    if (Number.isNaN(minQty) || minQty < 0) return setError('Invalid minimum');
    const base: SupplyItem = {
      id: item?.id ?? `sup-${Date.now()}`,
      name: name.trim(),
      category,
      quantity: qty,
      unit: unit.trim() || 'ea',
      minimumQuantity: minQty,
      expirationDate: expirationDate || undefined,
      notes: notes.trim() || undefined,
      isSample: item?.isSample,
    };
    if (item) updateSupply(base);
    else addSupply(base);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gd-label text-sm">{item ? 'EDIT SUPPLY' : 'ADD SUPPLY'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="NAME">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bottled water" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Field label="CATEGORY">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <CategoryPill key={c} active={category === c} onClick={() => setCategory(c)} label={c.toUpperCase()} color={CATEGORY_COLORS[c]} />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="QTY">
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A]" inputMode="decimal" />
            </Field>
            <Field label="UNIT">
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ea / gal / box" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Field label="MIN">
              <Input type="number" value={minimumQuantity} onChange={(e) => setMinimumQuantity(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A]" inputMode="decimal" />
            </Field>
          </div>
          <Field label="EXPIRATION (OPTIONAL)">
            <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A] [color-scheme:dark]" />
          </Field>
          <Field label="NOTES (OPTIONAL)">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Location, rotation date…" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#F44336]">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
          <Button onClick={save} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs" data-testid="save-supply">
            SAVE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[9px] gd-label text-[#6A6860] block mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ── Checklists ───────────────────────────────────────────── */

function ChecklistsTab() {
  const navigate = useNavigate();
  const { checklists, checklistStats, addChecklist } = useAppData();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const create = () => {
    if (!title.trim()) return;
    addChecklist({
      id: `cl-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom checklist',
      icon: 'ListChecks',
      items: [],
      lastUpdated: new Date().toISOString(),
    });
    setTitle('');
    setDescription('');
    setCreating(false);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button
          onClick={() => setCreating(true)}
          className="bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-[11px] gap-1.5"
        >
          <Plus className="w-4 h-4" /> NEW CHECKLIST
        </Button>
      </div>
      <div className="space-y-2">
        {checklists.map((cl) => {
          const stat = checklistStats.find((s) => s.id === cl.id);
          return (
            <TCard key={cl.id} onClick={() => navigate(`/checklists/${cl.id}`)} className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#E8E4DC]">{cl.title}</div>
                  <div className="text-[11px] text-[#6A6860] mt-0.5 truncate">{cl.description}</div>
                </div>
                <div className="text-xs text-[#9A9890] shrink-0">
                  {stat?.completed ?? 0}/{stat?.total ?? 0}
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A6860] shrink-0" />
              </div>
              <ProgressBar percent={stat?.percent ?? 0} className="mt-3" />
            </TCard>
          );
        })}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC]">
          <DialogHeader>
            <DialogTitle className="gd-label text-sm">NEW CHECKLIST</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="TITLE">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Winter Car Kit" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Field label="DESCRIPTION">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this checklist covers" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Button onClick={create} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs">
              CREATE
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
