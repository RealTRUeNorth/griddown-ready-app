import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Volume2, Square as StopIcon } from 'lucide-react';
import { defaultGuides } from '@/lib/data/guides';
import { TCard, PageHeader, Chip } from '@/components/tactical';
import { isReadAloudSupported, speak, stopSpeaking } from '@/lib/readAloud';

const CATEGORY_COLORS: Record<string, string> = {
  Survival: '#8B9A6A',
  Medical: '#F44336',
  Comms: '#4CAF50',
  Supplies: '#D4822A',
  Security: '#FFC107',
};

export default function GuideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reading, setReading] = useState(false);

  const guide = defaultGuides.find((g) => g.id === id);
  if (!guide) return <Navigate to="/intel" replace />;

  const fullText = useMemo(
    () =>
      `${guide.title}. ${guide.summary} ${guide.sections
        .map((s) => `${s.title}. ${s.content}`)
        .join(' ')}`,
    [guide]
  );

  const toggleReadAloud = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
    } else {
      const ok = speak(fullText, () => setReading(false));
      if (ok) setReading(true);
    }
  };

  return (
    <div>
      <PageHeader
        title={guide.title.toUpperCase()}
        subtitle={guide.summary}
        onBack={() => navigate('/intel?tab=guides')}
        action={
          isReadAloudSupported() ? (
            <button
              onClick={toggleReadAloud}
              data-testid="read-aloud"
              className={`p-2 rounded-lg border transition-colors ${
                reading
                  ? 'bg-[#D4822A] border-[#D4822A] text-[#1A1D1A] animate-pulse'
                  : 'bg-[#242824] border-[#3A3F3A] text-[#9A9890] hover:text-[#E8A04A]'
              }`}
              aria-label={reading ? 'Stop reading' : 'Read aloud'}
            >
              {reading ? <StopIcon className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          ) : null
        }
      />

      <div className="mb-4">
        <Chip label={guide.category.toUpperCase()} color={CATEGORY_COLORS[guide.category] ?? '#9A9890'} />
      </div>

      <div className="space-y-3">
        {guide.sections.map((section, i) => (
          <TCard key={i} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded bg-[#333833] border border-[#4A504A] flex items-center justify-center text-[9px] gd-label text-[#8B9A6A]">
                {i + 1}
              </span>
              <h2 className="text-sm gd-label text-[#E8E4DC]">{section.title.toUpperCase()}</h2>
            </div>
            <p className="text-[13px] leading-relaxed text-[#9A9890]">{section.content}</p>
          </TCard>
        ))}
      </div>

      <div className="mt-8 text-[10px] text-[#6A6860] text-center leading-relaxed">
        GENERAL EDUCATION ONLY — NOT MEDICAL OR PROFESSIONAL ADVICE.
        <br />
        DEFER TO TRAINED PROFESSIONALS AND OFFICIAL AUTHORITIES.
      </div>
    </div>
  );
}
