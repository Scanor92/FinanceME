export const expenseCategoryOptions = [
  { value: 'Food', label: 'Alimentation' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Loyer', label: 'Loyer' },
  { value: 'Sante', label: 'Sante' },
  { value: 'Loisirs', label: 'Loisirs' },
  { value: 'Factures', label: 'Factures' },
  { value: 'Autre', label: 'Autre' },
];

export const incomeCategoryOptions = [
  { value: 'Salaire', label: 'Salaire' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Business', label: 'Business' },
  { value: 'Bonus', label: 'Bonus' },
  { value: 'Cadeau', label: 'Cadeau' },
  { value: 'Autre', label: 'Autre' },
];

export const budgetCategoryOptions = [
  ...expenseCategoryOptions,
  ...incomeCategoryOptions.filter((item) => item.value === 'Business'),
];

export const buildCategoryOptions = (baseOptions, customCategories = []) => {
  const otherOption = baseOptions.find((item) => item.value === 'Autre');
  const baseWithoutOther = baseOptions.filter((item) => item.value !== 'Autre');
  const customOptions = customCategories
    .filter((item) => item && !baseOptions.some((base) => base.value.toLowerCase() === item.toLowerCase()))
    .map((item) => ({ value: item, label: item }));

  return otherOption ? [...baseWithoutOther, ...customOptions, otherOption] : [...baseWithoutOther, ...customOptions];
};

export const getCategoryLabel = (category) => {
  const allOptions = [...expenseCategoryOptions, ...incomeCategoryOptions];
  return allOptions.find((item) => item.value === category)?.label || category || 'Choisir';
};

const categoryIcons = {
  Food: 'restaurant-outline',
  Transport: 'car-outline',
  Loyer: 'home-outline',
  Sante: 'medkit-outline',
  Loisirs: 'game-controller-outline',
  Factures: 'receipt-outline',
  Business: 'briefcase-outline',
  Salaire: 'wallet-outline',
  Freelance: 'laptop-outline',
  Bonus: 'sparkles-outline',
  Cadeau: 'gift-outline',
  Autre: 'grid-outline',
};

export const getCategoryIcon = (category) => categoryIcons[category] || 'grid-outline';
