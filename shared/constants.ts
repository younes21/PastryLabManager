// Centralisation des constantes, enums et valeurs métiers

// Utilisateurs
export enum UserRole {
  ADMIN = "admin",
  PREPARATEUR = "preparateur",
  GERANT = "gerant",
  CLIENT = "client",
  LIVREUR = "livreur",
}

// Mesures
export enum MeasurementUnitType {
  REFERENCE = "reference",
  LARGER = "larger",
  SMALLER = "smaller",
}

// Catégories d'articles
export enum ArticleCategoryType {
  PRODUCT = "produit",
  INGREDIENT = "ingredient",
  SERVICE = "service", 
}


// Journaux comptables
export enum AccountingJournalType {
  VENTE = "vente",
  ACHAT = "achat",
  BANQUE = "banque",
  CAISSE = "caisse",
  OPE_DIVERSES = "ope_diverses",
}

// Comptes comptables
export enum AccountingAccountType {
  ACTIF = "actif",
  PASSIF = "passif",
  CHARGE = "charge",
  PRODUIT = "produit",
}
export enum AccountingAccountNature {
  DEBIT = "debit",
  CREDIT = "credit",
}

// Zones de stockage
export enum StorageUnit {
  KG = "kg",
  L = "l",
  M3 = "m3",
  PIECES = "pieces",
}


// Postes de travail
export enum WorkStationType {
  FOUR = "four",
  MIXEUR = "mixeur",
  REFRIGERATEUR = "refrigerateur",
  PLAN_TRAVAIL = "plan_travail",
  MACHINE_SPECIALIST = "machine_specialist",
}
export enum WorkStationStatus {
  OPERATIONNEL = "operationnel",
  EN_PANNE = "en_panne",
  MAINTENANCE = "maintenance",
  HORS_SERVICE = "hors_service",
}

// Fournisseurs/Clients
export enum PersonType {
  PARTICULIER = "particulier",
  SOCIETE = "societe",
}


export enum ArticlePrefix{
  PRODUCT = "PROD",
  INGREDIENT = "ING",
  SERVICE = "SERV",
}
export enum ArticleDifficulty {
  FACILE = "facile",
  MOYEN = "moyen",
  DIFFICILE = "difficile",
}

// Statuts de vente d'article
export enum ArticleSaleStatus {
  DISPONIBLE = "disponible",
  SUSPENDU = "suspendu",
  RETIRE = "retiré",
}

// Règles de prix
export enum PriceRuleApplyTo {
  ARTICLE = "article",
  CATEGORY = "category",
}
export enum PriceRuleType {
  FIXED = "fixed",
  DISCOUNT = "discount",
  FORMULA = "formula",
}

// Statuts de commande
export enum OrderType {
  QUOTE = "quote",
  ORDER = "order",
}
export enum OrderPrefix {
  DEV = "DEV",
  CMD = "CMD",
}
export enum OrderStatus {
  DRAFT = "draft",
  CONFIRMED = "confirmed",
  VALIDATED = "validated",
  PREPARED = "prepared",
  READY = "ready",
  PARTIALLY_DELIVERED = "partially_delivered",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}


// Opérations d'inventaire
export enum InventoryOperationType {
  RECEPTION = "reception",
  LIVRAISON = "livraison",
  AJUSTEMENT = "ajustement",
  REBUT_LIVRAISON = "rebut_livraison",
  REBUT_FABRICATION = "rebut_fabrication",
  RETOUR_LIVRAISON = "retour_livraison",
  INVENTAIRE = "inventaire",
  INTERNE = "interne",
  INVENTAIRE_INITIALE = "inventaire_initiale",
  FABRICATION = "fabrication",
  FABRICATION_RELIQUAT = "fabrication_reliquat",
}
export const PrefixInventoryOperationType: Record<string, string> = {
  [InventoryOperationType.RECEPTION]: "REC",
  [InventoryOperationType.LIVRAISON]: "LIV",
  [InventoryOperationType.AJUSTEMENT]: "AJU",
  [InventoryOperationType.REBUT_LIVRAISON]: "REBL",
  [InventoryOperationType.REBUT_FABRICATION]: "REBF",
  [InventoryOperationType.RETOUR_LIVRAISON]: "RETL",
  [InventoryOperationType.INVENTAIRE]: "INV",
  [InventoryOperationType.INTERNE]: "INT",
  [InventoryOperationType.INVENTAIRE_INITIALE]: "INI",
  [InventoryOperationType.FABRICATION]: "FAB",
  [InventoryOperationType.FABRICATION_RELIQUAT]: "REL",
} as const;

// Fonction safe pour obtenir le préfixe
export const getOperationPrefix = (type: string): string => {
  return PrefixInventoryOperationType[type] || "OP";
};

export enum InventoryOperationStatus {
  DRAFT = "draft",
  PROGRAMMED = "programmed",
  PENDING = "pending",
  READY = "ready",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Statuts de ligne d'inventaire
export enum InventoryLineStatus {
  PENDING = "pending",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

// Réservations de stock
export enum StockReservationStatus {
  RESERVED = "reserved",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
export enum StockReservationType {
  ORDER = "order",
  DELIVERY = "delivery",
  PRODUCTION = "production",
  INVENTORY = "inventory",
}
export enum StockReservationDirection {
  IN = "in",
  OUT = "out",
}

// Factures
export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  PAID = "paid",
  PARTIAL = "partial",
  CANCELLED = "cancelled",
}

// Paiements
export enum PaymentMethod {
  CASH = "cash",
  BANK = "bank",
  CARD = "card",
  CHEQUE = "cheque",
}

// prepration
export enum ProductionItemStatus {
  AVAILABLE = "available",
  PARTIAL = "partial",
  IN_PRODUCTION = "in_production",
  MISSING = "missing",
  DELIVERED = "delivered",
}
export enum ProductionStatus {
  NON_PREPARE = "non_prepare",
  EN_COURS = "en_cours",
  PREPARE = "prepare",
  PARTIELLEMENT_PREPARE = "partiellement_prepare",
}

export enum DateTypes {
  TODAY = "today",
  YESTERDAY = "yesterday",
  TOMORROW = "tomorrow",
  RANGE = "range",
}

// =============================================
// CODES PRÉFIXES
// =============================================
export const ZONE_CODE_PREFIX = "ZON";
export const JOURNAL_CODE_PREFIX = "JRN";
export const TAX_CODE_PREFIX = "TVA";
export const STATION_CODE_PREFIX = "PST";
export const SUPPLIER_CODE_PREFIX = "FRN";
export const CLIENT_CODE_PREFIX = "CLI";

// =============================================
// DEVISES ET TAUX
// =============================================
export const DEFAULT_CURRENCY = "DA" as const;
export const DEFAULT_CURRENCY_DZD = "DZD" as const;
export const DEFAULT_CURRENCY_RATE = "1.0000" as const;
export const DEFAULT_INVENTORY_CURRENCY = DEFAULT_CURRENCY_DZD;

// =============================================
// ARTICLES ET STOCKS
// =============================================
export const DEFAULT_ARTICLE_UNIT = "Kg";
export const DEFAULT_ARTICLE_SERVINGS = 1;
export const DEFAULT_ARTICLE_TEMPERATURE_UNIT = "°C" as const;
export const DEFAULT_MIN_QUANTITY = "1" as const;



export const CLIENT_TYPE = "societe" as const;
export const FILTER_ALL = "all" as const;




