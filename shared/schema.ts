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
  symbol: text("symbol").notNull(), // دج, DA, $
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
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, code: true, createdAt: true }).extend({
  // Transform string inputs to appropriate types for numeric fields
  shelfLife: z.union([z.string(), z.number(), z.null()]).transform((val) => {
    if (val === null || val === "" || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }),
  salePrice: z.union([z.string(), z.number(), z.null()]).transform((val) => {
    if (val === null || val === "" || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed.toString();
    }
    return val?.toString() || null;
  }),
  minStock: z.union([z.string(), z.number()]).transform((val) => {
    if (val === null || val === "" || val === undefined) return "0.00";
    if (typeof val === "number") return val.toString();
    return val;
  }),
  maxStock: z.union([z.string(), z.number()]).transform((val) => {
    if (val === null || val === "" || val === undefined) return "0.00";
    if (typeof val === "number") return val.toString();
    return val;
  }),
});
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
// Purchase types removed as purchase_* tables are not used anymore

// ============ ACHATS FOURNISSEURS ============

// purchase_* tables and schemas removed

// ============ COMMANDES & DEVIS ============

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // CMD-000001 ou DEV-000001
  type: text("type").notNull().default("order"), // 'quote' (devis) ou 'order' (commande)
  clientId: integer("client_id").references(() => clients.id).notNull(),
  status: text("status").notNull().default("draft"), // draft, confirmed, prepared, ready, partially_delivered, delivered, cancelled
  
  // Dates
  orderDate: timestamp("order_date", { mode: 'string' }).defaultNow(),
  deliveryDate: timestamp("delivery_date", { mode: 'string' }),
  confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
  
  // Totaux
  subtotalHT: decimal("subtotal_ht", { precision: 10, scale: 2 }).default("0.00"),
  totalTax: decimal("total_tax", { precision: 10, scale: 2 }).default("0.00"),
  totalTTC: decimal("total_ttc", { precision: 10, scale: 2 }).default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Notes
  notes: text("notes"),
  deliveryNotes: text("delivery_notes"),
  
  // Audit
  createdBy: integer("created_by").references(() => users.id),
  confirmedBy: integer("confirmed_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Production tracking
  quantityPlanned: decimal("quantity_planned", { precision: 10, scale: 3 }).default("0.00"),
  quantityPrepared: decimal("quantity_prepared", { precision: 10, scale: 3 }).default("0.00"),
  quantityDelivered: decimal("quantity_delivered", { precision: 10, scale: 3 }).default("0.00"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// ============ OPERATIONS D'INVENTAIRE ============

export const inventoryOperations = pgTable("inventory_operations", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // REC-000001, PREP-000001, etc.
  type: text("type").notNull(), // reception, preparation, preparation_reliquat, ajustement, ajustement_rebut, inventaire_initiale, interne, livraison
  status: text("status").notNull().default("draft"), // draft, pending, ready, completed, cancelled, programmed, in_progress
  
  // Références
  supplierId: integer("supplier_id").references(() => suppliers.id), // Pour réceptions
  orderId: integer("order_id").references(() => orders.id), // Pour préparations/livraisons
  // purchaseOrderId removed: we don't use purchase_* tables
  parentOperationId: integer("parent_operation_id"), // Pour reliquats et rectifications
  storageZoneId: integer("storage_zone_id").references(() => storageZones.id),
  operatorId: integer("operator_id").references(() => users.id), // Préparateur/opérateur
  
  // Dates
  scheduledDate: timestamp("scheduled_date", { mode: 'string' }),
  startedAt: timestamp("started_at", { mode: 'string' }),
  completedAt: timestamp("completed_at", { mode: 'string' }),
  
  // Montants (pour réceptions)
  subtotalHT: decimal("subtotal_ht", { precision: 10, scale: 2 }).default("0.00"),
  totalTax: decimal("total_tax", { precision: 10, scale: 2 }).default("0.00"),
  totalTTC: decimal("total_ttc", { precision: 10, scale: 2 }).default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Divers
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  
  // Audit
  createdBy: integer("created_by").references(() => users.id),
  completedBy: integer("completed_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const inventoryOperationItems = pgTable("inventory_operation_items", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => inventoryOperations.id, { onDelete: 'cascade' }).notNull(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  
  // Quantités
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  quantityBefore: decimal("quantity_before", { precision: 10, scale: 3 }), // Stock avant opération
  quantityAfter: decimal("quantity_after", { precision: 10, scale: 3 }), // Stock après opération
  
  // Prix (pour réceptions)
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0.00"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default("0.00"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Zone de stockage
  fromStorageZoneId: integer("from_storage_zone_id").references(() => storageZones.id),
  toStorageZoneId: integer("to_storage_zone_id").references(() => storageZones.id),
  
  // Rebuts
  wasteReason: text("waste_reason"), // pour ajustement_rebut
  wasteLocationId: integer("waste_location_id").references(() => storageZones.id),
  
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// ======= INVENTORY (single table, mixed approach: header + line details in one row) =======
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  type: text("type").notNull(), // reception, preparation, ajustement, interne, livraison, etc.
  status: text("status").notNull().default("draft"),

  // Contexte opération
  operationDate: timestamp("operation_date", { mode: 'string' }).defaultNow(),
  operationId: integer("operation_id").references(() => inventoryOperations.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  orderId: integer("order_id").references(() => orders.id),
  // purchaseOrderId removed: we don't use purchase_* tables
  operatorId: integer("operator_id").references(() => users.id),

  // Mouvement/Article
  articleId: integer("article_id").references(() => articles.id).notNull(),
  fromStorageZoneId: integer("from_storage_zone_id").references(() => storageZones.id),
  toStorageZoneId: integer("to_storage_zone_id").references(() => storageZones.id),
  quantityBefore: decimal("quantity_before", { precision: 10, scale: 3 }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  quantityAfter: decimal("quantity_after", { precision: 10, scale: 3 }),

  // Coûts/Taxes (pour réceptions)
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),

  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, createdAt: true, updatedAt: true });
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

// ============ LIVRAISONS ============

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // LIV-000001
  orderId: integer("order_id").references(() => orders.id).notNull(),
  operationId: integer("operation_id").references(() => inventoryOperations.id), // Opération de livraison liée
  
  // Livreur et dates
  deliveryPersonId: integer("delivery_person_id").references(() => users.id),
  scheduledDate: timestamp("scheduled_date", { mode: 'string' }),
  deliveredAt: timestamp("delivered_at", { mode: 'string' }),
  
  // Statut et adresse
  status: text("status").notNull().default("pending"), // pending, in_transit, delivered, cancelled
  deliveryAddress: text("delivery_address"),
  deliveryNotes: text("delivery_notes"),
  
  // Colis
  packageCount: integer("package_count").default(1),
  trackingNumbers: text("tracking_numbers"), // JSON array of tracking numbers
  
  // Audit
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const deliveryPackages = pgTable("delivery_packages", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").references(() => deliveries.id, { onDelete: 'cascade' }).notNull(),
  packageNumber: text("package_number").notNull(), // COL-000001
  weight: decimal("weight", { precision: 8, scale: 3 }),
  dimensions: text("dimensions"), // LxWxH
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const deliveryItems = pgTable("delivery_items", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").references(() => deliveries.id, { onDelete: 'cascade' }).notNull(),
  packageId: integer("package_id").references(() => deliveryPackages.id),
  orderItemId: integer("order_item_id").references(() => orderItems.id).notNull(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// ============ FACTURATION ============

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // FAC-000001
  orderId: integer("order_id").references(() => orders.id),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  
  // Statut et dates
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  issueDate: timestamp("issue_date", { mode: 'string' }).defaultNow(),
  dueDate: timestamp("due_date", { mode: 'string' }),
  paidAt: timestamp("paid_at", { mode: 'string' }),
  
  // Montants
  subtotalHT: decimal("subtotal_ht", { precision: 10, scale: 2 }).notNull(),
  totalTax: decimal("total_tax", { precision: 10, scale: 2 }).default("0.00"),
  totalTTC: decimal("total_ttc", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0.00"),
  
  // Adresses et notes
  billingAddress: text("billing_address"),
  notes: text("notes"),
  paymentTerms: text("payment_terms"),
  
  // Comptabilité
  accountingEntryId: integer("accounting_entry_id"), // Référence vers écriture comptable
  
  // Audit
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  articleId: integer("article_id").references(() => articles.id),
  orderItemId: integer("order_item_id").references(() => orderItems.id),
  
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// ============ COMPTABILITE ============

export const accountingEntries = pgTable("accounting_entries", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // ECR-000001
  journalId: integer("journal_id").references(() => accountingJournals.id).notNull(),
  
  // Dates et référence
  entryDate: timestamp("entry_date", { mode: 'string' }).defaultNow(),
  reference: text("reference"), // Référence externe (facture, etc.)
  description: text("description").notNull(),
  
  // Montants
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).default("0.00"),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).default("0.00"),
  
  // Statut
  status: text("status").notNull().default("draft"), // draft, validated, cancelled
  validatedAt: timestamp("validated_at", { mode: 'string' }),
  validatedBy: integer("validated_by").references(() => users.id),
  
  // Audit
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const accountingEntryLines = pgTable("accounting_entry_lines", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => accountingEntries.id, { onDelete: 'cascade' }).notNull(),
  accountId: integer("account_id").references(() => accountingAccounts.id).notNull(),
  
  description: text("description").notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0.00"),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0.00"),
  
  // Références optionnelles
  partnerId: integer("partner_id"), // Client ou fournisseur
  partnerType: text("partner_type"), // 'client' ou 'supplier'
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Insert schemas
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, code: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, createdAt: true }).extend({
  // Transform numeric inputs to appropriate types for decimal fields
  quantity: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === "number") return val.toString();
    return val;
  }),
  unitPrice: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === "number") return val.toString();
    return val;
  }),
  totalPrice: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === "number") return val.toString();
    return val;
  }),
    taxAmount: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === "number") return val.toString();
    return val;
  }),
    taxRate: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === "number") return val.toString();
    return val;
  }),
});
export const insertOrderWithItemsSchema = z.object({
  order: insertOrderSchema,
  items: z.array(insertOrderItemSchema).min(1, "Au moins un article est requis."),
});
export const updateOrderWithItemsSchema = z.object({
  order: insertOrderSchema.omit({ createdBy: true }).partial(),
  items: z.array(insertOrderItemSchema).min(1, "Au moins un article est requis."),
});
export const insertInventoryOperationSchema = createInsertSchema(inventoryOperations).omit({ id: true, code: true, createdAt: true, updatedAt: true });
export const insertInventoryOperationItemSchema = createInsertSchema(inventoryOperationItems).omit({ id: true, createdAt: true });
export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true, code: true, createdAt: true, updatedAt: true });
export const insertDeliveryPackageSchema = createInsertSchema(deliveryPackages).omit({ id: true, createdAt: true });
export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, code: true, createdAt: true, updatedAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, createdAt: true });
export const insertAccountingEntrySchema = createInsertSchema(accountingEntries).omit({ id: true, code: true, createdAt: true, updatedAt: true });
export const insertAccountingEntryLineSchema = createInsertSchema(accountingEntryLines).omit({ id: true, createdAt: true });

// Types
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InventoryOperation = typeof inventoryOperations.$inferSelect;
export type InsertInventoryOperation = z.infer<typeof insertInventoryOperationSchema>;
export type InventoryOperationItem = typeof inventoryOperationItems.$inferSelect;
export type InsertInventoryOperationItem = z.infer<typeof insertInventoryOperationItemSchema>;
export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type DeliveryPackage = typeof deliveryPackages.$inferSelect;
export type InsertDeliveryPackage = z.infer<typeof insertDeliveryPackageSchema>;
export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type AccountingEntry = typeof accountingEntries.$inferSelect;
export type InsertAccountingEntry = z.infer<typeof insertAccountingEntrySchema>;
export type AccountingEntryLine = typeof accountingEntryLines.$inferSelect;
export type InsertAccountingEntryLine = z.infer<typeof insertAccountingEntryLineSchema>;