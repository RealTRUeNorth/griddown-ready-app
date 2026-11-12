import { AreaStudy } from '@/types';

export interface AreaStudyTemplate {
  id: string;
  title: string;
  prompt: string;
}

/**
 * The workbook's guided sections — modeled on the classic six operational
 * environment layers, adapted for household / neighborhood preparedness.
 */
export const AREA_STUDY_TEMPLATE: AreaStudyTemplate[] = [
  {
    id: 'terrain',
    title: 'Area & Terrain',
    prompt:
      'Bodies of water, bridges and choke points, high ground, flood zones. Where does the terrain funnel or stop movement?',
  },
  {
    id: 'population',
    title: 'People & Decision-Makers',
    prompt:
      'Who lives nearby? Who do neighbors look to in a crisis? Key contacts: CERT lead, ham operators, block captains, trusted medical professionals.',
  },
  {
    id: 'infrastructure',
    title: 'Utilities & Infrastructure',
    prompt:
      'Power grid feed, water and gas shutoffs for your home, cell coverage dead zones, hospitals and fire stations, substations and pumping stations.',
  },
  {
    id: 'threats',
    title: 'Threats & Hazards',
    prompt:
      'Seasonal weather risks, industrial or HazMat sites, crime patterns, civil unrest potential. Rank the top five threats to your specific location.',
  },
  {
    id: 'routes',
    title: 'Routes & Movement',
    prompt:
      'Primary egress route and alternates, routes that stay out of flood or crowd zones, fuel and water stops along the way, travel times on foot vs vehicle.',
  },
  {
    id: 'resources',
    title: 'Resources & Rally Points',
    prompt:
      'Water sources that survive grid-down, rally points (primary and backup), supply caches, sources of firewood, fuel, and salvageable materials.',
  },
  {
    id: 'comms',
    title: 'Communications Plan',
    prompt:
      'Primary and alternate channels, meeting frequencies and times, who calls whom and when, duress words, what happens if comms fail for 24 hours.',
  },
  {
    id: 'plan',
    title: 'Group Plan',
    prompt:
      'For each member: role, go-bag status, school/work pickup duties, shelter-in-place vs evacuate criteria and trigger points, pets and livestock.',
  },
];

export function makeEmptyAreaStudy(): AreaStudy {
  return { sections: [], updatedAt: undefined };
}

export function areaStudyProgress(study: AreaStudy): { filled: number; total: number; percent: number } {
  const total = AREA_STUDY_TEMPLATE.length;
  const filledMap = new Map(study.sections.map((s) => [s.id, s.content.trim()]));
  const filled = AREA_STUDY_TEMPLATE.filter((t) => (filledMap.get(t.id) ?? '').length > 0).length;
  return { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
}

/** Renders the workbook as a shareable / printable text document. */
export function exportAreaStudyText(study: AreaStudy, groupName: string): string {
  const filledMap = new Map(study.sections.map((s) => [s.id, s.content.trim()]));
  const lines: string[] = [];
  lines.push(`AREA STUDY — ${groupName}`);
  lines.push(`Compiled ${new Date().toLocaleDateString()}`);
  lines.push('');
  AREA_STUDY_TEMPLATE.forEach((section, i) => {
    lines.push(`${i + 1}. ${section.title.toUpperCase()}`);
    const content = filledMap.get(section.id) ?? '(not yet completed)';
    content.split('\n').forEach((l) => lines.push(`   ${l}`));
    lines.push('');
  });
  return lines.join('\n');
}
