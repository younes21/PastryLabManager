import {
  users, storageLocations, recipes, recipeIngredients,
  productions, orders, orderItems, deliveries, productStock, labels,
  measurementCategories, measurementUnits, articleCategories, articles, priceLists, priceRules,
  taxes, currencies, deliveryMethods, accountingJournals, accountingAccounts, storageZones, workStations, suppliers,
  type User, type InsertUser, type StorageLocation, type InsertStorageLocation,
  type Ingredient, type InsertIngredient, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient, type Production, type InsertProduction,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Delivery, type InsertDelivery, type ProductStock, type InsertProductStock,
  type Label, type InsertLabel, type MeasurementCategory, type InsertMeasurementCategory,
  type MeasurementUnit, type InsertMeasurementUnit, type ArticleCategory, type InsertArticleCategory,
  type Article, type InsertArticle, type PriceList, type InsertPriceList, type PriceRule, type InsertPriceRule,
  type Tax, type InsertTax, type Currency, type InsertCurrency, type DeliveryMethod, type InsertDeliveryMethod,
  type AccountingJournal, type InsertAccountingJournal, type AccountingAccount, type InsertAccountingAccount,
  type StorageZone, type InsertStorageZone, type WorkStation, type InsertWorkStation,
  type Supplier, type InsertSupplier
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

  // Ingredients (articles de type "ingredient")
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

  // Product Stock
  getProductStock(id: number): Promise<ProductStock | undefined>;
  getAllProductStock(): Promise<ProductStock[]>;
  getProductStockByOrder(orderId: number): Promise<ProductStock[]>;
  getProductStockByStatus(status: string): Promise<ProductStock[]>;
  getProductStockByLocation(locationId: number): Promise<ProductStock[]>;
  createProductStock(productStock: InsertProductStock): Promise<ProductStock>;
  updateProductStock(id: number, productStock: Partial<InsertProductStock>): Promise<ProductStock | undefined>;
  deleteProductStock(id: number): Promise<boolean>;

  // Labels
  getLabel(id: number): Promise<Label | undefined>;
  getAllLabels(): Promise<Label[]>;
  getLabelsByProductStock(productStockId: number): Promise<Label[]>;
  getUnprintedLabels(): Promise<Label[]>;
  createLabel(label: InsertLabel): Promise<Label>;
  updateLabel(id: number, label: Partial<InsertLabel>): Promise<Label | undefined>;
  deleteLabel(id: number): Promise<boolean>;
  markLabelAsPrinted(id: number): Promise<Label | undefined>;

  // Measurement Categories
  getMeasurementCategory(id: number): Promise<MeasurementCategory | undefined>;
  getAllMeasurementCategories(): Promise<MeasurementCategory[]>;
  getActiveMeasurementCategories(): Promise<MeasurementCategory[]>;
  createMeasurementCategory(category: InsertMeasurementCategory): Promise<MeasurementCategory>;
  updateMeasurementCategory(id: number, category: Partial<InsertMeasurementCategory>): Promise<MeasurementCategory | undefined>;
  deleteMeasurementCategory(id: number): Promise<boolean>;

  // Measurement Units
  getMeasurementUnit(id: number): Promise<MeasurementUnit | undefined>;
  getAllMeasurementUnits(): Promise<MeasurementUnit[]>;
  getMeasurementUnitsByCategory(categoryId: number): Promise<MeasurementUnit[]>;
  getActiveMeasurementUnits(): Promise<MeasurementUnit[]>;
  getReferenceUnit(categoryId: number): Promise<MeasurementUnit | undefined>;
  createMeasurementUnit(unit: InsertMeasurementUnit): Promise<MeasurementUnit>;
  updateMeasurementUnit(id: number, unit: Partial<InsertMeasurementUnit>): Promise<MeasurementUnit | undefined>;
  deleteMeasurementUnit(id: number): Promise<boolean>;

  // Article Categories
  getArticleCategory(id: number): Promise<ArticleCategory | undefined>;
  getAllArticleCategories(): Promise<ArticleCategory[]>;
  getArticleCategoriesByParent(parentId: number | null): Promise<ArticleCategory[]>;
  createArticleCategory(category: InsertArticleCategory): Promise<ArticleCategory>;
  updateArticleCategory(id: number, category: Partial<InsertArticleCategory>): Promise<ArticleCategory | undefined>;
  deleteArticleCategory(id: number): Promise<boolean>;

  // Articles (unified products, ingredients, services)
  getArticle(id: number): Promise<Article | undefined>;
  getAllArticles(): Promise<Article[]>;
  getArticlesByType(type: string): Promise<Article[]>;
  getArticlesByCategory(categoryId: number): Promise<Article[]>;
  getActiveArticles(): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;

  // Price Lists
  getPriceList(id: number): Promise<PriceList | undefined>;
  getAllPriceLists(): Promise<PriceList[]>;
  getActivePriceLists(): Promise<PriceList[]>;
  createPriceList(priceList: InsertPriceList): Promise<PriceList>;
  updatePriceList(id: number, priceList: Partial<InsertPriceList>): Promise<PriceList | undefined>;
  deletePriceList(id: number): Promise<boolean>;

  // Price Rules
  getPriceRule(id: number): Promise<PriceRule | undefined>;
  getAllPriceRules(): Promise<PriceRule[]>;
  getPriceRulesByPriceList(priceListId: number): Promise<PriceRule[]>;
  getActivePriceRules(): Promise<PriceRule[]>;
  createPriceRule(priceRule: InsertPriceRule): Promise<PriceRule>;
  updatePriceRule(id: number, priceRule: Partial<InsertPriceRule>): Promise<PriceRule | undefined>;
  deletePriceRule(id: number): Promise<boolean>;

  // Taxes
  getAllTaxes(): Promise<Tax[]>;
  getTax(id: number): Promise<Tax | undefined>;
  createTax(tax: InsertTax): Promise<Tax>;
  updateTax(id: number, tax: Partial<InsertTax>): Promise<Tax | undefined>;
  deleteTax(id: number): Promise<boolean>;

  // Currencies
  getAllCurrencies(): Promise<Currency[]>;
  getCurrency(id: number): Promise<Currency | undefined>;
  getBaseCurrency(): Promise<Currency | undefined>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;
  updateCurrency(id: number, currency: Partial<InsertCurrency>): Promise<Currency | undefined>;
  deleteCurrency(id: number): Promise<boolean>;

  // Delivery Methods
  getAllDeliveryMethods(): Promise<DeliveryMethod[]>;
  getDeliveryMethod(id: number): Promise<DeliveryMethod | undefined>;
  createDeliveryMethod(deliveryMethod: InsertDeliveryMethod): Promise<DeliveryMethod>;
  updateDeliveryMethod(id: number, deliveryMethod: Partial<InsertDeliveryMethod>): Promise<DeliveryMethod | undefined>;
  deleteDeliveryMethod(id: number): Promise<boolean>;

  // Accounting Journals
  getAllAccountingJournals(): Promise<AccountingJournal[]>;
  getAccountingJournal(id: number): Promise<AccountingJournal | undefined>;
  createAccountingJournal(journal: InsertAccountingJournal): Promise<AccountingJournal>;
  updateAccountingJournal(id: number, journal: Partial<InsertAccountingJournal>): Promise<AccountingJournal | undefined>;
  deleteAccountingJournal(id: number): Promise<boolean>;

  // Accounting Accounts
  getAllAccountingAccounts(): Promise<AccountingAccount[]>;
  getAccountingAccount(id: number): Promise<AccountingAccount | undefined>;
  createAccountingAccount(account: InsertAccountingAccount): Promise<AccountingAccount>;
  updateAccountingAccount(id: number, account: Partial<InsertAccountingAccount>): Promise<AccountingAccount | undefined>;
  deleteAccountingAccount(id: number): Promise<boolean>;

  // Storage Zones
  getAllStorageZones(): Promise<StorageZone[]>;
  getStorageZone(id: number): Promise<StorageZone | undefined>;
  getStorageZonesByLocation(locationId: number): Promise<StorageZone[]>;
  createStorageZone(zone: InsertStorageZone): Promise<StorageZone>;
  updateStorageZone(id: number, zone: Partial<InsertStorageZone>): Promise<StorageZone | undefined>;
  deleteStorageZone(id: number): Promise<boolean>;

  // Work Stations
  getAllWorkStations(): Promise<WorkStation[]>;
  getWorkStation(id: number): Promise<WorkStation | undefined>;
  getWorkStationsByType(type: string): Promise<WorkStation[]>;
  createWorkStation(station: InsertWorkStation): Promise<WorkStation>;
  updateWorkStation(id: number, station: Partial<InsertWorkStation>): Promise<WorkStation | undefined>;
  deleteWorkStation(id: number): Promise<boolean>;

  // Suppliers
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSuppliersByType(type: string): Promise<Supplier[]>;
  getActiveSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
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

      // Create default measurement categories
      const categories = await db.insert(measurementCategories).values([
        {
          name: "Poids",
          description: "Unités de mesure de poids et masse",
          active: true
        },
        {
          name: "Volume",
          description: "Unités de mesure de volume et capacité",
          active: true
        },
        {
          name: "Quantité",
          description: "Unités de mesure de quantité",
          active: true
        },
        {
          name: "Température",
          description: "Unités de mesure de température",
          active: true
        }
      ]).returning();

      // Create measurement units for each category
      await db.insert(measurementUnits).values([
        // Poids category (assuming category ID 1)
        {
          categoryId: categories[0].id,
          label: "Kilogramme",
          abbreviation: "kg",
          type: "reference",
          factor: "1.000000",
          active: true
        },
        {
          categoryId: categories[0].id,
          label: "Gramme",
          abbreviation: "g",
          type: "smaller",
          factor: "0.001000",
          active: true
        },
        {
          categoryId: categories[0].id,
          label: "Tonne",
          abbreviation: "t",
          type: "larger",
          factor: "1000.000000",
          active: true
        },
        // Volume category (assuming category ID 2)
        {
          categoryId: categories[1].id,
          label: "Litre",
          abbreviation: "l",
          type: "reference",
          factor: "1.000000",
          active: true
        },
        {
          categoryId: categories[1].id,
          label: "Millilitre",
          abbreviation: "ml",
          type: "smaller",
          factor: "0.001000",
          active: true
        },
        {
          categoryId: categories[1].id,
          label: "Centilitre",
          abbreviation: "cl",
          type: "smaller",
          factor: "0.010000",
          active: true
        },
        // Quantité category (assuming category ID 3)
        {
          categoryId: categories[2].id,
          label: "Pièce",
          abbreviation: "pce",
          type: "reference",
          factor: "1.000000",
          active: true
        },
        {
          categoryId: categories[2].id,
          label: "Douzaine",
          abbreviation: "dz",
          type: "larger",
          factor: "12.000000",
          active: true
        },
        // Température category (assuming category ID 4)
        {
          categoryId: categories[3].id,
          label: "Celsius",
          abbreviation: "°C",
          type: "reference",
          factor: "1.000000",
          active: true
        }
      ]);

      // Create sample price lists
      const priceListsData = await db.insert(priceLists).values([
        {
          designation: "Prix Standard",
          currency: "DA",
          active: true
        },
        {
          designation: "Prix Gros",
          currency: "DA",
          active: true
        }
      ]).returning();

      // Create sample suppliers
      await db.insert(suppliers).values([
        {
          type: "societe",
          companyType: "SARL",
          companyName: "Fournisseur Général",
          contactName: "Ahmed Benali",
          phone: "021 45 67 89",
          mobile: "0661 23 45 67",
          email: "contact@fournisseur-general.dz",
          address: "Zone industrielle, Lot 15",
          city: "Alger",
          postalCode: "16000",
          wilaya: "Alger",
          rc: "RC 16/00-0123456",
          mf: "MF 1234567890123",
          nis: "NIS 001234567890123",
          active: true
        },
        {
          type: "particulier",
          firstName: "Omar",
          lastName: "Khelifi",
          phone: "021 98 76 54",
          mobile: "0772 11 22 33",
          email: "omar.khelifi@email.dz",
          address: "Cité des 200 logements, Bt A, App 25",
          city: "Oran",
          postalCode: "31000",
          wilaya: "Oran",
          active: true
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

  // Ingredients (articles de type "ingredient")
  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(articles)
      .where(and(eq(articles.id, id), eq(articles.type, "ingredient")));
    return ingredient || undefined;
  }

  async getAllIngredients(): Promise<Ingredient[]> {
    return await db.select().from(articles).where(eq(articles.type, "ingredient"));
  }

  async getLowStockIngredients(): Promise<Ingredient[]> {
    const allIngredients = await db.select().from(articles).where(eq(articles.type, "ingredient"));
    return allIngredients.filter(ingredient => 
      ingredient.managedInStock && 
      parseFloat(ingredient.currentStock || "0") <= parseFloat(ingredient.minStock || "0")
    );
  }

  async createIngredient(insertIngredient: InsertIngredient): Promise<Ingredient> {
    // Utiliser la méthode createArticle avec type "ingredient"
    return await this.createArticle({ ...insertIngredient, type: "ingredient" });
  }

  async updateIngredient(id: number, updateData: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const [ingredient] = await db.update(articles)
      .set(updateData)
      .where(and(eq(articles.id, id), eq(articles.type, "ingredient")))
      .returning();
    return ingredient || undefined;
  }

  async deleteIngredient(id: number): Promise<boolean> {
    const result = await db.delete(articles)
      .where(and(eq(articles.id, id), eq(articles.type, "ingredient")));
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

  // Product Stock methods
  async getProductStock(id: number): Promise<ProductStock | undefined> {
    const [productStock] = await db.select().from(productStock).where(eq(productStock.id, id));
    return productStock || undefined;
  }

  async getAllProductStock(): Promise<ProductStock[]> {
    return await db.select().from(productStock).orderBy(desc(productStock.productionDate));
  }

  async getProductStockByOrder(orderId: number): Promise<ProductStock[]> {
    return await db.select().from(productStock).where(eq(productStock.orderId, orderId));
  }

  async getProductStockByStatus(status: string): Promise<ProductStock[]> {
    return await db.select().from(productStock).where(eq(productStock.status, status));
  }

  async getProductStockByLocation(locationId: number): Promise<ProductStock[]> {
    return await db.select().from(productStock).where(eq(productStock.storageLocationId, locationId));
  }

  async createProductStock(insertProductStock: InsertProductStock): Promise<ProductStock> {
    const [product] = await db.insert(productStock).values(insertProductStock).returning();
    return product;
  }

  async updateProductStock(id: number, updateData: Partial<InsertProductStock>): Promise<ProductStock | undefined> {
    const [product] = await db.update(productStock)
      .set(updateData)
      .where(eq(productStock.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProductStock(id: number): Promise<boolean> {
    const result = await db.delete(productStock).where(eq(productStock.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Labels methods
  async getLabel(id: number): Promise<Label | undefined> {
    const [label] = await db.select().from(labels).where(eq(labels.id, id));
    return label || undefined;
  }

  async getAllLabels(): Promise<Label[]> {
    return await db.select().from(labels).orderBy(desc(labels.productionDate));
  }

  async getLabelsByProductStock(productStockId: number): Promise<Label[]> {
    return await db.select().from(labels).where(eq(labels.productStockId, productStockId));
  }

  async getUnprintedLabels(): Promise<Label[]> {
    return await db.select().from(labels).where(eq(labels.printed, false));
  }

  async createLabel(insertLabel: InsertLabel): Promise<Label> {
    const [label] = await db.insert(labels).values(insertLabel).returning();
    return label;
  }

  async updateLabel(id: number, updateData: Partial<InsertLabel>): Promise<Label | undefined> {
    const [label] = await db.update(labels)
      .set(updateData)
      .where(eq(labels.id, id))
      .returning();
    return label || undefined;
  }

  async deleteLabel(id: number): Promise<boolean> {
    const result = await db.delete(labels).where(eq(labels.id, id));
    return (result.rowCount || 0) > 0;
  }

  async markLabelAsPrinted(id: number): Promise<Label | undefined> {
    const [label] = await db.update(labels)
      .set({ printed: true, printedAt: new Date().toISOString() })
      .where(eq(labels.id, id))
      .returning();
    return label || undefined;
  }

  // Measurement Categories methods
  async getMeasurementCategory(id: number): Promise<MeasurementCategory | undefined> {
    const [category] = await db.select().from(measurementCategories).where(eq(measurementCategories.id, id));
    return category || undefined;
  }

  async getAllMeasurementCategories(): Promise<MeasurementCategory[]> {
    return await db.select().from(measurementCategories).orderBy(measurementCategories.name);
  }

  async getActiveMeasurementCategories(): Promise<MeasurementCategory[]> {
    return await db.select().from(measurementCategories)
      .where(eq(measurementCategories.active, true))
      .orderBy(measurementCategories.name);
  }

  async createMeasurementCategory(insertCategory: InsertMeasurementCategory): Promise<MeasurementCategory> {
    const [category] = await db.insert(measurementCategories).values(insertCategory).returning();
    return category;
  }

  async updateMeasurementCategory(id: number, updateData: Partial<InsertMeasurementCategory>): Promise<MeasurementCategory | undefined> {
    const [category] = await db.update(measurementCategories)
      .set(updateData)
      .where(eq(measurementCategories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteMeasurementCategory(id: number): Promise<boolean> {
    const result = await db.delete(measurementCategories).where(eq(measurementCategories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Measurement Units methods
  async getMeasurementUnit(id: number): Promise<MeasurementUnit | undefined> {
    const [unit] = await db.select().from(measurementUnits).where(eq(measurementUnits.id, id));
    return unit || undefined;
  }

  async getAllMeasurementUnits(): Promise<MeasurementUnit[]> {
    return await db.select().from(measurementUnits).orderBy(measurementUnits.categoryId, measurementUnits.label);
  }

  async getMeasurementUnitsByCategory(categoryId: number): Promise<MeasurementUnit[]> {
    return await db.select().from(measurementUnits)
      .where(eq(measurementUnits.categoryId, categoryId))
      .orderBy(measurementUnits.label);
  }

  async getActiveMeasurementUnits(): Promise<MeasurementUnit[]> {
    return await db.select().from(measurementUnits)
      .where(eq(measurementUnits.active, true))
      .orderBy(measurementUnits.categoryId, measurementUnits.label);
  }

  async getReferenceUnit(categoryId: number): Promise<MeasurementUnit | undefined> {
    const [unit] = await db.select().from(measurementUnits)
      .where(and(eq(measurementUnits.categoryId, categoryId), eq(measurementUnits.type, 'reference')));
    return unit || undefined;
  }

  async createMeasurementUnit(insertUnit: InsertMeasurementUnit): Promise<MeasurementUnit> {
    const [unit] = await db.insert(measurementUnits).values(insertUnit).returning();
    return unit;
  }

  async updateMeasurementUnit(id: number, updateData: Partial<InsertMeasurementUnit>): Promise<MeasurementUnit | undefined> {
    const [unit] = await db.update(measurementUnits)
      .set(updateData)
      .where(eq(measurementUnits.id, id))
      .returning();
    return unit || undefined;
  }

  async deleteMeasurementUnit(id: number): Promise<boolean> {
    const result = await db.delete(measurementUnits).where(eq(measurementUnits.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Article Categories methods
  async getArticleCategory(id: number): Promise<ArticleCategory | undefined> {
    const [category] = await db.select().from(articleCategories).where(eq(articleCategories.id, id));
    return category || undefined;
  }

  async getAllArticleCategories(): Promise<ArticleCategory[]> {
    return await db.select().from(articleCategories).orderBy(articleCategories.designation);
  }

  async getArticleCategoriesByParent(parentId: number | null): Promise<ArticleCategory[]> {
    if (parentId === null) {
      return await db.select().from(articleCategories)
        .where(isNull(articleCategories.parentId))
        .orderBy(articleCategories.designation);
    }
    return await db.select().from(articleCategories)
      .where(eq(articleCategories.parentId, parentId))
      .orderBy(articleCategories.designation);
  }

  async createArticleCategory(insertCategory: InsertArticleCategory): Promise<ArticleCategory> {
    const [category] = await db.insert(articleCategories).values(insertCategory).returning();
    return category;
  }

  async updateArticleCategory(id: number, updateData: Partial<InsertArticleCategory>): Promise<ArticleCategory | undefined> {
    const [category] = await db.update(articleCategories)
      .set(updateData)
      .where(eq(articleCategories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteArticleCategory(id: number): Promise<boolean> {
    const result = await db.delete(articleCategories).where(eq(articleCategories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Articles (unified products, ingredients, services) methods
  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async getAllArticles(): Promise<Article[]> {
    return await db.select().from(articles).orderBy(articles.name);
  }

  async getArticlesByType(type: string): Promise<Article[]> {
    return await db.select().from(articles)
      .where(eq(articles.type, type))
      .orderBy(articles.name);
  }

  async getArticlesByCategory(categoryId: number): Promise<Article[]> {
    return await db.select().from(articles)
      .where(eq(articles.categoryId, categoryId))
      .orderBy(articles.name);
  }

  async getActiveArticles(): Promise<Article[]> {
    return await db.select().from(articles)
      .where(eq(articles.active, true))
      .orderBy(articles.name);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    // Générer un code unique automatiquement selon le type
    const allArticlesOfType = await db.select().from(articles).where(eq(articles.type, insertArticle.type));
    
    let prefix = "ART";
    switch (insertArticle.type) {
      case "ingredient":
        prefix = "ING";
        break;
      case "product":
        prefix = "PRD";
        break;
      case "service":
        prefix = "SRV";
        break;
    }
    
    const code = `${prefix}-${String(allArticlesOfType.length + 1).padStart(6, '0')}`;
    
    const [article] = await db.insert(articles).values({
      ...insertArticle,
      code
    }).returning();
    return article;
  }

  async updateArticle(id: number, updateData: Partial<InsertArticle>): Promise<Article | undefined> {
    const [article] = await db.update(articles)
      .set(updateData)
      .where(eq(articles.id, id))
      .returning();
    return article || undefined;
  }

  async deleteArticle(id: number): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Price Lists methods
  async getPriceList(id: number): Promise<PriceList | undefined> {
    const [priceList] = await db.select().from(priceLists).where(eq(priceLists.id, id));
    return priceList || undefined;
  }

  async getAllPriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists).orderBy(priceLists.designation);
  }

  async getActivePriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists)
      .where(eq(priceLists.active, true))
      .orderBy(priceLists.designation);
  }

  async createPriceList(insertPriceList: InsertPriceList): Promise<PriceList> {
    const [priceList] = await db.insert(priceLists).values(insertPriceList).returning();
    return priceList;
  }

  async updatePriceList(id: number, updateData: Partial<InsertPriceList>): Promise<PriceList | undefined> {
    const [priceList] = await db.update(priceLists)
      .set(updateData)
      .where(eq(priceLists.id, id))
      .returning();
    return priceList || undefined;
  }

  async deletePriceList(id: number): Promise<boolean> {
    const result = await db.delete(priceLists).where(eq(priceLists.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Price Rules methods
  async getPriceRule(id: number): Promise<PriceRule | undefined> {
    const [priceRule] = await db.select().from(priceRules).where(eq(priceRules.id, id));
    return priceRule || undefined;
  }

  async getAllPriceRules(): Promise<PriceRule[]> {
    return await db.select().from(priceRules).orderBy(priceRules.id);
  }

  async getPriceRulesByPriceList(priceListId: number): Promise<PriceRule[]> {
    return await db.select().from(priceRules)
      .where(eq(priceRules.priceListId, priceListId))
      .orderBy(priceRules.id);
  }

  async getActivePriceRules(): Promise<PriceRule[]> {
    return await db.select().from(priceRules)
      .where(eq(priceRules.active, true))
      .orderBy(priceRules.id);
  }

  async createPriceRule(insertPriceRule: InsertPriceRule): Promise<PriceRule> {
    const [priceRule] = await db.insert(priceRules).values(insertPriceRule).returning();
    return priceRule;
  }

  async updatePriceRule(id: number, updateData: Partial<InsertPriceRule>): Promise<PriceRule | undefined> {
    const [priceRule] = await db.update(priceRules)
      .set(updateData)
      .where(eq(priceRules.id, id))
      .returning();
    return priceRule || undefined;
  }

  async deletePriceRule(id: number): Promise<boolean> {
    const result = await db.delete(priceRules).where(eq(priceRules.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ===== TAXES METHODS =====
  async getAllTaxes(): Promise<Tax[]> {
    return await db.select().from(taxes).orderBy(taxes.designation);
  }

  async getTax(id: number): Promise<Tax | undefined> {
    const [tax] = await db.select().from(taxes).where(eq(taxes.id, id));
    return tax || undefined;
  }

  async createTax(insertTax: InsertTax): Promise<Tax> {
    // Generate unique code
    const allTaxes = await db.select().from(taxes);
    const code = `TAX-${String(allTaxes.length + 1).padStart(6, '0')}`;
    
    const [tax] = await db.insert(taxes).values({
      ...insertTax,
      code
    }).returning();
    return tax;
  }

  async updateTax(id: number, updateData: Partial<InsertTax>): Promise<Tax | undefined> {
    const [tax] = await db.update(taxes)
      .set(updateData)
      .where(eq(taxes.id, id))
      .returning();
    return tax || undefined;
  }

  async deleteTax(id: number): Promise<boolean> {
    const result = await db.delete(taxes).where(eq(taxes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ===== CURRENCIES METHODS =====
  async getAllCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies).orderBy(currencies.designation);
  }

  async getCurrency(id: number): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.id, id));
    return currency || undefined;
  }

  async getBaseCurrency(): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.isBase, true));
    return currency || undefined;
  }

  async createCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    const [currency] = await db.insert(currencies).values(insertCurrency).returning();
    return currency;
  }

  async updateCurrency(id: number, updateData: Partial<InsertCurrency>): Promise<Currency | undefined> {
    // If setting as base currency, unset all others first
    if (updateData.isBase === true) {
      await db.update(currencies).set({ isBase: false }).where(eq(currencies.isBase, true));
    }
    
    const [currency] = await db.update(currencies)
      .set(updateData)
      .where(eq(currencies.id, id))
      .returning();
    return currency || undefined;
  }

  async deleteCurrency(id: number): Promise<boolean> {
    const result = await db.delete(currencies).where(eq(currencies.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ===== DELIVERY METHODS =====
  async getAllDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods).orderBy(deliveryMethods.designation);
  }

  async getDeliveryMethod(id: number): Promise<DeliveryMethod | undefined> {
    const [method] = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, id));
    return method || undefined;
  }

  async createDeliveryMethod(insertMethod: InsertDeliveryMethod): Promise<DeliveryMethod> {
    // Generate unique code
    const allMethods = await db.select().from(deliveryMethods);
    const code = `LIV-${String(allMethods.length + 1).padStart(6, '0')}`;
    
    const [method] = await db.insert(deliveryMethods).values({
      ...insertMethod,
      code
    }).returning();
    return method;
  }

  async updateDeliveryMethod(id: number, updateData: Partial<InsertDeliveryMethod>): Promise<DeliveryMethod | undefined> {
    const [method] = await db.update(deliveryMethods)
      .set(updateData)
      .where(eq(deliveryMethods.id, id))
      .returning();
    return method || undefined;
  }

  async deleteDeliveryMethod(id: number): Promise<boolean> {
    const result = await db.delete(deliveryMethods).where(eq(deliveryMethods.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ===== ACCOUNTING JOURNALS =====
  async getAllAccountingJournals(): Promise<AccountingJournal[]> {
    return await db.select().from(accountingJournals).orderBy(accountingJournals.designation);
  }

  async getAccountingJournal(id: number): Promise<AccountingJournal | undefined> {
    const [journal] = await db.select().from(accountingJournals).where(eq(accountingJournals.id, id));
    return journal || undefined;
  }

  async createAccountingJournal(insertJournal: InsertAccountingJournal): Promise<AccountingJournal> {
    const allJournals = await db.select().from(accountingJournals);
    const code = `JRN-${String(allJournals.length + 1).padStart(6, '0')}`;
    
    const [journal] = await db.insert(accountingJournals).values({
      ...insertJournal,
      code
    }).returning();
    return journal;
  }

  async updateAccountingJournal(id: number, updateData: Partial<InsertAccountingJournal>): Promise<AccountingJournal | undefined> {
    const [journal] = await db.update(accountingJournals)
      .set(updateData)
      .where(eq(accountingJournals.id, id))
      .returning();
    return journal || undefined;
  }

  async deleteAccountingJournal(id: number): Promise<boolean> {
    const result = await db.delete(accountingJournals).where(eq(accountingJournals.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ===== ACCOUNTING ACCOUNTS =====
  async getAllAccountingAccounts(): Promise<AccountingAccount[]> {
    return await db.select().from(accountingAccounts).orderBy(accountingAccounts.code);
  }

  async getAccountingAccount(id: number): Promise<AccountingAccount | undefined> {
    const [account] = await db.select().from(accountingAccounts).where(eq(accountingAccounts.id, id));
    return account || undefined;
  }

  async createAccountingAccount(insertAccount: InsertAccountingAccount): Promise<AccountingAccount> {
    // The accounting accounts table expects user to provide the code (account number)
    const [account] = await db.insert(accountingAccounts).values(insertAccount).returning();
    return account;
  }

  async updateAccountingAccount(id: number, updateData: Partial<InsertAccountingAccount>): Promise<AccountingAccount | undefined> {
    const [account] = await db.update(accountingAccounts)
      .set(updateData)
      .where(eq(accountingAccounts.id, id))
      .returning();
    return account || undefined;
  }

  async deleteAccountingAccount(id: number): Promise<boolean> {
    const result = await db.delete(accountingAccounts).where(eq(accountingAccounts.id, id));
    return (result.rowCount || 0) > 0;  
  }

  // ===== STORAGE ZONES =====
  async getAllStorageZones(): Promise<StorageZone[]> {
    return await db.select().from(storageZones).orderBy(storageZones.designation);
  }

  async getStorageZone(id: number): Promise<StorageZone | undefined> {
    const [zone] = await db.select().from(storageZones).where(eq(storageZones.id, id));
    return zone || undefined;
  }

  async getStorageZonesByLocation(locationId: number): Promise<StorageZone[]> {
    return await db.select().from(storageZones)
      .where(eq(storageZones.storageLocationId, locationId))
      .orderBy(storageZones.designation);
  }

  async createStorageZone(insertZone: InsertStorageZone): Promise<StorageZone> {
    const allZones = await db.select().from(storageZones);
    const code = `ZON-${String(allZones.length + 1).padStart(6, '0')}`;
    
    const [zone] = await db.insert(storageZones).values({
      ...insertZone,
      code
    }).returning();
    return zone;
  }

  async updateStorageZone(id: number, updateData: Partial<InsertStorageZone>): Promise<StorageZone | undefined> {
    const [zone] = await db.update(storageZones)
      .set(updateData)
      .where(eq(storageZones.id, id))
      .returning();
    return zone || undefined;
  }

  async deleteStorageZone(id: number): Promise<boolean> {
    const result = await db.delete(storageZones).where(eq(storageZones.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ===== WORK STATIONS =====
  async getAllWorkStations(): Promise<WorkStation[]> {
    return await db.select().from(workStations).orderBy(workStations.designation);
  }

  async getWorkStation(id: number): Promise<WorkStation | undefined> {
    const [station] = await db.select().from(workStations).where(eq(workStations.id, id));
    return station || undefined;
  }

  async getWorkStationsByType(type: string): Promise<WorkStation[]> {
    return await db.select().from(workStations)
      .where(eq(workStations.type, type))
      .orderBy(workStations.designation);
  }

  async createWorkStation(insertStation: InsertWorkStation): Promise<WorkStation> {
    const allStations = await db.select().from(workStations);
    const code = `PST-${String(allStations.length + 1).padStart(6, '0')}`;
    
    const [station] = await db.insert(workStations).values({
      ...insertStation,
      code
    }).returning();
    return station;
  }

  async updateWorkStation(id: number, updateData: Partial<InsertWorkStation>): Promise<WorkStation | undefined> {
    const [station] = await db.update(workStations)
      .set(updateData)
      .where(eq(workStations.id, id))
      .returning();
    return station || undefined;
  }

  async deleteWorkStation(id: number): Promise<boolean> {
    const result = await db.delete(workStations).where(eq(workStations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ===== SUPPLIERS =====
  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.code);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSuppliersByType(type: string): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(eq(suppliers.type, type))
      .orderBy(suppliers.code);
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(eq(suppliers.active, true))
      .orderBy(suppliers.code);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const allSuppliers = await db.select().from(suppliers);
    const code = `FRN-${String(allSuppliers.length + 1).padStart(6, '0')}`;
    
    const [supplier] = await db.insert(suppliers).values({
      ...insertSupplier,
      code
    }).returning();
    return supplier;
  }

  async updateSupplier(id: number, updateData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db.update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return (result.rowCount || 0) > 0;
  }
}

// Create and initialize the storage
export const storage = new DatabaseStorage();

// Initialize sample data when the module is loaded
storage.initializeSampleData().catch(console.error);