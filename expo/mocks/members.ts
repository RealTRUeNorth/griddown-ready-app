import { GroupMember } from '@/types';

export const defaultMembers: GroupMember[] = [
  {
    id: 'm1',
    name: 'Team Lead',
    role: 'Leader',
    skills: ['Navigation', 'First Aid', 'Comms'],
    status: 'ready',
    notes: 'Primary decision maker. HAM radio licensed.',
  },
  {
    id: 'm2',
    name: 'Medic',
    role: 'Medical',
    skills: ['First Aid', 'Trauma Care', 'Herbalism'],
    status: 'ready',
    notes: 'EMT certified. Maintains medical supplies.',
  },
  {
    id: 'm3',
    name: 'Scout',
    role: 'Recon',
    skills: ['Navigation', 'Tracking', 'Hunting'],
    status: 'unknown',
    notes: 'Former military. Wilderness survival expert.',
  },
];
