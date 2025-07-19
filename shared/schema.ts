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
  quantity: integer("quantity").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status").notNull(), // 'scheduled', 'in_progress', 'completed', 'cancelled'
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'confirmed', 'preparation', 'ready', 'in_delivery', 'delivered', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  deliveryAddress: text("delivery_address"),
  deliveryDate: timestamp("delivery_date"),
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
  assignedAt: timestamp("assigned_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  paymentReceived: decimal("payment_received", { precision: 10, scale: 2 }),
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
