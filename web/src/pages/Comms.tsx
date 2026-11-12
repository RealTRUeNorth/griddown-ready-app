import React, { useMemo, useState } from 'react';
import {
  Radio,
  Plus,
  MessageSquare,
  Antenna,
  ScrollText,
  Star,
  Trash2,
  Phone,
  Users,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { CommsBand, CommsChannel, CommsMode, CommsRepeater } from '@/lib/types';
import { REPORT_DEFS } from '@/lib/radioReports';
import { defaultCommsProtocols, BAND_INFO } from '@/lib/data/comms';
import { TCard, SectionTitle, Chip } from '@/components/tactical';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/pages/Prep';
import { cn } from '@/lib/utils';

const BANDS: CommsBand[] = ['FRS', 'GMRS', 'MURS', 'CB', 'VHF_Marine', 'HAM_VHF', 'HAM_UHF', 'HF', 'Custom'];
const MODES: CommsMode[] = ['simplex', 'duplex', 'mesh', 'repeater'];

export default function Comms() {
  const {
    groupName,
    members,
    alertLevel,
    commsChannels,
    commsRepeaters,
    addCommsChannel,
    removeCommsChannel,
    addCommsRepeater,
    removeCommsRepeater,
  } = useAppData();

  const navigate = useNavigate();
  const [channelDialog, setChannelDialog] = useState(false);
  const [repeaterDialog, setRepeaterDialog] = useState(false);
  const [protocolsOpen, setProtocolsOpen] = useState(false);

  const sortedChannels = useMemo(() => {
    return [...commsChannels].sort((a, b) => {
      if (!!b.isPrimary !== !!a.isPrimary) return a.isPrimary ? -1 : 1;
      return a.band.localeCompare(b.band) || a.name.localeCompare(b.name);
    });
  }, [commsChannels]);

  /** SMS the whole group with a status snapshot (sms: URI opens the device messenger). */
  const smsGroup = () => {
    const numbers = members.map((m) => m.phone).filter(Boolean).map((p) => p!.replace(/[^\d+]/g, ''));
    if (numbers.length === 0) {
      toast.error('No member phone numbers on file');
      return;
    }
    const body = encodeURIComponent(
      `${groupName} STATUS: ${alertLevel.toUpperCase()}. ${members.length} members. Check in on your primary channel.`
    );
    window.location.href = `sms:${numbers.join(',')}?&body=${body}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg gd-label text-[#E8E4DC]">COMMS PLAN</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setChannelDialog(true)}
            className="p-2 rounded-lg bg-[#242824] border border-[#3A3F3A] text-[#E8A04A] hover:border-[#D4822A] transition-colors"
            aria-label="Add channel"
            data-testid="add-channel"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRepeaterDialog(true)}
            className="p-2 rounded-lg bg-[#242824] border border-[#3A3F3A] text-[#8B9A6A] hover:border-[#6B7A4A] transition-colors"
            aria-label="Add repeater"
            data-testid="add-repeater"
          >
            <Antenna className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        onClick={smsGroup}
        data-testid="sms-group"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] text-xs gd-label font-bold transition-colors mb-4"
      >
        <MessageSquare className="w-4 h-4" /> SMS GROUP ({members.length})
      </button>

      <SectionTitle className="mt-2">CHANNELS · {commsChannels.length}</SectionTitle>
      <div className="space-y-2">
        {sortedChannels.map((ch) => {
          const band = BAND_INFO[ch.band];
          return (
            <TCard key={ch.id} className="p-3.5" testId={`channel-${ch.id}`}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${band?.color ?? '#6A6860'}22` }}
                >
                  <Radio className="w-4 h-4" style={{ color: band?.color ?? '#9A9890' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#E8E4DC]">{ch.name}</span>
                    {ch.isPrimary && <Chip label="PRIMARY" color="#FFC107" />}
                  </div>
                  <div className="text-[11px] text-[#6A6860] mt-0.5">
                    {ch.frequency} · {band?.label ?? ch.band} · {ch.mode.toUpperCase()}
                    {ch.ctcssTone ? ` · CTCSS ${ch.ctcssTone}` : ''}
                  </div>
                  <div className="text-[11px] text-[#9A9890] mt-0.5">{ch.purpose}</div>
                </div>
                <button
                  onClick={() => removeCommsChannel(ch.id)}
                  className="p-1.5 text-[#6A6860] hover:text-[#F44336] transition-colors shrink-0"
                  aria-label="Delete channel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </TCard>
          );
        })}
      </div>

      <SectionTitle>REPEATERS · {commsRepeaters.length}</SectionTitle>
      {commsRepeaters.length === 0 ? (
        <div className="text-xs text-[#6A6860] bg-[#242824] border border-[#3A3F3A] rounded-xl p-4 text-center">
          No repeaters saved. Add local repeaters for extended-range coverage.
        </div>
      ) : (
        <div className="space-y-2">
          {commsRepeaters.map((r) => (
            <TCard key={r.id} className="p-3.5 flex items-center gap-3" testId={`repeater-${r.id}`}>
              <Antenna className="w-4 h-4 text-[#8B9A6A] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#E8E4DC]">{r.name}</div>
                <div className="text-[11px] text-[#6A6860] mt-0.5">
                  IN {r.inputFreq} · OUT {r.outputFreq} · {r.offset} · {r.ctcssTone}
                </div>
                {r.location && <div className="text-[11px] text-[#9A9890] mt-0.5">{r.location}</div>}
              </div>
              <button
                onClick={() => removeCommsRepeater(r.id)}
                className="p-1.5 text-[#6A6860] hover:text-[#F44336] transition-colors shrink-0"
                aria-label="Delete repeater"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </TCard>
          ))}
        </div>
      )}

      <SectionTitle>PROTOCOLS</SectionTitle>
      <div className="space-y-2">
        {defaultCommsProtocols.map((p) => (
          <TCard key={p.id} className="p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <ScrollText className="w-4 h-4 text-[#E8A04A] shrink-0" />
              <span className="text-sm gd-label text-[#E8E4DC]">{p.title.toUpperCase()}</span>
            </div>
            <p className="text-[12px] text-[#9A9890] mb-2">{p.description}</p>
            <ol className="space-y-1">
              {p.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-[#9A9890]">
                  <span className="text-[#6A6860] shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </TCard>
        ))}
      </div>

      <SectionTitle>STANDARD REPORTS</SectionTitle>
      <div className="space-y-2">
        {REPORT_DEFS.map((r) => (
          <TCard key={r.id} onClick={() => navigate('/report-builder')} className="p-4 flex items-center gap-3">
            <Radio className="w-5 h-5 text-[#E8A04A] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#E8E4DC]">{r.name}</div>
              <div className="text-[11px] text-[#6A6860] mt-0.5 line-clamp-1">{r.description}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6A6860] shrink-0" />
          </TCard>
        ))}
      </div>

      <ChannelDialog open={channelDialog} onClose={() => setChannelDialog(false)} onSave={addCommsChannel} />
      <RepeaterDialog open={repeaterDialog} onClose={() => setRepeaterDialog(false)} onSave={addCommsRepeater} />
    </div>
  );
}


function ChannelDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (c: CommsChannel) => void }) {
  const [name, setName] = useState('');
  const [band, setBand] = useState<CommsBand>('FRS');
  const [frequency, setFrequency] = useState('');
  const [mode, setMode] = useState<CommsMode>('simplex');
  const [purpose, setPurpose] = useState('');
  const [ctcssTone, setCtcssTone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  React.useEffect(() => {
    if (open) {
      setName('');
      setBand('FRS');
      setFrequency('');
      setMode('simplex');
      setPurpose('');
      setCtcssTone('');
      setIsPrimary(false);
    }
  }, [open]);

  const save = () => {
    if (!name.trim() || !frequency.trim()) {
      toast.error('Name and frequency are required');
      return;
    }
    onSave({
      id: `ch-${Date.now()}`,
      name: name.trim(),
      band,
      frequency: frequency.trim(),
      mode,
      purpose: purpose.trim() || 'Group communications',
      ctcssTone: ctcssTone.trim() || undefined,
      isPrimary,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gd-label text-sm">ADD CHANNEL</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="NAME">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Primary Patrol" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Field label="BAND">
            <div className="flex flex-wrap gap-1.5">
              {BANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBand(b)}
                  className={cn(
                    'text-[9px] gd-label rounded-full px-2.5 py-1.5 border transition-colors',
                    band === b ? 'bg-[#8B5A1A] border-[#D4822A] text-[#E8A04A]' : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]'
                  )}
                >
                  {(BAND_INFO[b]?.label ?? b).toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="FREQUENCY / CH">
              <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="CH 3 / 462.6125" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Field label="CTCSS TONE (OPTIONAL)">
              <Input value={ctcssTone} onChange={(e) => setCtcssTone(e.target.value)} placeholder="114.8" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
          </div>
          <Field label="MODE">
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'text-[9px] gd-label rounded-full px-2.5 py-1.5 border transition-colors',
                    mode === m ? 'bg-[#8B5A1A] border-[#D4822A] text-[#E8A04A]' : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]'
                  )}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
          <Field label="PURPOSE">
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Primary group check-in" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="accent-[#D4822A]" />
            <span className="text-xs text-[#E8E4DC]">Mark as primary channel</span>
          </label>
          <Button onClick={save} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs" data-testid="save-channel">
            SAVE CHANNEL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RepeaterDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (r: CommsRepeater) => void }) {
  const [name, setName] = useState('');
  const [inputFreq, setInputFreq] = useState('');
  const [outputFreq, setOutputFreq] = useState('');
  const [offset, setOffset] = useState('');
  const [ctcssTone, setCtcssTone] = useState('');
  const [location, setLocation] = useState('');

  React.useEffect(() => {
    if (open) {
      setName('');
      setInputFreq('');
      setOutputFreq('');
      setOffset('');
      setCtcssTone('');
      setLocation('');
    }
  }, [open]);

  const save = () => {
    if (!name.trim() || !outputFreq.trim()) {
      toast.error('Name and output frequency are required');
      return;
    }
    onSave({
      id: `rpt-${Date.now()}`,
      name: name.trim(),
      inputFreq: inputFreq.trim() || outputFreq.trim(),
      outputFreq: outputFreq.trim(),
      offset: offset.trim() || '—',
      ctcssTone: ctcssTone.trim() || '—',
      location: location.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gd-label text-sm">ADD REPEATER</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="NAME">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Metro ARC Repeater" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="INPUT">
              <Input value={inputFreq} onChange={(e) => setInputFreq(e.target.value)} placeholder="146.340" className="bg-[#1E221E] border-[#3A3F3A]" inputMode="decimal" />
            </Field>
            <Field label="OUTPUT">
              <Input value={outputFreq} onChange={(e) => setOutputFreq(e.target.value)} placeholder="146.940" className="bg-[#1E221E] border-[#3A3F3A]" inputMode="decimal" />
            </Field>
            <Field label="OFFSET">
              <Input value={offset} onChange={(e) => setOffset(e.target.value)} placeholder="-0.6" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="CTCSS TONE">
              <Input value={ctcssTone} onChange={(e) => setCtcssTone(e.target.value)} placeholder="141.3" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Field label="LOCATION">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Tower Hill" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
          </div>
          <Button onClick={save} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs" data-testid="save-repeater">
            SAVE REPEATER
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
