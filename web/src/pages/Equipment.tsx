import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PackageSearch, MapPin, User } from 'lucide-react';
import { useAppData } from '@/lib/store';
import { EquipmentCategory, EquipmentItem } from '@/lib/types';
import { TCard, Chip } from '@/components/tactical';

const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  firearms: 'Firearms',
  ammunition: 'Ammunition',
  optics: 'Optics',
  medical: 'Medical',
  comms: 'Comms',
  tools: 'Tools',
  protective: 'Protective',
  navigation: 'Navigation',
  other: 'Other',
};

const CONDITION_COLOR: Record<EquipmentItem['condition'], string> = {
  new: '#4CAF50',
  good: '#8B9A6A',
  fair: '#FFC107',
  poor: '#F44336',
};

export default function Equipment() {
  const navigate = useNavigate();
  const { equipment } = useAppData();

  const grouped = useMemo(() => {
    const map = new Map<EquipmentCategory, EquipmentItem[]>();
    for (const item of equipment) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [equipment]);

  const poorCount = equipment.filter((e) => e.condition === 'poor').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg gd-label text-[#E8E4DC]">EQUIPMENT & ARMORY</h1>
        <button
          onClick={() => navigate('/add-equipment')}
          className="flex items-center gap-1 bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] rounded px-3 py-1.5 text-[10px] gd-label font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> ADD
        </button>
      </div>

      <div className="text-[11px] gd-label text-[#6A6860] mb-3">
        {equipment.length} ITEM{equipment.length !== 1 ? 'S' : ''} TRACKED
        {poorCount > 0 ? ` · ${poorCount} POOR CONDITION` : ''}
      </div>

      {grouped.map(([category, items]) => (
        <div key={category} className="mb-4">
          <div className="text-[10px] gd-label text-[#6A6860] tracking-[0.15em] mt-3 mb-2">
            {CATEGORY_LABEL[category].toUpperCase()}
          </div>
          {items.map((item) => (
            <TCard
              key={item.id}
              onClick={() => navigate(`/add-equipment?id=${item.id}`)}
              className="p-3.5 mb-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[15px] font-bold text-[#E8E4DC] truncate">{item.name}</span>
                <Chip label={item.condition.toUpperCase()} color={CONDITION_COLOR[item.condition]} />
              </div>
              <div className="text-xs font-bold text-[#E8A04A] mt-1 tabular-nums">
                ×{item.quantity}
                {item.serial ? `  ·  SN ${item.serial}` : ''}
              </div>
              {(item.assignedTo || item.location) && (
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {item.assignedTo && (
                    <span className="flex items-center gap-1 text-[11px] text-[#9A9890]">
                      <User className="w-3 h-3" /> {item.assignedTo}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-1 text-[11px] text-[#9A9890]">
                      <MapPin className="w-3 h-3" /> {item.location}
                    </span>
                  )}
                </div>
              )}
              {item.notes && <div className="text-[11px] text-[#6A6860] italic mt-1.5">{item.notes}</div>}
              {item.isSample && (
                <span className="inline-block mt-1.5 text-[8px] gd-label bg-[#333833] rounded px-1.5 py-0.5 text-[#6A6860]">
                  SAMPLE
                </span>
              )}
            </TCard>
          ))}
        </div>
      ))}

      {equipment.length === 0 && (
        <div className="flex flex-col items-center py-10 gap-2">
          <PackageSearch className="w-8 h-8 text-[#6A6860]" />
          <div className="text-sm font-semibold text-[#9A9890]">No equipment tracked</div>
          <div className="text-xs text-[#6A6860] text-center leading-relaxed px-6">
            Track serialized gear, weapons, and accountable kit separately from consumable supplies.
          </div>
        </div>
      )}
    </div>
  );
}
