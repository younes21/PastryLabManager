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

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // 'g', 'kg', 'ml', 'l', 'piece'
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).default("0"),
  minStock: decimal("min_stock", { precision: 10, scale: 2 }).default("0"),
  maxStock: decimal("max_stock", { precision: 10, scale: 2 }).default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).default("0"),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  preparationTime: integer("preparation_time"), // minutes
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  servings: integer("servings").default(1),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  active: boolean("active").default(true),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
});

export const productions = pgTable("productions", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id),
  preparerId: integer("preparer_id").references(() => users.id),
  orderId: integer("order_id").references(() => orders.id), // Link to order if production is from order
  quantity: integer("quantity").notNull(),
  scheduledTime: timestamp("scheduled_time", { mode: 'string' }).notNull(),
  startTime: timestamp("start_time", { mode: 'string' }),
  endTime: timestamp("end_time", { mode: 'string' }),
  status: text("status").notNull(), // 'en_attente', 'en_production', 'termine', 'a_refaire'
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'confirmed', 'preparation', 'ready', 'in_delivery', 'delivered', 'cancelled'
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  deliveryAddress: text("delivery_address"),
  deliveryDate: timestamp("delivery_date", { mode: 'string' }),
  deliveryTime: text("delivery_time"),
  delivererId: integer("deliverer_id").references(() => users.id),
  notes: text("notes"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  recipeId: integer("recipe_id").references(() => recipes.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  delivererId: integer("deliverer_id").references(() => users.id),
  status: text("status").notNull(), // 'assigned', 'in_transit', 'delivered', 'failed'
  assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
  deliveredAt: timestamp("delivered_at", { mode: 'string' }),
  notes: text("notes"),
  paymentReceived: decimal("payment_received", { precision: 10, scale: 2 }),
});

export const productStock = pgTable("product_stock", {
  id: serial("id").primaryKey(),
  productionId: integer("production_id").references(() => productions.id),
  recipeId: integer("recipe_id").references(() => recipes.id),
  orderId: integer("order_id").references(() => orders.id),
  customerName: text("customer_name"),
  quantity: integer("quantity").notNull(),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id),
  productionDate: timestamp("production_date", { mode: 'string' }).defaultNow(),
  expirationDate: timestamp("expiration_date", { mode: 'string' }).notNull(),
  barcode: text("barcode").unique(),
  status: text("status").notNull().default("available"), // 'available', 'reserved', 'delivered', 'expired'
  preparerId: integer("preparer_id").references(() => users.id),
});

export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  productStockId: integer("product_stock_id").references(() => productStock.id),
  barcode: text("barcode").notNull(),
  productName: text("product_name").notNull(),
  customerName: text("customer_name"),
  productionDate: timestamp("production_date", { mode: 'string' }).notNull(),
  expirationDate: timestamp("expiration_date", { mode: 'string' }).notNull(),
  preparerName: text("preparer_name"),
  quantity: integer("quantity").notNull(),
  printed: boolean("printed").default(false),
  printedAt: timestamp("printed_at", { mode: 'string' }),
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

// Articles unifiés (produits, ingrédients, services)
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'product', 'ingredient', 'service'
  categoryId: integer("category_id").references(() => articleCategories.id),
  description: text("description"),
  unit: text("unit").notNull(), // 'g', 'kg', 'ml', 'l', 'piece', 'hour'
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).default("0"),
  // Champs pour les ingrédients
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).default("0"),
  minStock: decimal("min_stock", { precision: 10, scale: 2 }).default("0"),
  maxStock: decimal("max_stock", { precision: 10, scale: 2 }).default("0"),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id),
  // Champs pour les produits/recettes
  preparationTime: integer("preparation_time"), // minutes
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  servings: integer("servings").default(1),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStorageLocationSchema = createInsertSchema(storageLocations).omit({ id: true });
export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertProductionSchema = createInsertSchema(productions).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true });
export const insertProductStockSchema = createInsertSchema(productStock).omit({ id: true });
export const insertLabelSchema = createInsertSchema(labels).omit({ id: true });
export const insertMeasurementCategorySchema = createInsertSchema(measurementCategories).omit({ id: true });
export const insertMeasurementUnitSchema = createInsertSchema(measurementUnits).omit({ id: true });
export const insertArticleCategorySchema = createInsertSchema(articleCategories).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true });
export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, createdAt: true });
export const insertPriceRuleSchema = createInsertSchema(priceRules).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StorageLocation = typeof storageLocations.$inferSelect;
export type InsertStorageLocation = z.infer<typeof insertStorageLocationSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type Production = typeof productions.$inferSelect;
export type InsertProduction = z.infer<typeof insertProductionSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type ProductStock = typeof productStock.$inferSelect;
export type InsertProductStock = z.infer<typeof insertProductStockSchema>;
export type Label = typeof labels.$inferSelect;
export type InsertLabel = z.infer<typeof insertLabelSchema>;
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

// Insert schemas for new tables
export const insertTaxSchema = createInsertSchema(taxes).omit({ id: true, code: true, createdAt: true });
export const insertCurrencySchema = createInsertSchema(currencies).omit({ id: true, createdAt: true });
export const insertDeliveryMethodSchema = createInsertSchema(deliveryMethods).omit({ id: true, code: true, createdAt: true });
export const insertAccountingJournalSchema = createInsertSchema(accountingJournals).omit({ id: true, code: true, createdAt: true });
export const insertAccountingAccountSchema = createInsertSchema(accountingAccounts).omit({ id: true, createdAt: true });
export const insertStorageZoneSchema = createInsertSchema(storageZones).omit({ id: true, code: true, createdAt: true });
export const insertWorkStationSchema = createInsertSchema(workStations).omit({ id: true, code: true, createdAt: true });
