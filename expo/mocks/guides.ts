import { Guide } from '@/types';

export const defaultGuides: Guide[] = [
  {
    id: 'g1',
    title: 'Water Purification',
    category: 'Survival',
    icon: 'Droplets',
    summary: 'Methods to make water safe for drinking when municipal water is unavailable.',
    sections: [
      {
        title: 'Boiling',
        content: 'Bring water to a rolling boil for at least 1 minute (3 minutes above 6,500 feet elevation). This is the most reliable method to kill pathogens. Let cool before drinking. Store in clean, sanitized containers.',
      },
      {
        title: 'Chemical Treatment',
        content: 'Use unscented liquid household bleach (5-9% sodium hypochlorite). Add 8 drops per gallon of clear water, or 16 drops for cloudy water. Stir and let stand 30 minutes. Water should have a slight chlorine smell.',
      },
      {
        title: 'Filtration',
        content: 'Portable water filters rated to 0.2 microns remove most bacteria and protozoa. Gravity filters work without power. Always have backup filtration. Pre-filter cloudy water through cloth first.',
      },
      {
        title: 'Solar Disinfection (SODIS)',
        content: 'Fill clear PET bottles with water. Place in direct sunlight for 6+ hours (2 days if cloudy). UV radiation kills pathogens. Only works with clear water in clear bottles. Good backup method.',
      },
    ],
  },
  {
    id: 'g2',
    title: 'First Aid Essentials',
    category: 'Medical',
    icon: 'Heart',
    summary: 'Critical first aid procedures when professional medical help is unavailable.',
    sections: [
      {
        title: 'Bleeding Control',
        content: 'Apply direct pressure with clean cloth. Elevate wound above heart if possible. For severe bleeding, apply tourniquet 2-3 inches above wound. Note time of application. Do not remove once applied — seek medical help.',
      },
      {
        title: 'Wound Care',
        content: 'Clean wounds with clean water. Remove debris carefully. Apply antibiotic ointment. Cover with sterile dressing. Change dressing daily. Watch for signs of infection: redness, swelling, warmth, pus, red streaks.',
      },
      {
        title: 'Burns',
        content: 'Cool burn with cool (not cold) running water for 10-20 minutes. Do not apply ice, butter, or toothpaste. Cover with sterile non-stick dressing. For severe burns, cover loosely and seek help. Watch for shock.',
      },
      {
        title: 'CPR Basics',
        content: 'Check responsiveness. Call for help. Place heel of hand on center of chest. Push hard and fast — 2 inches deep, 100-120 compressions per minute. Give 2 rescue breaths after every 30 compressions. Continue until help arrives.',
      },
    ],
  },
  {
    id: 'g3',
    title: 'Emergency Communications',
    category: 'Comms',
    icon: 'Radio',
    summary: 'How to establish and maintain communications when normal infrastructure fails.',
    sections: [
      {
        title: 'Two-Way Radios',
        content: 'FRS radios work up to 2 miles in open terrain (less in urban areas). GMRS radios offer better range (up to 5+ miles) but require a license. Establish primary and backup channels. Set scheduled check-in times.',
      },
      {
        title: 'Signal Methods',
        content: 'Whistle: 3 blasts = distress. Mirror: flash toward aircraft or distant persons. Smoke: use green vegetation on fire for white smoke. Ground signals: large X = need help, V = need assistance, arrow = traveling this direction.',
      },
      {
        title: 'Message Protocols',
        content: 'Keep messages brief and clear. Use phonetic alphabet for spelling. Repeat critical information. Establish code words for sensitive information. Use "over" to indicate end of transmission, "out" to end conversation.',
      },
      {
        title: 'Dead Drops & Rally Points',
        content: 'Pre-designate physical locations for leaving messages. Use waterproof containers. Establish check schedules. Mark with subtle indicators. Have primary and alternate locations. Include date/time on all messages.',
      },
    ],
  },
  {
    id: 'g4',
    title: 'Shelter & Warmth',
    category: 'Survival',
    icon: 'Home',
    summary: 'Building emergency shelter and maintaining body temperature in adverse conditions.',
    sections: [
      {
        title: 'Shelter Priorities',
        content: 'Protection from wind, rain, and ground cold. Insulation above and below. Small shelters retain heat better. Face opening away from prevailing wind. Locate near water source but above flood level.',
      },
      {
        title: 'Emergency Shelters',
        content: 'Tarp shelter: ridgeline between two trees, tarp draped over at 45 degrees. Debris hut: ridgepole on ground support, pile leaves/branches 2-3 feet thick. Vehicle: crack windows slightly, run engine 10 min/hour for heat.',
      },
      {
        title: 'Hypothermia Prevention',
        content: 'Layer clothing: base (wicking), mid (insulation), outer (wind/water). Keep dry — change wet clothes immediately. Stay active but conserve energy. Eat high-calorie foods. Share body heat in emergency.',
      },
    ],
  },
  {
    id: 'g5',
    title: 'Food Preservation',
    category: 'Supplies',
    icon: 'Wheat',
    summary: 'Techniques for preserving food without refrigeration during extended grid-down scenarios.',
    sections: [
      {
        title: 'Salt Curing',
        content: 'Cover meat completely in salt (1 lb salt per 4 lbs meat). Store in cool, dry place. Rinse and soak in water before cooking to remove excess salt. Properly cured meat can last months without refrigeration.',
      },
      {
        title: 'Smoking',
        content: 'Build a smoke chamber or use enclosed grill. Maintain low heat (100-150 degrees F) with hardwood smoke. Cold smoking for preservation, hot smoking for cooking. Takes 12-24 hours. Combine with salt curing for best results.',
      },
      {
        title: 'Dehydration',
        content: 'Slice food thin and uniform. Sun dry on clean screens in hot, dry weather. Can improvise solar dehydrator with car windshield. Properly dried food should be brittle. Store in airtight containers.',
      },
      {
        title: 'Root Cellaring',
        content: 'Store root vegetables in cool (32-40 degrees F), humid, dark conditions. Layer in sand or sawdust. Separate ethylene-producing items (apples) from sensitive items (potatoes). Check regularly for spoilage.',
      },
    ],
  },
  {
    id: 'g6',
    title: 'Security & Watch Protocols',
    category: 'Security',
    icon: 'Shield',
    summary: 'Establishing a security posture and watch schedule for your group.',
    sections: [
      {
        title: 'Watch Schedule',
        content: 'Minimum 2-person watches. 4-hour shifts maximum at night. Rotate positions. Maintain a watch log. Brief incoming watch on current situation. Establish clear alert escalation procedures.',
      },
      {
        title: 'Perimeter Awareness',
        content: 'Identify natural choke points and avenues of approach. Clear lines of sight where possible. Use noise makers (cans with pebbles on wire) as early warning. Designate safe rooms and rally points.',
      },
      {
        title: 'Conflict De-escalation',
        content: 'Project calm confidence. Maintain safe distance. Listen actively. Offer alternatives. Never turn your back. Have backup nearby but not threatening. Document encounters. Avoid confrontation when possible.',
      },
    ],
  },
];
