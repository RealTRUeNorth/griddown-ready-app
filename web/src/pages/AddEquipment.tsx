import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PackageSearch, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/lib/store';
import { EquipmentCategory, EquipmentCondition } from '@/lib/types';
import { PageHeader } from '@/components/tactical';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/pages/Prep';
import { ChoiceChips } from '@/pages/AddThreat';
import { cn } from '@/lib/utils';

const CATEGORIES: { id: EquipmentCategory; label: string }[] = [
  { id: 'firearms', label: 'Firearms' },
  { id: 'ammunition', label: 'Ammunition' },
  { id: 'optics', label: 'Optics' },
  { id: 'medical', label: 'Medical' },
  { id: 'comms', label: 'Comms' },
  { id: 'tools', label: 'Tools' },
  { id: 'protective', label: 'Protective' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'other', label: 'Other' },
];

const CONDITIONS: { id: EquipmentCondition; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
  { id: 'poor', label: 'Poor' },
];

export default function AddEquipment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id') ?? undefined;
  const { equipment, addEquipment, updateEquipment, removeEquipment } = useAppData();
  const existing = id ? equipment.find((e) => e.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<EquipmentCategory>(existing?.category ?? 'tools');
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity) : '1');
  const [serial, setSerial] = useState(existing?.serial ?? '');
  const [condition, setCondition] = useState<EquipmentCondition>(existing?.condition ?? 'good');
  const [assignedTo, setAssignedTo] = useState(existing?.assignedTo ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const canSave = name.trim().length > 0;

  const handleDelete = useCallback(() => {
    if (!existing) return;
    removeEquipment(existing.id);
    toast.success('Equipment removed');
    navigate('/prep/equipment');
  }, [existing, removeEquipment, navigate]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    const qty = parseInt(quantity, 10);
    const payload = {
      id: existing?.id ?? `equip-${Date.now()}`,
      name: name.trim(),
      category,
      quantity: isNaN(qty) || qty < 1 ? 1 : qty,
      serial: serial.trim() || undefined,
      condition,
      assignedTo: assignedTo.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      isSample: existing?.isSample,
    };
    if (existing) {
      updateEquipment(payload);
    } else {
      addEquipment(payload);
    }
    navigate('/prep/equipment');
  }, [canSave, name, category, quantity, serial, condition, assignedTo, location, notes, existing, addEquipment, updateEquipment, navigate]);

  return (
    <div>
      <PageHeader
        title={existing ? 'EDIT EQUIPMENT' : 'ADD EQUIPMENT'}
        subtitle="Serialized gear, weapons, and accountable kit"
        onBack={() => navigate('/prep/equipment')}
      />

      <div className="space-y-1">
        <Field label="NAME">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Berkey Water Filter"
            className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860]"
          />
        </Field>

        <Field label="CATEGORY">
          <ChoiceChips options={CATEGORIES} value={category} onChange={(v) => setCategory(v)} />
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="QUANTITY">
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="numeric"
                className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC]"
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="SERIAL (OPTIONAL)">
              <Input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="Serial #"
                className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] uppercase"
              />
            </Field>
          </div>
        </div>

        <Field label="CONDITION">
          <ChoiceChips
            options={CONDITIONS.map((c) => ({ id: c.id, label: c.label.toUpperCase() }))}
            value={condition}
            onChange={(v) => setCondition(v)}
          />
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="ASSIGNED TO">
              <Input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Member name"
                className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860]"
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="STORED AT">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Safe, garage"
                className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860]"
              />
            </Field>
          </div>
        </div>

        <Field label="NOTES (OPTIONAL)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Maintenance schedule, zeroing, accessories..."
            className="bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] min-h-[80px]"
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
        <Check className="w-4 h-4" /> {existing ? 'Save Changes' : 'Add Equipment'}
      </button>

      {existing && !existing.isSample && (
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#F44336] text-[#F44336] text-sm font-bold hover:bg-[#F44336]/10 transition-colors mt-3"
        >
          <X className="w-4 h-4" /> Remove Equipment
        </button>
      )}
    </div>
  );
}
