import React from 'react';
import { faqEntries } from '@/lib/legal';
import { TCard } from '@/components/tactical';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function HelpFaq() {
  return (
    <div>
      <h1 className="text-lg gd-label text-[#E8E4DC] mb-1">HELP / FAQ</h1>
      <p className="text-xs text-[#9A9890] mb-4">
        Preparedness planner, not an emergency service. Call 911 (US) in a real emergency.
      </p>
      <Accordion type="single" collapsible className="space-y-2">
        {faqEntries.map((f, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-[#3A3F3A] bg-[#242824] rounded-xl px-4 border-b"
          >
            <AccordionTrigger className="text-[13px] font-semibold text-[#E8E4DC] hover:no-underline py-3">
              {f.question}
            </AccordionTrigger>
            <AccordionContent className="text-[12px] leading-relaxed text-[#9A9890] pb-4">
              {f.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
