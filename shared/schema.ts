import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

export const priceLists = pgTable("price_lists", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const priceRules = pgTable("price_rules", {
  id: serial("id").primaryKey(),
  priceListId: integer("price_list_id").references(() => priceLists.id).notNull(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const taxes = pgTable("taxes", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // TAX-000001
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // Taux en pourcentage
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // DA, EUR, USD
  symbol: text("symbol").notNull(), // دج, €, $
  rate: decimal("rate", { precision: 10, scale: 4 }).notNull().default("1.0000"), // Taux par rapport à la devise de base
  isBase: boolean("is_base").default(false), // Devise de base (DA)
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const deliveryMethods = pgTable("delivery_methods", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // LIV-000001
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const accountingJournals = pgTable("accounting_journals", {
  id: serial("id").primaryKey(),
  designation: text("designation").notNull(),
  code: text("code").notNull().unique(), // JRN-000001
  type: text("type").notNull(), // 'vente', 'achat', 'banque', 'caisse', 'ope_diverses'
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const accountingAccounts = pgTable("accounting_accounts", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(), // Numéro de compte (ex: 411000)
  designation: text("designation").notNull(),
  type: text("type").notNull(), // 'actif', 'passif', 'charge', 'produit'
  nature: text("nature").notNull().default("debit"), // 'debit', 'credit'
  parentId: integer("parent_id"), // Comptes hiérarchiques
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

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

// Articles unifiés (produits, ingrédients, services)
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  code: text("code").unique(), // Auto-generated: ING-000001, PRD-000001, SRV-000001
  name: text("name").notNull(), // Désignation
  type: text("type").notNull(), // 'product', 'ingredient', 'service'
  description: text("description"), // Description
  
  // Gestion de stock
  managedInStock: boolean("managed_in_stock").default(true),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id),
  categoryId: integer("category_id").references(() => articleCategories.id),
  unit: text("unit").notNull(),
  
  // Autorisation de vente
  allowSale: boolean("allow_sale").default(false),
  saleCategoryId: integer("sale_category_id").references(() => articleCategories.id),
  saleUnit: text("sale_unit"),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  taxId: integer("tax_id").references(() => taxes.id),
  
  // Stock et prix
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).default("0.00"), // PMP
  currentStock: decimal("current_stock", { precision: 10, scale: 3 }).default("0.00"),
  minStock: decimal("min_stock", { precision: 10, scale: 3 }).default("0.00"),
  maxStock: decimal("max_stock", { precision: 10, scale: 3 }).default("0.00"),
  photo: text("photo"),
  
  // Gestion des produits périssables
  isPerishable: boolean("is_perishable").default(false),
  shelfLife: integer("shelf_life"), // DLC en jours
  storageConditions: text("storage_conditions"), // Conditions de conservation (ex: "froid -18°")
  temperatureUnit: text("temperature_unit").default("°C"),
  
  // Spécifique aux produits
  preparationTime: integer("preparation_time"), // Temps de préparation en minutes
  difficulty: text("difficulty"), // 'facile', 'moyen', 'difficile'
  servings: integer("servings").default(1), // Nombre de portions
  price: decimal("price", { precision: 10, scale: 2 }), // Prix de vente
  
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Recettes - attachées aux articles de type "product"
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  designation: text("designation").notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(), // Quantité/nombre de parts
  unit: text("unit").notNull(), // Unité de mesure
  isSubRecipe: boolean("is_sub_recipe").default(false), // Est sous recette ?
  
  // Audit
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

// Ingrédients de recettes
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

// Opérations de recettes
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStorageLocationSchema = createInsertSchema(storageLocations).omit({ id: true });
export const insertMeasurementCategorySchema = createInsertSchema(measurementCategories).omit({ id: true });
export const insertMeasurementUnitSchema = createInsertSchema(measurementUnits).omit({ id: true });
export const insertArticleCategorySchema = createInsertSchema(articleCategories).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, code: true, createdAt: true });
export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, createdAt: true });
export const insertPriceRuleSchema = createInsertSchema(priceRules).omit({ id: true, createdAt: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true, createdAt: true });
export const insertRecipeOperationSchema = createInsertSchema(recipeOperations).omit({ id: true, createdAt: true });
export const insertTaxSchema = createInsertSchema(taxes).omit({ id: true, code: true, createdAt: true });
export const insertCurrencySchema = createInsertSchema(currencies).omit({ id: true, createdAt: true });
export const insertDeliveryMethodSchema = createInsertSchema(deliveryMethods).omit({ id: true, code: true, createdAt: true });
export const insertAccountingJournalSchema = createInsertSchema(accountingJournals).omit({ id: true, code: true, createdAt: true });
export const insertAccountingAccountSchema = createInsertSchema(accountingAccounts).omit({ id: true, createdAt: true });
export const insertStorageZoneSchema = createInsertSchema(storageZones).omit({ id: true, code: true, createdAt: true });
export const insertWorkStationSchema = createInsertSchema(workStations).omit({ id: true, code: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, code: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, code: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StorageLocation = typeof storageLocations.$inferSelect;
export type InsertStorageLocation = z.infer<typeof insertStorageLocationSchema>;
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
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;