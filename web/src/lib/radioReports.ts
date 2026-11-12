/**
 * Standard military / emergency radio report builders. Each report is a list
 * of labeled lines the user fills in; the formatted output reads line-by-line
 * the way these reports are actually transmitted ("SALUTE: SIZE 12 ...").
 */

export interface ReportField {
  id: string;
  label: string;
  hint?: string;
  /** Fixed choice list — rendered as select chips instead of free text. */
  choices?: string[];
  multiline?: boolean;
}

export interface ReportDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  whenToUse: string;
  fields: ReportField[];
}

export const REPORT_DEFS: ReportDef[] = [
  {
    id: 'salute',
    name: 'SALUTE',
    shortName: 'SALUTE',
    description: 'Report on observed enemy / hostile activity',
    whenToUse:
      "Use when reporting a sighting of hostile activity, suspicious persons, or a developing threat to your group.",
    fields: [
      { id: 'size', label: 'S — Size', hint: 'Number of personnel / vehicles observed' },
      { id: 'activity', label: 'A — Activity', hint: 'What are they doing?' },
      { id: 'location', label: 'L — Location', hint: 'Address, grid, or landmark' },
      { id: 'unit', label: 'U — Unit / Appearance', hint: 'Uniform, insignia, vehicle type' },
      { id: 'time', label: 'T — Time', hint: 'When observed (use local time + date)' },
      { id: 'equipment', label: 'E — Equipment', hint: 'Weapons, comms, vehicles, kit' },
    ],
  },
  {
    id: 'statrep',
    name: 'STATREP',
    shortName: 'STATREP',
    description: 'Group status report to leadership',
    whenToUse:
      "Use for periodic roll-up of your group's status: personnel, supplies, comms, and next contact.",
    fields: [
      { id: 'period', label: 'Reporting Period', hint: 'e.g. 1200–1800 local' },
      { id: 'situation', label: 'Situation Summary', multiline: true },
      { id: 'personnel', label: 'Personnel Status', hint: 'Accounted for / missing / injured', multiline: true },
      { id: 'supplies', label: 'Supply Status', hint: 'Water, food, fuel, medical', multiline: true },
      { id: 'comms', label: 'Comms Status', hint: 'Channels monitored, net condition' },
      { id: 'next', label: 'Next Report', hint: 'Time of next scheduled report' },
    ],
  },
  {
    id: 'nineline',
    name: '9-LINE MEDEVAC',
    shortName: '9-LINE',
    description: 'Medical evacuation request',
    whenToUse:
      'Use to organize patient and pickup information before contacting EMS, air ambulance, or a rescue net.',
    fields: [
      { id: 'l1', label: 'Line 1 — Pickup Location', hint: 'Grid coordinates or address' },
      { id: 'l2', label: 'Line 2 — Frequency / Call Sign', hint: 'Channel to reach you on' },
      {
        id: 'l3',
        label: 'Line 3 — Patients by Precedence',
        choices: ['A — Urgent', 'B — Priority', 'C — Routine', 'A ×2', 'B ×2', 'A + B'],
      },
      { id: 'l4', label: 'Line 4 — Special Equipment', hint: 'Ventilator, stretcher, extraction gear' },
      { id: 'l5', label: 'Line 5 — Patients by Type', hint: 'Litter / ambulatory counts' },
      {
        id: 'l6',
        label: 'Line 6 — Wounds / Security',
        hint: 'Number and type of wounds; site security',
        multiline: true,
      },
      {
        id: 'l7',
        label: 'Line 7 — Site Marking',
        choices: ['Smoke', 'Strobe / Panel', 'Signal Mirror', 'Flashlight', 'Radio Directed', 'None'],
      },
      { id: 'l8', label: 'Line 8 — Patient Details', hint: 'Nationality / status' },
      {
        id: 'l9',
        label: 'Line 9 — Terrain / Contamination',
        hint: 'Terrain description, HazMat if any',
        multiline: true,
      },
    ],
  },
];

/**
 * Formats a filled report as line-by-line radio text. Empty fields are sent
 * as "—" so line numbers stay aligned with the standard.
 */
export function formatReportText(
  def: ReportDef,
  values: Record<string, string>,
  groupName: string
): string {
  const lines: string[] = [];
  const dtg = new Date().toISOString().replace('T', ' ').slice(0, 16) + 'Z';
  lines.push(`[${def.name.toUpperCase()}] ${groupName} — ${dtg}`);
  def.fields.forEach((field, idx) => {
    const value = (values[field.id] ?? '').trim();
    lines.push(`${idx + 1}. ${field.label.split('—')[0].trim()}: ${value || '—'}`);
  });
  return lines.join('\n');
}
