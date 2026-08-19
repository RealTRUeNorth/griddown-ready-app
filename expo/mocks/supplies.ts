import { SupplyItem } from '@/types';

export const seedSupplies: SupplyItem[] = [
  {
    id: 's_water_1',
    name: 'Bottled Water',
    category: 'water',
    quantity: 18,
    unit: 'gal',
    minimumQuantity: 24,
    notes: 'Garage rack — 6-pack cases',
  },
  {
    id: 's_food_1',
    name: 'MRE Cases',
    category: 'food',
    quantity: 4,
    unit: 'cases',
    minimumQuantity: 2,
    expirationDate: '2026-09-15',
    notes: 'Hall closet, top shelf',
  },
  {
    id: 's_med_1',
    name: 'Ibuprofen',
    category: 'medical',
    quantity: 1,
    unit: 'bottles',
    minimumQuantity: 2,
    expirationDate: '2026-03-01',
    notes: 'Med kit — expired, replace',
  },
  {
    id: 's_food_2',
    name: 'White Rice',
    category: 'food',
    quantity: 25,
    unit: 'lbs',
    minimumQuantity: 10,
    expirationDate: '2028-01',
    notes: 'Food-grade buckets with gamma lids',
  },
];
