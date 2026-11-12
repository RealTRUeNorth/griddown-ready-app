import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2, MessageSquareText, Radio, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/lib/store';
import { REPORT_DEFS, formatReportText, ReportDef } from '@/lib/radioReports';
import { SectionTitle } from '@/components/tactical';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ReportBuilder() {
  const navigate = useNavigate();
  const { groupName, members } = useAppData();
  const [activeId, setActiveId] = useState<string>(REPORT_DEFS[0].id);
  const [valuesByReport, setValuesByReport] = useState<Record<string, Record<string, string>>>({});
  const [copied, setCopied] = useState(false);

  const def = useMemo<ReportDef>(
    () => REPORT_DEFS.find((r) => r.id === activeId) ?? REPORT_DEFS[0],
    [activeId]
  );
  const values = valuesByReport[def.id] ?? {};

  const setValue = useCallback(
    (fieldId: string, value: string) => {
      setValuesByReport((prev) => ({
        ...prev,
        [def.id]: { ...(prev[def.id] ?? {}), [fieldId]: value },
      }));
    },
    [def.id]
  );

  const formatted = useMemo(() => formatReportText(def, values, groupName), [def, values, groupName]);
  const filledCount = def.fields.filter((f) => (values[f.id] ?? '').trim().length > 0).length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      toast.success('Report copied');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${def.name} — ${groupName}`, text: formatted });
      } catch {
        // Dismissed — nothing to do
      }
    } else {
      void handleCopy();
    }
  };

  const handleSms = () => {
    const numbers = members
      .map((m) => m.phone)
      .filter((p): p is string => !!p && p.trim().length > 0)
      .map((p) => p.replace(/[^\d+]/g, ''));
    if (numbers.length === 0) {
      toast.error('Add phone numbers to group members first (Intel → Group)');
      navigate('/intel?tab=group');
      return;
    }
    const body = encodeURIComponent(formatted);
    window.location.href = `sms:${numbers.join(',')}?&body=${body}`;
  };

  return (
    <div>
      <h1 className="text-lg gd-label text-[#E8E4DC] mb-4">REPORT BUILDER</h1>

      <div className="grid grid-cols-3 gap-1.5 bg-[#242824] border border-[#3A3F3A] rounded-xl p-1 mb-4">
        {REPORT_DEFS.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveId(r.id)}
            className={cn(
              'py-2 rounded-lg text-[10px] gd-label transition-colors flex items-center justify-center gap-1.5',
              activeId === r.id ? 'bg-[#6B7A4A] text-white' : 'text-[#E8A04A] hover:text-[#E8E4DC]'
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            {r.shortName}
          </button>
        ))}
      </div>

      <div className="bg-[#242824] border border-[#3A3F3A] rounded-xl p-4 mb-4">
        <div className="text-base font-bold text-[#E8E4DC] gd-label tracking-wide">{def.name}</div>
        <div className="text-xs font-semibold text-[#E8A04A] mt-1">{def.description}</div>
        <div className="text-xs text-[#9A9890] leading-relaxed mt-1.5">{def.whenToUse}</div>
      </div>

      {def.fields.map((field, idx) => (
        <div key={field.id} className="mb-4">
          <div className="text-[10px] gd-label text-[#6A6860] tracking-[0.15em] mb-1.5">
            LINE {idx + 1} · {field.label}
          </div>
          {field.choices ? (
            <div className="flex flex-wrap gap-1.5">
              {field.choices.map((choice) => {
                const active = values[field.id] === choice;
                return (
                  <button
                    key={choice}
                    onClick={() => setValue(field.id, active ? '' : choice)}
                    className={cn(
                      'rounded-md border px-2.5 py-1.5 text-[11px] font-bold transition-colors',
                      active
                        ? 'bg-[#4A5A3A] border-[#8B9A6A] text-white'
                        : 'bg-[#242824] border-[#3A3F3A] text-[#9A9890] hover:text-[#E8E4DC]'
                    )}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          ) : field.multiline ? (
            <Textarea
              value={values[field.id] ?? ''}
              onChange={(e) => setValue(field.id, e.target.value)}
              placeholder={field.hint ?? ''}
              className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] text-sm min-h-[72px]"
            />
          ) : (
            <Input
              value={values[field.id] ?? ''}
              onChange={(e) => setValue(field.id, e.target.value)}
              placeholder={field.hint ?? ''}
              className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] text-sm"
            />
          )}
        </div>
      ))}

      <SectionTitle className="mt-2">TRANSMISSION PREVIEW · {filledCount}/{def.fields.length} LINES</SectionTitle>
      <pre className="bg-[#242824] border border-[#4A504A] rounded-xl p-4 text-xs leading-relaxed text-[#E8E4DC] font-mono whitespace-pre-wrap">
        {formatted}
      </pre>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => void handleCopy()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6B7A4A] hover:bg-[#7A8A55] text-white text-xs gd-label font-bold transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'COPIED' : 'COPY'}
        </button>
        <button
          onClick={() => void handleShare()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6B7A4A] hover:bg-[#7A8A55] text-white text-xs gd-label font-bold transition-colors"
        >
          <Share2 className="w-4 h-4" /> SHARE
        </button>
        <button
          onClick={handleSms}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] text-xs gd-label font-bold transition-colors"
        >
          <MessageSquareText className="w-4 h-4" /> SMS
        </button>
      </div>

      <div className="mt-4 text-[11px] text-[#6A6860] text-center leading-relaxed">
        Send these over your primary channel first; SMS group is the fallback when radios are down.
      </div>
    </div>
  );
}
