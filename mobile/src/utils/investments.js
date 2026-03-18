export const formatInvestmentMoney = (value, currencyCode = 'XOF') =>
  new Intl.NumberFormat('fr-NE', {
    style: 'currency',
    currency: ['XOF', 'USD', 'EUR'].includes(currencyCode) ? currencyCode : 'XOF',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const investmentNumberFormatter = new Intl.NumberFormat('fr-NE', {
  maximumFractionDigits: 2,
});

const maturityAssetTypes = ['fixed_deposit'];
const yieldAssetTypes = ['fixed_deposit', 'cooperative'];
const propertyAssetTypes = ['land', 'real_estate', 'agriculture'];

export const isMaturityAsset = (assetType) => maturityAssetTypes.includes(assetType);
export const isYieldAsset = (assetType) => yieldAssetTypes.includes(assetType);
export const isPropertyAsset = (assetType) => propertyAssetTypes.includes(assetType);
