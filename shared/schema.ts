import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // 'admin', 'preparateur', 'gerant', 'client', 'livreur'
  active: boolean("active").default(true),
});

export const storageLocations = pgTable("storage_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  unit: text("unit").notNull(), // 'kg', 'l', 'm3'
});

// Table ingredients supprimée - utilisation de la table articles unifiée avec type="ingredient"

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // CLI-000001
  type: text("type").notNull(), // 'particulier' ou 'societe'
  companyType: text("company_type"), // 'eurl', 'sarl', 'spa', 'snc', etc.
  // Informations personnelles/société
  firstName: text("first_name"), // Pour particulier
  lastName: text("last_name"), // Pour particulier
  companyName: text("company_name"), // Pour société (nom de l'entreprise)
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  
  // Adresse
  contactName: text("contact_name"), // Nom du contact
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  wilaya: text("wilaya"),
  
  // Informations légales
  rc: text("rc"), // Registre de commerce
  na: text("na"), // Numéro d'agrément
  mf: text("mf"), // Matricule fiscal
  nis: text("nis"), // Numéro d'identification statistique
  
  // Configuration
  active: boolean("active").default(true),
  tarifParticulier: boolean("tarif_particulier").default(true), // Tarif particulier ?
  priceListId: integer("price_list_id").references(() => priceLists.id), // Offre tarifaire
  photo: text("photo"), // Photo
  
  // Lien avec compte utilisateur
  userId: integer("user_id").references(() => users.id), // Compte utilisateur lié
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // PRD-000001
  designation: text("designation").notNull(),
  description: text("description"),
  
  // Gestion stock
  managedInStock: boolean("managed_in_stock").default(true),
  active: boolean("active").default(true),
  stockTracking: text("stock_tracking").notNull(), // 'unit', 'weight', 'volume'
  managementUnit: text("management_unit").notNull(), // Unité de gestion
  storageZoneId: integer("storage_zone_id").references(() => storageZones.id),
  stockAlertThreshold: decimal("stock_alert_threshold", { precision: 10, scale: 2 }).default("0"),
  
  // Vente
  allowedForSale: boolean("allowed_for_sale").default(true),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("0"), // Taux TVA en %
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  saleUnit: text("sale_unit").notNull(), // Unité de vente
  
  // Conservation
  perishable: boolean("perishable").default(false),
  conservationDuration: integer("conservation_duration"), // Durée en jours
  conservationTemperature: decimal("conservation_temperature", { precision: 5, scale: 2 }), // Température en °C
  dlc: text("dlc"), // Date limite de consommation (format date string)
  
  // Classification
  categoryId: integer("category_id").references(() => articleCategories.id),
  photo: text("photo"),
  
  // Audit
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

// Les tables recipes, productions, orders, deliveries et productStock ont été supprimées
// Elles seront réimplémentées avec de nouvelles règles de gestion

export const measurementCategories = pgTable("measurement_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: boolean("active").default(true),
});

export const measurementUnits = pgTable("measurement_units", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => measurementCategories.id),
  label: text("label").notNull(),
  abbreviation: text("abbreviation").notNull(),
  type: text("type").notNull(), // 'reference', 'larger', 'smaller'
  factor: decimal("factor", { precision: 15, scale: 6 }).notNull(), // Conversion factor to reference unit
  active: boolean("active").default(true),
});

