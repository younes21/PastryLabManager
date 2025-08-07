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

// Recettes - attachées aux articles de type "product" (une seule recette max par produit)
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id).notNull().unique(), // Une seule recette par article-produit
  designation: text("designation").notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(), // Quantité/nombre de parts
  unit: text("unit").notNull(), // Unité de mesure
  isSubRecipe: boolean("is_sub_recipe").default(false), // Est sous recette ?
  
  // Audit
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});



// Les tables productions, orders, deliveries et productStock ont été supprimées
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

// Articles unifiés (produits, ingrédients, services) - structure selon spécifications
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  code: text("code").unique(), // Auto-generated: ING-000001, PRD-000001, SRV-000001
  name: text("name").notNull(), // Désignation
  type: text("type").notNull(), // 'product', 'ingredient', 'service'
  description: text("description"), // Description
  
  // Gestion de stock
  managedInStock: boolean("managed_in_stock").default(true), // Gérer en stock ?
  storageLocationId: integer("storage_location_id"), // Zone de stockage
  categoryId: integer("category_id"), // Catégorie
  unit: text("unit"), // Unité de mesure
  
  // Paramètres de vente
  allowSale: boolean("allow_sale").default(false), // Autoriser à la vente ?
  saleCategoryId: integer("sale_category_id"), // Catégorie de vente
  saleUnit: text("sale_unit"), // Unité de vente
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), // Prix de vente
  taxId: integer("tax_id"), // TVA
  
  // Stock et prix
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }), // PMP - Prix Moyen Pondéré
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }), // Stock actuel (géré par opérations d'inventaire)
  minStock: decimal("min_stock", { precision: 10, scale: 2 }), // Stock minimum
  maxStock: decimal("max_stock", { precision: 10, scale: 2 }), // Stock maximum
  
  // Photo et métadonnées
  photo: text("photo"), // Photo
  
  // Champs pour les produits périssables
  isPerishable: boolean("is_perishable").default(false), // Produit périssable
  shelfLife: integer("shelf_life"), // Durée de conservation en jours
  storageConditions: text("storage_conditions"), // Conditions de conservation (ex: "froid -18°")
  temperatureUnit: text("temperature_unit").default("°C"), // Unité de température (garde compatibilité)
  
  // Champs pour les produits/recettes
  preparationTime: integer("preparation_time"), // minutes
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  servings: integer("servings"),
  price: decimal("price", { precision: 10, scale: 2 }), // Ancien champ prix (compatibilité)
  
  // Champs communs
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
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, code: true }).extend({
  minStock: z.union([z.string(), z.number()]).optional().transform((val) => val ? parseFloat(String(val)) : undefined),
  maxStock: z.union([z.string(), z.number()]).optional().transform((val) => val ? parseFloat(String(val)) : undefined),
  salePrice: z.union([z.string(), z.number()]).optional().transform((val) => val ? parseFloat(String(val)) : undefined),
  shelfLife: z.union([z.string(), z.number()]).optional().transform((val) => val ? parseInt(String(val)) : undefined),
  storageConditions: z.string().optional(),
});
export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, createdAt: true });
export const insertPriceRuleSchema = createInsertSchema(priceRules).omit({ id: true, createdAt: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true, createdAt: true });
export const insertRecipeOperationSchema = createInsertSchema(recipeOperations).omit({ id: true, createdAt: true });

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
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type RecipeOperation = typeof recipeOperations.$inferSelect;
export type InsertRecipeOperation = z.infer<typeof insertRecipeOperationSchema>;
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
  symbol: text("symbol").notNull(), // DA, $, DA
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
// 14. Ingrédients de recettes
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  articleId: integer("article_id").notNull().references(() => articles.id), // Peut être ingredient ou produit (sous-recette)
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  notes: text("notes"), // Notes spécifiques à cet ingrédient dans cette recette
  order: integer("order").default(0), // Ordre d'ajout des ingrédients
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 15. Opérations de recettes
export const recipeOperations = pgTable("recipe_operations", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  duration: integer("duration"), // Durée en minutes
  workStationId: integer("work_station_id").references(() => workStations.id),
  order: integer("order").default(0), // Ordre des opérations
  temperature: text("temperature"), // Température si applicable
  notes: text("notes"), // Notes supplémentaires
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Relations
export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  article: one(articles, {
    fields: [recipeIngredients.articleId],
    references: [articles.id],
  }),
}));

export const recipeOperationsRelations = relations(recipeOperations, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeOperations.recipeId],
    references: [recipes.id],
  }),
  workStation: one(workStations, {
    fields: [recipeOperations.workStationId],
    references: [workStations.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  article: one(articles, {
    fields: [recipes.articleId],
    references: [articles.id],
  }),
  ingredients: many(recipeIngredients),
  operations: many(recipeOperations),
}));

// Insert schemas
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true, createdAt: true });
export const insertRecipeOperationSchema = createInsertSchema(recipeOperations).omit({ id: true, createdAt: true });

// Types pour TypeScript
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof insertRecipeIngredientSchema._type;
export type RecipeOperation = typeof recipeOperations.$inferSelect;
export type InsertRecipeOperation = typeof insertRecipeOperationSchema._type;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof insertSupplierSchema._type;
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof insertClientSchema._type;
