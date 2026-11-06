import React from 'react';
import { legalSections } from '@/lib/legal';
import { TCard } from '@/components/tactical';

const TITLE_COLORS = ['#F44336', '#FFC107', '#9A9890', '#8B9A6A', '#42A5F5', '#6A6860'];

export default function Legal() {
  return (
    <div>
      <h1 className="text-lg gd-label text-[#E8E4DC] mb-1">LEGAL & PRIVACY</h1>
      <p className="text-xs text-[#6A6860] mb-4">Last updated: September 2026</p>
      <div className="space-y-3">
        {legalSections.map((s, i) => (
          <TCard key={s.title} className="p-4">
            <div className="text-xs gd-label mb-2" style={{ color: TITLE_COLORS[i % TITLE_COLORS.length] }}>
              {s.title}
            </div>
            <p className="text-[12px] leading-relaxed text-[#9A9890]">{s.body}</p>
          </TCard>
        ))}
      </div>
    </div>
  );
}
