export const investmentTypeOptions = [
  { value: 'livestock', label: 'Elevage', icon: 'paw-outline' },
  { value: 'land', label: 'Terrain', icon: 'map-outline' },
  { value: 'real_estate', label: 'Immobilier', icon: 'business-outline' },
  { value: 'agriculture', label: 'Agriculture', icon: 'leaf-outline' },
  { value: 'trade', label: 'Commerce', icon: 'storefront-outline' },
  { value: 'cooperative', label: 'Tontine/Cooperative', icon: 'people-outline' },
  { value: 'fixed_deposit', label: 'Depot a terme', icon: 'lock-closed-outline' },
  { value: 'gold', label: 'Or', icon: 'diamond-outline' },
  { value: 'crypto', label: 'Crypto', icon: 'logo-bitcoin' },
  { value: 'other', label: 'Autre', icon: 'briefcase-outline' },
];

export const investmentStatusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'completed', label: 'Termine' },
  { value: 'sold', label: 'Vendu' },
  { value: 'pending', label: 'En attente' },
];

export const getInvestmentTypeLabel = (type) =>
  investmentTypeOptions.find((item) => item.value === type)?.label || type || 'Autre';

export const getInvestmentTypeIcon = (type) =>
  investmentTypeOptions.find((item) => item.value === type)?.icon || 'briefcase-outline';

export const getInvestmentStatusLabel = (status) =>
  investmentStatusOptions.find((item) => item.value === status)?.label || status || 'Actif';
