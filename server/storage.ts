import {
  users, storageLocations, ingredients, recipes, recipeIngredients,
  productions, orders, orderItems, deliveries,
  type User, type InsertUser, type StorageLocation, type InsertStorageLocation,
  type Ingredient, type InsertIngredient, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient, type Production, type InsertProduction,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Delivery, type InsertDelivery
} from "@shared/schema";

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
  getDeliveriesByStatus(status: string): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined>;
  deleteDelivery(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private storageLocations: Map<number, StorageLocation> = new Map();
  private ingredients: Map<number, Ingredient> = new Map();
  private recipes: Map<number, Recipe> = new Map();
  private recipeIngredients: Map<number, RecipeIngredient> = new Map();
  private productions: Map<number, Production> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private deliveries: Map<number, Delivery> = new Map();
  private currentId = 1;

  constructor() {
    this.initializeData();
  }

  private getNextId(): number {
    return this.currentId++;
  }

  private initializeData() {
    // Create default storage locations
    const frigo = this.createStorageLocation({
      name: "Frigo A",
      temperature: "2.00",
      capacity: "1000.00",
      unit: "kg"
    });

    const congelateur = this.createStorageLocation({
      name: "Congélateur",
      temperature: "-18.00",
      capacity: "500.00",
      unit: "kg"
    });

    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@patisslab.com",
      firstName: "Jean",
      lastName: "Dupont",
      role: "admin",
      active: true
    });

    // Create sample ingredients
    this.createIngredient({
      name: "Farine T55",
      unit: "kg",
      currentStock: "2.5",
      minStock: "5.0",
      maxStock: "50.0",
      costPerUnit: "1.20",
      storageLocationId: 1
    });

    this.createIngredient({
      name: "Œufs frais",
      unit: "piece",
      currentStock: "12",
      minStock: "24",
      maxStock: "120",
      costPerUnit: "0.25",
      storageLocationId: 1
    });

    this.createIngredient({
      name: "Beurre doux",
      unit: "kg",
      currentStock: "0.8",
      minStock: "2.0",
      maxStock: "10.0",
      costPerUnit: "6.50",
      storageLocationId: 1
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.getNextId();
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Storage Locations
  async getStorageLocation(id: number): Promise<StorageLocation | undefined> {
    return this.storageLocations.get(id);
  }

  async getAllStorageLocations(): Promise<StorageLocation[]> {
    return Array.from(this.storageLocations.values());
  }

  async createStorageLocation(location: InsertStorageLocation): Promise<StorageLocation> {
    const id = this.getNextId();
    const newLocation: StorageLocation = { ...location, id };
    this.storageLocations.set(id, newLocation);
    return newLocation;
  }

  async updateStorageLocation(id: number, location: Partial<InsertStorageLocation>): Promise<StorageLocation | undefined> {
    const existing = this.storageLocations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...location };
    this.storageLocations.set(id, updated);
    return updated;
  }

  async deleteStorageLocation(id: number): Promise<boolean> {
    return this.storageLocations.delete(id);
  }

  // Ingredients
  async getIngredient(id: number): Promise<Ingredient | undefined> {
    return this.ingredients.get(id);
  }

  async getAllIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values());
  }

  async getLowStockIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).filter(
      ingredient => parseFloat(ingredient.currentStock || "0") <= parseFloat(ingredient.minStock || "0")
    );
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const id = this.getNextId();
    const newIngredient: Ingredient = { ...ingredient, id };
    this.ingredients.set(id, newIngredient);
    return newIngredient;
  }

  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const existing = this.ingredients.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...ingredient };
    this.ingredients.set(id, updated);
    return updated;
  }

  async deleteIngredient(id: number): Promise<boolean> {
    return this.ingredients.delete(id);
  }

  async updateIngredientStock(id: number, quantity: number): Promise<Ingredient | undefined> {
    const ingredient = this.ingredients.get(id);
    if (!ingredient) return undefined;
    
    const currentStock = parseFloat(ingredient.currentStock || "0");
    const newStock = Math.max(0, currentStock + quantity);
    
    const updated = { ...ingredient, currentStock: newStock.toString() };
    this.ingredients.set(id, updated);
    return updated;
  }

  // Recipes
  async getRecipe(id: number): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getActiveRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).filter(recipe => recipe.active);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = this.getNextId();
    const newRecipe: Recipe = { ...recipe, id };
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const existing = this.recipes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...recipe };
    this.recipes.set(id, updated);
    return updated;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    return this.recipes.delete(id);
  }

  // Recipe Ingredients
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    return Array.from(this.recipeIngredients.values()).filter(ri => ri.recipeId === recipeId);
  }

  async createRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const id = this.getNextId();
    const newRecipeIngredient: RecipeIngredient = { ...recipeIngredient, id };
    this.recipeIngredients.set(id, newRecipeIngredient);
    return newRecipeIngredient;
  }

  async updateRecipeIngredient(id: number, recipeIngredient: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined> {
    const existing = this.recipeIngredients.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...recipeIngredient };
    this.recipeIngredients.set(id, updated);
    return updated;
  }

  async deleteRecipeIngredient(id: number): Promise<boolean> {
    return this.recipeIngredients.delete(id);
  }

  async deleteRecipeIngredientsByRecipe(recipeId: number): Promise<boolean> {
    const toDelete = Array.from(this.recipeIngredients.entries())
      .filter(([_, ri]) => ri.recipeId === recipeId)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.recipeIngredients.delete(id));
    return true;
  }

  // Productions
  async getProduction(id: number): Promise<Production | undefined> {
    return this.productions.get(id);
  }

  async getAllProductions(): Promise<Production[]> {
    return Array.from(this.productions.values());
  }

  async getProductionsByStatus(status: string): Promise<Production[]> {
    return Array.from(this.productions.values()).filter(p => p.status === status);
  }

  async getTodayProductions(): Promise<Production[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.productions.values()).filter(p => {
      const scheduledTime = new Date(p.scheduledTime);
      return scheduledTime >= today && scheduledTime < tomorrow;
    });
  }

  async createProduction(production: InsertProduction): Promise<Production> {
    const id = this.getNextId();
    const newProduction: Production = { ...production, id };
    this.productions.set(id, newProduction);
    return newProduction;
  }

  async updateProduction(id: number, production: Partial<InsertProduction>): Promise<Production | undefined> {
    const existing = this.productions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...production };
    this.productions.set(id, updated);
    return updated;
  }

  async deleteProduction(id: number): Promise<boolean> {
    return this.productions.delete(id);
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.status === status);
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.customerId === customerId);
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.getNextId();
    const newOrder: Order = { ...order, id };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...order };
    this.orders.set(id, updated);
    return updated;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(oi => oi.orderId === orderId);
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.getNextId();
    const newOrderItem: OrderItem = { ...orderItem, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }

  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const existing = this.orderItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...orderItem };
    this.orderItems.set(id, updated);
    return updated;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  async deleteOrderItemsByOrder(orderId: number): Promise<boolean> {
    const toDelete = Array.from(this.orderItems.entries())
      .filter(([_, oi]) => oi.orderId === orderId)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.orderItems.delete(id));
    return true;
  }

  // Deliveries
  async getDelivery(id: number): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async getAllDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values());
  }

  async getDeliveriesByDeliverer(delivererId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(d => d.delivererId === delivererId);
  }

  async getDeliveriesByStatus(status: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(d => d.status === status);
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const id = this.getNextId();
    const newDelivery: Delivery = { ...delivery, id };
    this.deliveries.set(id, newDelivery);
    return newDelivery;
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const existing = this.deliveries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...delivery };
    this.deliveries.set(id, updated);
    return updated;
  }

  async deleteDelivery(id: number): Promise<boolean> {
    return this.deliveries.delete(id);
  }
}

export const storage = new MemStorage();
