export const accountTypeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Banque' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'other', label: 'Autre' },
];

export const getAccountTypeLabel = (type) =>
  accountTypeOptions.find((item) => item.value === type)?.label || type || 'Autre';
