export const debtTypeOptions = [
  { value: 'payable', label: 'Je dois', icon: 'arrow-up-circle-outline' },
  { value: 'receivable', label: 'On me doit', icon: 'arrow-down-circle-outline' },
];

export const debtStatusOptions = [
  { value: 'all', label: 'Toutes' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'paid', label: 'Payees' },
];

export const getDebtTypeLabel = (type) =>
  debtTypeOptions.find((item) => item.value === type)?.label || type || 'Dette';

export const getDebtTypeIcon = (type) =>
  debtTypeOptions.find((item) => item.value === type)?.icon || 'swap-horizontal-outline';

export const getDebtStatusLabel = (status) =>
  debtStatusOptions.find((item) => item.value === status)?.label || status || 'Ouverte';
