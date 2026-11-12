import { useMemo } from 'react';
import { Share2, ClipboardCheck, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/lib/store';
import { AREA_STUDY_TEMPLATE, areaStudyProgress, exportAreaStudyText } from '@/lib/data/areaStudy';
import { ProgressBar } from '@/components/tactical';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function AreaStudy() {
  const { groupName, areaStudy, updateAreaStudySection, threats } = useAppData();
  const progress = useMemo(() => areaStudyProgress(areaStudy), [areaStudy]);
  const savedText = useMemo(
    () => new Map(areaStudy.sections.map((s) => [s.id, s.content])),
    [areaStudy]
  );

  const sectionText = (id: string) => savedText.get(id) ?? '';

  const handleExport = async () => {
    const text = exportAreaStudyText(areaStudy, groupName);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Area Study — ${groupName}`, text });
        toast.success('Area study shared');
        return;
      } catch {
        // Dismissed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Area study copied to clipboard');
    } catch {
      toast.error('Could not export the study');
    }
  };

  return (
    <div>
      <h1 className="text-lg gd-label text-[#E8E4DC] mb-4">AREA STUDY</h1>

      <div className="bg-[#242824] border border-[#3A3F3A] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] gd-label text-[#6A6860]">WORKBOOK COMPLETENESS</span>
          <span className="text-lg font-bold text-[#E8A04A] font-[Chakra_Petch]">{progress.percent}%</span>
        </div>
        <ProgressBar percent={progress.percent} />
        <div className="text-[11px] text-[#6A6860] mt-2">
          {progress.filled} of {progress.total} sections written · autosaves as you type
        </div>
      </div>

      <p className="text-xs text-[#9A9890] leading-relaxed mb-4">
        A complete area study is the foundation of every preparedness plan. Work through each
        layer of your operational environment — a little at a time is fine.
      </p>

      {AREA_STUDY_TEMPLATE.map((section, idx) => {
        const content = sectionText(section.id);
        const isFilled = content.trim().length > 0;
        return (
          <div key={section.id} className="bg-[#242824] border border-[#3A3F3A] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-[22px] h-[22px] rounded-full bg-[#4A5A3A] flex items-center justify-center text-[10px] font-bold text-[#8B9A6A] shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 text-[15px] font-bold text-[#E8E4DC]">{section.title}</div>
              {isFilled && <ClipboardCheck className="w-4 h-4 text-[#4CAF50] shrink-0" />}
            </div>
            <p className="text-xs text-[#9A9890] leading-relaxed mb-2.5">{section.prompt}</p>
            <Textarea
              value={content}
              onChange={(e) => updateAreaStudySection(section.id, e.target.value)}
              placeholder={
                idx === 3 && threats.length > 0
                  ? `Tip: you're tracking ${threats.length} threat${threats.length !== 1 ? 's' : ''} in the Threat Register`
                  : 'Write what you know, verify what you don\u2019t...'
              }
              className={cn(
                'bg-[#1E221E] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] text-[13px] min-h-[96px] leading-relaxed focus:border-[#6B7A4A]'
              )}
            />
          </div>
        );
      })}

      <button
        onClick={() => void handleExport()}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#6B7A4A] hover:bg-[#7A8A55] text-white text-[13px] gd-label font-bold transition-colors mt-2"
      >
        <Share2 className="w-4 h-4" /> EXPORT STUDY (SHARE / PRINT)
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-[#6A6860]">
        <MapIcon className="w-3 h-3" />
        Pair this study with POIs and routes pinned on the Map tab.
      </div>
    </div>
  );
}