export const articleCategories = pgTable("article_categories", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  parentId: integer("parent_id"),
  forSale: boolean("for_sale").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Articles unifiés (produits, ingrédients, services)
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Auto-generated: ING-000001, PRD-000001, SRV-000001
  name: text("name").notNull(), // Désignation
  type: text("type").notNull(), // 'product', 'ingredient', 'service'
  description: text("description"), // Description
  
  // Catégories et unités
  categoryId: integer("category_id").references(() => articleCategories.id), // Catégorie
  unitId: integer("unit_id").references(() => measurementUnits.id), // Unité de mesure
  
  // Gestion de stock (pour ingrédients)
  managedInStock: boolean("managed_in_stock").default(true), // Gérer en stock ?
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id), // Zone de stockage
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).default("0"),
  minStock: decimal("min_stock", { precision: 10, scale: 2 }).default("0"),
  maxStock: decimal("max_stock", { precision: 10, scale: 2 }).default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).default("0"), // PMP - Prix Moyen Pondéré
  
  // Paramètres de vente (pour ingrédients vendables)
  allowSale: boolean("allow_sale").default(false), // Autoriser à la vente ?
  saleCategoryId: integer("sale_category_id").references(() => articleCategories.id), // Catégorie de vente
  saleUnitId: integer("sale_unit_id").references(() => measurementUnits.id), // Unité de vente
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).default("0"), // Prix de vente
  taxId: integer("tax_id").references(() => taxes.id), // TVA
  
  // Champs pour les produits/recettes
  preparationTime: integer("preparation_time"), // minutes
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  servings: integer("servings").default(1),
  
  // Champs communs
  photo: text("photo"), // Photo
  active: boolean("active").default(true), // Est actif
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Price Lists
export const priceLists = pgTable("price_lists", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  currency: text("currency").notNull().default("DA"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Price Rules
export const priceRules = pgTable("price_rules", {
  id: serial("id").primaryKey(),
  priceListId: integer("price_list_id").references(() => priceLists.id).notNull(),
  applyTo: text("apply_to").notNull(), // 'article' or 'category'
  articleId: integer("article_id").references(() => articles.id), // null if applies to category
  categoryId: integer("category_id").references(() => articleCategories.id), // null if applies to article
  priceType: text("price_type").notNull(), // 'fixed', 'discount', 'formula'
  fixedPrice: decimal("fixed_price", { precision: 10, scale: 2 }),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  formulaExpression: text("formula_expression"), // Expression pour calculs avancés
  minQuantity: decimal("min_quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  validFrom: timestamp("valid_from", { mode: 'string' }),
  validTo: timestamp("valid_to", { mode: 'string' }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStorageLocationSchema = createInsertSchema(storageLocations).omit({ id: true });
// Schema ingrédients supprimé - utiliser insertArticleSchema avec type="ingredient"
// Modules supprimés - schémas à recréer
export const insertMeasurementCategorySchema = createInsertSchema(measurementCategories).omit({ id: true });
export const insertMeasurementUnitSchema = createInsertSchema(measurementUnits).omit({ id: true });
export const insertArticleCategorySchema = createInsertSchema(articleCategories).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, code: true });
export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, createdAt: true });
export const insertPriceRuleSchema = createInsertSchema(priceRules).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StorageLocation = typeof storageLocations.$inferSelect;
export type InsertStorageLocation = z.infer<typeof insertStorageLocationSchema>;
// Types ingrédients supprimés - utiliser Article avec type="ingredient"
export type Ingredient = typeof articles.$inferSelect;
export type InsertIngredient = z.infer<typeof insertArticleSchema>;
// Types supprimés - à recréer
export type MeasurementCategory = typeof measurementCategories.$inferSelect;
export type InsertMeasurementCategory = z.infer<typeof insertMeasurementCategorySchema>;
export type MeasurementUnit = typeof measurementUnits.$inferSelect;
export type InsertMeasurementUnit = z.infer<typeof insertMeasurementUnitSchema>;
export type ArticleCategory = typeof articleCategories.$inferSelect;
export type InsertArticleCategory = z.infer<typeof insertArticleCategorySchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type PriceRule = typeof priceRules.$inferSelect;
export type InsertPriceRule = z.infer<typeof insertPriceRuleSchema>;
export type Tax = typeof taxes.$inferSelect;
export type InsertTax = z.infer<typeof insertTaxSchema>;
export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type DeliveryMethod = typeof deliveryMethods.$inferSelect;
export type InsertDeliveryMethod = z.infer<typeof insertDeliveryMethodSchema>;
export type AccountingJournal = typeof accountingJournals.$inferSelect;
export type InsertAccountingJournal = z.infer<typeof insertAccountingJournalSchema>;
export type AccountingAccount = typeof accountingAccounts.$inferSelect;
export type InsertAccountingAccount = z.infer<typeof insertAccountingAccountSchema>;
export type StorageZone = typeof storageZones.$inferSelect;
export type InsertStorageZone = z.infer<typeof insertStorageZoneSchema>;
export type WorkStation = typeof workStations.$inferSelect;
export type InsertWorkStation = z.infer<typeof insertWorkStationSchema>;

// 7. Taxes des articles
export const taxes = pgTable("taxes", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // TAX-000001
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // Taux en pourcentage
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 8. Devises (Currencies)
export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(), // Euro, Dollar US, Dinar Algérien
  code: text("code").notNull().unique(), // EUR, USD, DZD
  symbol: text("symbol").notNull(), // €, $, DA
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1.0000"), // Taux par rapport à la devise de base
  isBase: boolean("is_base").default(false), // Une seule devise de base
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 9. Modes de livraison
export const deliveryMethods = pgTable("delivery_methods", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // LIV-000001
  description: text("description"),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"), // Coût de livraison
  estimatedTime: text("estimated_time"), // "24h", "2-3 jours", etc.
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 10. Journaux comptables
export const accountingJournals = pgTable("accounting_journals", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // JRN-000001
  type: text("type").notNull(), // 'vente', 'achat', 'banque', 'caisse', 'operations_diverses'
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Comptes comptables
export const accountingAccounts = pgTable("accounting_accounts", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // Numéro de compte comptable
  type: text("type").notNull(), // 'actif', 'passif', 'charge', 'produit'
  nature: text("nature").notNull().default("debit"), // 'debit', 'credit'
  parentId: integer("parent_id"), // Comptes hiérarchiques - référence ajoutée après
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 11. Zones de stockage (extension de storage_locations existant)
export const storageZones = pgTable("storage_zones", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // ZON-000001
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id),
  description: text("description"),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  unit: text("unit"), // 'kg', 'l', 'm3', 'pieces'
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 12. Postes de travail (équipements)
export const workStations = pgTable("work_stations", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // PST-000001
  type: text("type").notNull(), // 'four', 'mixeur', 'refrigerateur', 'plan_travail', 'machine_specialist'
  brand: text("brand"), // Marque
  model: text("model"), // Modèle
  serialNumber: text("serial_number"), // Numéro de série
  capacity: text("capacity"), // Capacité/dimension
  power: text("power"), // Puissance
  description: text("description"),
  maintenanceDate: timestamp("maintenance_date", { mode: 'string' }), // Dernière maintenance
  nextMaintenanceDate: timestamp("next_maintenance_date", { mode: 'string' }), // Prochaine maintenance
  status: text("status").notNull().default("operationnel"), // 'operationnel', 'en_panne', 'maintenance', 'hors_service'
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 13. Fournisseurs (Suppliers)
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // FRN-000001
  type: text("type").notNull(), // 'particulier', 'societe'
  companyType: text("company_type"), // 'eurl', 'sarl', 'spa', 'snc', etc.
  // Informations personnelles/société
  firstName: text("first_name"), // Pour particulier
  lastName: text("last_name"), // Pour particulier
  companyName: text("company_name"), // Pour société
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  // Adresse
  contactName: text("contact_name"), // Nom du contact
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  wilaya: text("wilaya"), // Équivalent de région/état en Algérie
  // Informations légales algériennes
  rc: text("rc"), // Registre de Commerce
  na: text("na"), // Numéro d'Agrément
  mf: text("mf"), // Matricule Fiscale
  nis: text("nis"), // Numéro d'Identification Statistique
  // Autres
  photo: text("photo"), // URL ou chemin vers la photo
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Insert schemas for new tables
export const insertTaxSchema = createInsertSchema(taxes).omit({ id: true, code: true, createdAt: true });
export const insertCurrencySchema = createInsertSchema(currencies).omit({ id: true, createdAt: true });
export const insertDeliveryMethodSchema = createInsertSchema(deliveryMethods).omit({ id: true, code: true, createdAt: true });
export const insertAccountingJournalSchema = createInsertSchema(accountingJournals).omit({ id: true, code: true, createdAt: true });
export const insertAccountingAccountSchema = createInsertSchema(accountingAccounts).omit({ id: true, createdAt: true });
export const insertStorageZoneSchema = createInsertSchema(storageZones).omit({ id: true, code: true, createdAt: true });
export const insertWorkStationSchema = createInsertSchema(workStations).omit({ id: true, code: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, code: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, code: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, code: true, createdAt: true, updatedAt: true });

// Types pour TypeScript
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof insertSupplierSchema._type;
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof insertClientSchema._type;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof insertProductSchema._type;
