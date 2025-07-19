import {
  users, storageLocations, ingredients, recipes, recipeIngredients,
  productions, orders, orderItems, deliveries,
  type User, type InsertUser, type StorageLocation, type InsertStorageLocation,
  type Ingredient, type InsertIngredient, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient, type Production, type InsertProduction,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Delivery, type InsertDelivery
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lt, and, gte, lte, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Storage Locations
  getStorageLocation(id: number): Promise<StorageLocation | undefined>;
  getAllStorageLocations(): Promise<StorageLocation[]>;
  createStorageLocation(location: InsertStorageLocation): Promise<StorageLocation>;
  updateStorageLocation(id: number, location: Partial<InsertStorageLocation>): Promise<StorageLocation | undefined>;
  deleteStorageLocation(id: number): Promise<boolean>;

  // Ingredients
  getIngredient(id: number): Promise<Ingredient | undefined>;
  getAllIngredients(): Promise<Ingredient[]>;
  getLowStockIngredients(): Promise<Ingredient[]>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: number): Promise<boolean>;
  updateIngredientStock(id: number, quantity: number): Promise<Ingredient | undefined>;

  // Recipes
  getRecipe(id: number): Promise<Recipe | undefined>;
  getAllRecipes(): Promise<Recipe[]>;
  getActiveRecipes(): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;

  // Recipe Ingredients
  getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]>;
  createRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  updateRecipeIngredient(id: number, recipeIngredient: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined>;
  deleteRecipeIngredient(id: number): Promise<boolean>;
  deleteRecipeIngredientsByRecipe(recipeId: number): Promise<boolean>;

  // Productions
  getProduction(id: number): Promise<Production | undefined>;
  getAllProductions(): Promise<Production[]>;
  getProductionsByStatus(status: string): Promise<Production[]>;
  getTodayProductions(): Promise<Production[]>;
  createProduction(production: InsertProduction): Promise<Production>;
  updateProduction(id: number, production: Partial<InsertProduction>): Promise<Production | undefined>;
  deleteProduction(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;
  deleteOrderItemsByOrder(orderId: number): Promise<boolean>;

  // Deliveries
  getDelivery(id: number): Promise<Delivery | undefined>;
  getAllDeliveries(): Promise<Delivery[]>;
  getDeliveriesByDeliverer(delivererId: number): Promise<Delivery[]>;
  getAvailableDeliveries(): Promise<Delivery[]>;
  getDeliveriesByStatus(status: string): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined>;
  deleteDelivery(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async initializeSampleData() {
    try {
      // Check if data already exists
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return; // Data already initialized
      }

      // Create default storage locations
      await db.insert(storageLocations).values([
        {
          name: "Frigo A",
          temperature: "2.00",
          capacity: "1000.00",
          unit: "kg"
        },
        {
          name: "Congélateur",
          temperature: "-18.00",
          capacity: "500.00",
          unit: "kg"
        }
      ]);

      // Create default admin user
      await db.insert(users).values([
        {
          username: "admin",
          password: "admin123",
          email: "admin@patisslab.com",
          firstName: "Jean",
          lastName: "Dupont",
          role: "admin",
          active: true
        },
        {
          username: "client1",
          password: "client123",
          email: "marie@example.com",
          firstName: "Marie",
          lastName: "Martin",
          role: "client",
          active: true
        },
        {
          username: "livreur1",
          password: "livreur123",
          email: "paul@example.com",
          firstName: "Paul",
          lastName: "Durand",
          role: "livreur",
          active: true
        }
      ]);

      // Create sample ingredients
      await db.insert(ingredients).values([
        {
          name: "Farine T55",
          unit: "kg",
          currentStock: "2.5",
          minStock: "5.0",
          maxStock: "50.0",
          costPerUnit: "1.20",
          storageLocationId: 1
        },
        {
          name: "Œufs frais",
          unit: "piece",
          currentStock: "12",
          minStock: "24",
          maxStock: "120",
          costPerUnit: "0.25",
          storageLocationId: 1
        },
        {
          name: "Beurre doux",
          unit: "kg",
          currentStock: "0.8",
          minStock: "2.0",
          maxStock: "10.0",
          costPerUnit: "6.50",
          storageLocationId: 1
        }
      ]);
    } catch (error) {
      console.log("Sample data initialization skipped (data may already exist):", error);
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Storage Locations
  async getStorageLocation(id: number): Promise<StorageLocation | undefined> {
    const [location] = await db.select().from(storageLocations).where(eq(storageLocations.id, id));
    return location || undefined;
  }

  async getAllStorageLocations(): Promise<StorageLocation[]> {
    return await db.select().from(storageLocations);
  }

  async createStorageLocation(insertLocation: InsertStorageLocation): Promise<StorageLocation> {
    const [location] = await db.insert(storageLocations).values(insertLocation).returning();
    return location;
  }

  async updateStorageLocation(id: number, updateData: Partial<InsertStorageLocation>): Promise<StorageLocation | undefined> {
    const [location] = await db.update(storageLocations)
      .set(updateData)
      .where(eq(storageLocations.id, id))
      .returning();
    return location || undefined;
  }

  async deleteStorageLocation(id: number): Promise<boolean> {
    const result = await db.delete(storageLocations).where(eq(storageLocations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Ingredients
  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient || undefined;
  }

  async getAllIngredients(): Promise<Ingredient[]> {
    return await db.select().from(ingredients);
  }

  async getLowStockIngredients(): Promise<Ingredient[]> {
    const allIngredients = await db.select().from(ingredients);
    return allIngredients.filter(ingredient => 
      parseFloat(ingredient.currentStock || "0") <= parseFloat(ingredient.minStock || "0")
    );
  }

  async createIngredient(insertIngredient: InsertIngredient): Promise<Ingredient> {
    const [ingredient] = await db.insert(ingredients).values(insertIngredient).returning();
    return ingredient;
  }

  async updateIngredient(id: number, updateData: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const [ingredient] = await db.update(ingredients)
      .set(updateData)
      .where(eq(ingredients.id, id))
      .returning();
    return ingredient || undefined;
  }

  async deleteIngredient(id: number): Promise<boolean> {
    const result = await db.delete(ingredients).where(eq(ingredients.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateIngredientStock(id: number, quantity: number): Promise<Ingredient | undefined> {
    const ingredient = await this.getIngredient(id);
    if (!ingredient) return undefined;
    
    const currentStock = parseFloat(ingredient.currentStock || "0");
    const newStock = Math.max(0, currentStock + quantity);
    
    return await this.updateIngredient(id, { currentStock: newStock.toString() });
  }

  // Recipes
  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getActiveRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.active, true));
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(insertRecipe).returning();
    return recipe;
  }

  async updateRecipe(id: number, updateData: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [recipe] = await db.update(recipes)
      .set(updateData)
      .where(eq(recipes.id, id))
      .returning();
    return recipe || undefined;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Recipe Ingredients
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    return await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  }

  async createRecipeIngredient(insertRecipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const [recipeIngredient] = await db.insert(recipeIngredients).values(insertRecipeIngredient).returning();
    return recipeIngredient;
  }

  async updateRecipeIngredient(id: number, updateData: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined> {
    const [recipeIngredient] = await db.update(recipeIngredients)
      .set(updateData)
      .where(eq(recipeIngredients.id, id))
      .returning();
    return recipeIngredient || undefined;
  }

  async deleteRecipeIngredient(id: number): Promise<boolean> {
    const result = await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteRecipeIngredientsByRecipe(recipeId: number): Promise<boolean> {
    const result = await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
    return (result.rowCount || 0) >= 0;
  }

  // Productions
  async getProduction(id: number): Promise<Production | undefined> {
    const [production] = await db.select().from(productions).where(eq(productions.id, id));
    return production || undefined;
  }

  async getAllProductions(): Promise<Production[]> {
    return await db.select().from(productions);
  }

  async getProductionsByStatus(status: string): Promise<Production[]> {
    return await db.select().from(productions).where(eq(productions.status, status));
  }

  async getTodayProductions(): Promise<Production[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db.select().from(productions)
      .where(
        and(
          gte(productions.scheduledTime, today),
          lt(productions.scheduledTime, tomorrow)
        )
      );
  }

  async createProduction(insertProduction: InsertProduction): Promise<Production> {
    const [production] = await db.insert(productions).values(insertProduction).returning();
    return production;
  }

  async updateProduction(id: number, updateData: Partial<InsertProduction>): Promise<Production | undefined> {
    const [production] = await db.update(productions)
      .set(updateData)
      .where(eq(productions.id, id))
      .returning();
    return production || undefined;
  }

  async deleteProduction(id: number): Promise<boolean> {
    const result = await db.delete(productions).where(eq(productions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.status, status));
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(insertOrderItem).returning();
    return orderItem;
  }

  async updateOrderItem(id: number, updateData: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [orderItem] = await db.update(orderItems)
      .set(updateData)
      .where(eq(orderItems.id, id))
      .returning();
    return orderItem || undefined;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteOrderItemsByOrder(orderId: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    return (result.rowCount || 0) >= 0;
  }

  // Deliveries
  async getDelivery(id: number): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery || undefined;
  }

  async getAllDeliveries(): Promise<Delivery[]> {
    return await db.select().from(deliveries);
  }

  async getDeliveriesByDeliverer(delivererId: number): Promise<Delivery[]> {
    return await db.select().from(deliveries).where(eq(deliveries.delivererId, delivererId));
  }

  async getDeliveriesByStatus(status: string): Promise<Delivery[]> {
    return await db.select().from(deliveries).where(eq(deliveries.status, status));
  }

  async getAvailableDeliveries(): Promise<Delivery[]> {
    // Return deliveries that are not assigned to any deliverer yet
    return await db.select().from(deliveries).where(isNull(deliveries.delivererId));
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db.insert(deliveries).values(insertDelivery).returning();
    return delivery;
  }

  async updateDelivery(id: number, updateData: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const [delivery] = await db.update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, id))
      .returning();
    return delivery || undefined;
  }

  async deleteDelivery(id: number): Promise<boolean> {
    const result = await db.delete(deliveries).where(eq(deliveries.id, id));
    return (result.rowCount || 0) > 0;
  }
}

// Create and initialize the storage
export const storage = new DatabaseStorage();

// Initialize sample data when the module is loaded
storage.initializeSampleData().catch(console.error);