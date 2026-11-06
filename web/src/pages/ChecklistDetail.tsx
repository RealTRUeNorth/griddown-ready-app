import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { CheckSquare, Square, Plus, Trash2, Volume2, Square as StopIcon, CheckCheck } from 'lucide-react';
import { useAppData } from '@/lib/store';
import { TCard, PageHeader, ProgressBar, SectionTitle } from '@/components/tactical';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isReadAloudSupported, speak, stopSpeaking } from '@/lib/readAloud';
import { vibrate } from '@/lib/device';

export default function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { checklists, toggleChecklistItem, addChecklistItem, removeChecklistItem, removeChecklist } = useAppData();
  const [newItem, setNewItem] = useState('');
  const [reading, setReading] = useState(false);

  const checklist = checklists.find((cl) => cl.id === id);
  if (!checklist) return <Navigate to="/prep?tab=checklists" replace />;

  const completed = checklist.items.filter((i) => i.completed).length;
  const percent = checklist.items.length ? Math.round((completed / checklist.items.length) * 100) : 0;

  const readAloudText = useMemo(
    () =>
      `${checklist.title}. ${checklist.items
        .map((i, n) => `${i.completed ? 'Done' : `Item ${n + 1}`}. ${i.text}.`)
        .join(' ')}`,
    [checklist]
  );

  const toggleReadAloud = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
    } else {
      const ok = speak(readAloudText, () => setReading(false));
      if (ok) setReading(true);
    }
  };

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    addChecklistItem(checklist.id, {
      id: `item-${Date.now()}`,
      text,
      completed: false,
    });
    setNewItem('');
  };

  return (
    <div>
      <PageHeader
        title={checklist.title.toUpperCase()}
        subtitle={`${completed}/${checklist.items.length} complete`}
        onBack={() => navigate('/prep?tab=checklists')}
        action={
          isReadAloudSupported() ? (
            <button
              onClick={toggleReadAloud}
              className={`p-2 rounded-lg border transition-colors ${
                reading
                  ? 'bg-[#D4822A] border-[#D4822A] text-[#1A1D1A] animate-pulse'
                  : 'bg-[#242824] border-[#3A3F3A] text-[#9A9890] hover:text-[#E8A04A]'
              }`}
              aria-label="Read aloud"
            >
              {reading ? <StopIcon className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          ) : null
        }
      />

      <ProgressBar percent={percent} className="mb-5" />

      <TCard className="px-3">
        {checklist.items.length === 0 && (
          <div className="py-8 text-center text-sm text-[#6A6860]">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No items yet — add the first one below.
          </div>
        )}
        {checklist.items.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 py-3 ${i < checklist.items.length - 1 ? 'border-b border-[#3A3F3A]' : ''}`}
          >
            <button
              onClick={() => {
                vibrate(15);
                toggleChecklistItem(checklist.id, item.id);
              }}
              className="shrink-0"
              aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              data-testid={`check-${item.id}`}
            >
              {item.completed ? (
                <CheckSquare className="w-5 h-5 text-[#4CAF50]" />
              ) : (
                <Square className="w-5 h-5 text-[#6A6860] hover:text-[#9A9890] transition-colors" />
              )}
            </button>
            <span
              className={`flex-1 text-sm transition-colors ${
                item.completed ? 'text-[#6A6860] line-through' : 'text-[#E8E4DC]'
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => removeChecklistItem(checklist.id, item.id)}
              className="p-1 text-[#6A6860] hover:text-[#F44336] transition-colors shrink-0"
              aria-label="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </TCard>

      <div className="flex gap-2 mt-4">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add an item…"
          className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860]"
          data-testid="new-checklist-item"
        />
        <Button onClick={addItem} className="bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold" aria-label="Add item">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {checklist.items.length > 0 && (
        <>
          <SectionTitle>QUICK ACTIONS</SectionTitle>
          <button
            onClick={() => {
              for (const item of checklist.items) {
                if (!item.completed) toggleChecklistItem(checklist.id, item.id);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#3A3F3A] bg-[#242824] text-xs gd-label text-[#9A9890] hover:text-[#4CAF50] hover:border-[#4CAF50] transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> MARK ALL COMPLETE
          </button>
          <button
            onClick={() => {
              removeChecklist(checklist.id);
              navigate('/prep?tab=checklists');
            }}
            className="w-full mt-2 py-2.5 rounded-xl text-xs gd-label text-[#6A6860] hover:text-[#F44336] transition-colors"
          >
            DELETE CHECKLIST
          </button>
        </>
      )}
    </div>
  );
}
