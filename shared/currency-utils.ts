export type Currency = {
  id: number;
  designation: string;
  code: string;
  symbol: string;
  exchangeRate: string;
  isBase: boolean;
  active: boolean;
  createdAt: string;
};

/**
 * Formate un montant avec le symbole de la devise
 * @param amount Le montant à formater
 * @param currency La devise à utiliser
 * @param precision Le nombre de décimales (par défaut 2)
 * @returns Le montant formaté avec le symbole de devise
 */
export function formatCurrency(
  amount: string | number, 
  currency: Currency, 
  precision: number = 2
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `0.00 ${currency.symbol}`;
  }
  
  return `${numAmount.toFixed(precision)} ${currency.symbol}`;
}

/**
 * Formate un montant avec le symbole de devise par défaut (DA)
 * @param amount Le montant à formater
 * @param precision Le nombre de décimales (par défaut 2)
 * @returns Le montant formaté avec DA
 */
export function formatPrice(amount: string | number, precision: number = 2): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `0.00 DA`;
  }
  
  return `${numAmount.toFixed(precision)} DA`;
}

/**
 * Convertit un montant d'une devise vers une autre
 * @param amount Le montant à convertir
 * @param fromCurrency La devise source
 * @param toCurrency La devise cible
 * @returns Le montant converti
 */
export function convertCurrency(
  amount: string | number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 0;
  }
  
  // Si les deux devises sont identiques
  if (fromCurrency.id === toCurrency.id) {
    return numAmount;
  }
  
  // Convertir vers la devise de base, puis vers la devise cible
  const baseAmount = fromCurrency.isBase ? numAmount : numAmount / parseFloat(fromCurrency.exchangeRate);
  const targetAmount = toCurrency.isBase ? baseAmount : baseAmount * parseFloat(toCurrency.exchangeRate);
  
  return targetAmount;
}

/**
 * Vérifie si une devise est la devise par défaut (DA)
 * @param currency La devise à vérifier
 * @returns true si c'est la devise par défaut
 */
export function isDefaultCurrency(currency: Currency): boolean {
  return currency.code === 'DZA' || currency.isBase;
}