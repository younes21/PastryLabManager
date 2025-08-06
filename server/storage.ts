import {
  users, storageLocations,
  measurementCategories, measurementUnits, articleCategories, articles, priceLists, priceRules,
  taxes, currencies, deliveryMethods, accountingJournals, accountingAccounts, storageZones, workStations, 
  suppliers, clients, recipes, recipeIngredients, recipeOperations,
  orders, orderItems, inventoryOperations, inventoryOperationItems, deliveries, deliveryPackages, deliveryItems,
  invoices, invoiceItems, accountingEntries, accountingEntryLines,
  type User, type InsertUser, type StorageLocation, type InsertStorageLocation,
  type Client, type InsertClient,
  type MeasurementCategory, type InsertMeasurementCategory,
  type MeasurementUnit, type InsertMeasurementUnit, type ArticleCategory, type InsertArticleCategory,
  type Article, type InsertArticle, type PriceList, type InsertPriceList, type PriceRule, type InsertPriceRule,
  type Tax, type InsertTax, type Currency, type InsertCurrency, type DeliveryMethod, type InsertDeliveryMethod,
  type AccountingJournal, type InsertAccountingJournal, type AccountingAccount, type InsertAccountingAccount,
  type StorageZone, type InsertStorageZone, type WorkStation, type InsertWorkStation,
  type Supplier, type InsertSupplier, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient, type RecipeOperation, type InsertRecipeOperation,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type InventoryOperation, type InsertInventoryOperation, type InventoryOperationItem, type InsertInventoryOperationItem,
  type Delivery, type InsertDelivery, type DeliveryPackage, type InsertDeliveryPackage, type DeliveryItem, type InsertDeliveryItem,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type AccountingEntry, type InsertAccountingEntry, type AccountingEntryLine, type InsertAccountingEntryLine
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

  // Ingredients supprimés - utiliser articles avec type="ingredient"

  // Modules supprimés - à réimplémenter avec nouvelles règles
  // Recipes, Productions, Orders, Deliveries, ProductStock, Labels

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
  createMeasurementUnit(unit: InsertMeasurementUnit): Promise<MeasurementUnit>;
  updateMeasurementUnit(id: number, unit: Partial<InsertMeasurementUnit>): Promise<MeasurementUnit | undefined>;
  deleteMeasurementUnit(id: number): Promise<boolean>;

  // Article Categories
  getArticleCategory(id: number): Promise<ArticleCategory | undefined>;
  getAllArticleCategories(): Promise<ArticleCategory[]>;
  getActiveArticleCategories(): Promise<ArticleCategory[]>;
  createArticleCategory(category: InsertArticleCategory): Promise<ArticleCategory>;
  updateArticleCategory(id: number, category: Partial<InsertArticleCategory>): Promise<ArticleCategory | undefined>;
  deleteArticleCategory(id: number): Promise<boolean>;

  // Articles (unified)
  getArticle(id: number): Promise<Article | undefined>;
  getAllArticles(): Promise<Article[]>;
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
  setBaseCurrency(id: number): Promise<Currency | undefined>;
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
  createWorkStation(workStation: InsertWorkStation): Promise<WorkStation>;
  updateWorkStation(id: number, workStation: Partial<InsertWorkStation>): Promise<WorkStation | undefined>;
  deleteWorkStation(id: number): Promise<boolean>;

  // Email Configs - module supprimé

  // Suppliers
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Clients
  getAllClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Recipes (attached to articles with type="product")
  getAllRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  getRecipeByArticleId(articleId: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
  deleteRecipeByArticleId(articleId: number): Promise<boolean>;

  // Ingredients (filtrage articles par type="ingredient")
  getAllIngredients(): Promise<Article[]>;
  getIngredient(id: number): Promise<Article | undefined>;
  createIngredient(ingredient: Omit<InsertArticle, 'type'>): Promise<Article>;
  updateIngredient(id: number, ingredient: Partial<Omit<InsertArticle, 'type'>>): Promise<Article | undefined>;
  deleteIngredient(id: number): Promise<boolean>;
  getLowStockIngredients(): Promise<Article[]>;
}

export class DatabaseStorage implements IStorage {
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

  // Ingredients (filtrage des articles par type="ingredient")
  async getAllIngredients(): Promise<Article[]> {
    return await db.select().from(articles).where(eq(articles.type, "ingredient")).orderBy(articles.name);
  }

  async getIngredient(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(and(eq(articles.id, id), eq(articles.type, "ingredient")));
    return article || undefined;
  }

  async createIngredient(insertArticle: Omit<InsertArticle, 'type'>): Promise<Article> {
    // Générer un code automatique pour les ingrédients
    const existingIngredients = await this.getAllIngredients();
    const nextNumber = existingIngredients.length + 1;
    const code = `ING-${nextNumber.toString().padStart(6, '0')}`;
    
    const articleData = {
      ...insertArticle,
      type: "ingredient" as const,
      code,
    };
    
    const [article] = await db.insert(articles).values([articleData]).returning();
    return article;
  }

  async updateIngredient(id: number, updateData: Partial<Omit<InsertArticle, 'type'>>): Promise<Article | undefined> {
    // Vérifier que c'est bien un ingrédient
    const ingredient = await this.getIngredient(id);
    if (!ingredient) return undefined;
    
    return this.updateArticle(id, updateData);
  }

  async deleteIngredient(id: number): Promise<boolean> {
    // Vérifier que c'est bien un ingrédient avant suppression
    const ingredient = await this.getIngredient(id);
    if (!ingredient) return false;
    return this.deleteArticle(id);
  }

  async getLowStockIngredients(): Promise<Article[]> {
    return await db.select().from(articles)
      .where(and(
        eq(articles.type, "ingredient"),
        eq(articles.active, true),
        lt(articles.currentStock, articles.minStock)
      ))
      .orderBy(articles.name);
  }

  // Measurement Categories
  async getMeasurementCategory(id: number): Promise<MeasurementCategory | undefined> {
    const [category] = await db.select().from(measurementCategories).where(eq(measurementCategories.id, id));
    return category || undefined;
  }

  async getAllMeasurementCategories(): Promise<MeasurementCategory[]> {
    return await db.select().from(measurementCategories);
  }

  async getActiveMeasurementCategories(): Promise<MeasurementCategory[]> {
    return await db.select().from(measurementCategories).where(eq(measurementCategories.active, true));
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

  // Measurement Units
  async getMeasurementUnit(id: number): Promise<MeasurementUnit | undefined> {
    const [unit] = await db.select().from(measurementUnits).where(eq(measurementUnits.id, id));
    return unit || undefined;
  }

  async getAllMeasurementUnits(): Promise<MeasurementUnit[]> {
    return await db.select().from(measurementUnits);
  }

  async getMeasurementUnitsByCategory(categoryId: number): Promise<MeasurementUnit[]> {
    return await db.select().from(measurementUnits).where(eq(measurementUnits.categoryId, categoryId));
  }

  async getActiveMeasurementUnits(): Promise<MeasurementUnit[]> {
    return await db.select().from(measurementUnits).where(eq(measurementUnits.active, true));
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

  // Article Categories
  async getArticleCategory(id: number): Promise<ArticleCategory | undefined> {
    const [category] = await db.select().from(articleCategories).where(eq(articleCategories.id, id));
    return category || undefined;
  }

  async getAllArticleCategories(): Promise<ArticleCategory[]> {
    return await db.select().from(articleCategories);
  }

  async getActiveArticleCategories(): Promise<ArticleCategory[]> {
    return await db.select().from(articleCategories).where(eq(articleCategories.active, true));
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

  // Articles (unified)
  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async getAllArticles(): Promise<Article[]> {
    return await db.select().from(articles);
  }

  async getActiveArticles(): Promise<Article[]> {
    return await db.select().from(articles).where(eq(articles.active, true));
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values([insertArticle]).returning();
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

  // Price Lists
  async getPriceList(id: number): Promise<PriceList | undefined> {
    const [priceList] = await db.select().from(priceLists).where(eq(priceLists.id, id));
    return priceList || undefined;
  }

  async getAllPriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists);
  }

  async getActivePriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists).where(eq(priceLists.active, true));
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

  // Price Rules
  async getPriceRule(id: number): Promise<PriceRule | undefined> {
    const [priceRule] = await db.select().from(priceRules).where(eq(priceRules.id, id));
    return priceRule || undefined;
  }

  async getAllPriceRules(): Promise<PriceRule[]> {
    return await db.select().from(priceRules);
  }

  async getPriceRulesByPriceList(priceListId: number): Promise<PriceRule[]> {
    return await db.select().from(priceRules).where(eq(priceRules.priceListId, priceListId));
  }

  async getActivePriceRules(): Promise<PriceRule[]> {
    return await db.select().from(priceRules).where(eq(priceRules.active, true));
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

  // Taxes
  async getAllTaxes(): Promise<Tax[]> {
    return await db.select().from(taxes);
  }

  async getTax(id: number): Promise<Tax | undefined> {
    const [tax] = await db.select().from(taxes).where(eq(taxes.id, id));
    return tax || undefined;
  }

  async createTax(insertTax: InsertTax): Promise<Tax> {
    // Generate automatic code
    const existingTaxes = await this.getAllTaxes();
    const nextNumber = existingTaxes.length + 1;
    const code = `TVA-${nextNumber.toString().padStart(6, '0')}`;
    
    const taxData = {
      ...insertTax,
      code,
    };
    
    const [tax] = await db.insert(taxes).values(taxData).returning();
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

  // Currencies
  async getAllCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies);
  }

  async getCurrency(id: number): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.id, id));
    return currency || undefined;
  }

  async getBaseCurrency(): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.isBase, true));
    return currency || undefined;
  }

  async setBaseCurrency(id: number): Promise<Currency | undefined> {
    // Retirer le statut de base de toutes les devises
    await db.update(currencies).set({ isBase: false });
    
    // Définir la nouvelle devise de base
    const [currency] = await db.update(currencies)
      .set({ isBase: true })
      .where(eq(currencies.id, id))
      .returning();
    return currency || undefined;
  }

  async createCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    const [currency] = await db.insert(currencies).values(insertCurrency).returning();
    return currency;
  }

  async updateCurrency(id: number, updateData: Partial<InsertCurrency>): Promise<Currency | undefined> {
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

  // Delivery Methods
  async getAllDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods);
  }

  async getDeliveryMethod(id: number): Promise<DeliveryMethod | undefined> {
    const [deliveryMethod] = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, id));
    return deliveryMethod || undefined;
  }

  async createDeliveryMethod(insertDeliveryMethod: InsertDeliveryMethod): Promise<DeliveryMethod> {
    // Generate automatic code
    const existingMethods = await this.getAllDeliveryMethods();
    const nextNumber = existingMethods.length + 1;
    const code = `LIV-${nextNumber.toString().padStart(6, '0')}`;
    
    const methodData = {
      ...insertDeliveryMethod,
      code,
    };
    
    const [deliveryMethod] = await db.insert(deliveryMethods).values(methodData).returning();
    return deliveryMethod;
  }

  async updateDeliveryMethod(id: number, updateData: Partial<InsertDeliveryMethod>): Promise<DeliveryMethod | undefined> {
    const [deliveryMethod] = await db.update(deliveryMethods)
      .set(updateData)
      .where(eq(deliveryMethods.id, id))
      .returning();
    return deliveryMethod || undefined;
  }

  async deleteDeliveryMethod(id: number): Promise<boolean> {
    const result = await db.delete(deliveryMethods).where(eq(deliveryMethods.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Accounting Journals
  async getAllAccountingJournals(): Promise<AccountingJournal[]> {
    return await db.select().from(accountingJournals);
  }

  async getAccountingJournal(id: number): Promise<AccountingJournal | undefined> {
    const [journal] = await db.select().from(accountingJournals).where(eq(accountingJournals.id, id));
    return journal || undefined;
  }

  async createAccountingJournal(insertJournal: InsertAccountingJournal): Promise<AccountingJournal> {
    // Generate automatic code
    const existingJournals = await this.getAllAccountingJournals();
    const nextNumber = existingJournals.length + 1;
    const code = `JRN-${nextNumber.toString().padStart(6, '0')}`;
    
    const journalData = {
      ...insertJournal,
      code,
    };
    
    const [journal] = await db.insert(accountingJournals).values(journalData).returning();
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

  // Accounting Accounts
  async getAllAccountingAccounts(): Promise<AccountingAccount[]> {
    return await db.select().from(accountingAccounts);
  }

  async getAccountingAccount(id: number): Promise<AccountingAccount | undefined> {
    const [account] = await db.select().from(accountingAccounts).where(eq(accountingAccounts.id, id));
    return account || undefined;
  }

  async createAccountingAccount(insertAccount: InsertAccountingAccount): Promise<AccountingAccount> {
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

  // Storage Zones
  async getAllStorageZones(): Promise<StorageZone[]> {
    return await db.select().from(storageZones);
  }

  async getStorageZone(id: number): Promise<StorageZone | undefined> {
    const [zone] = await db.select().from(storageZones).where(eq(storageZones.id, id));
    return zone || undefined;
  }

  async getStorageZonesByLocation(locationId: number): Promise<StorageZone[]> {
    return await db.select().from(storageZones).where(eq(storageZones.storageLocationId, locationId));
  }

  async createStorageZone(insertZone: InsertStorageZone): Promise<StorageZone> {
    // Generate automatic code
    const existingZones = await this.getAllStorageZones();
    const nextNumber = existingZones.length + 1;
    const code = `ZON-${nextNumber.toString().padStart(6, '0')}`;
    
    const zoneData = {
      ...insertZone,
      code,
    };
    
    const [zone] = await db.insert(storageZones).values(zoneData).returning();
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

  // Work Stations
  async getAllWorkStations(): Promise<WorkStation[]> {
    return await db.select().from(workStations);
  }

  async getWorkStation(id: number): Promise<WorkStation | undefined> {
    const [workStation] = await db.select().from(workStations).where(eq(workStations.id, id));
    return workStation || undefined;
  }

  async createWorkStation(insertWorkStation: InsertWorkStation): Promise<WorkStation> {
    // Generate automatic code
    const existingStations = await this.getAllWorkStations();
    const nextNumber = existingStations.length + 1;
    const code = `PST-${nextNumber.toString().padStart(6, '0')}`;
    
    const stationData = {
      ...insertWorkStation,
      code,
    };
    
    const [workStation] = await db.insert(workStations).values(stationData).returning();
    return workStation;
  }

  async updateWorkStation(id: number, updateData: Partial<InsertWorkStation>): Promise<WorkStation | undefined> {
    const [workStation] = await db.update(workStations)
      .set(updateData)
      .where(eq(workStations.id, id))
      .returning();
    return workStation || undefined;
  }

  async deleteWorkStation(id: number): Promise<boolean> {
    const result = await db.delete(workStations).where(eq(workStations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Email Configs - module supprimé

  // Recipes (attached to articles with type="product")
  async getAllRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes).orderBy(recipes.designation);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async getRecipeByArticleId(articleId: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.articleId, articleId));
    return recipe || undefined;
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(insertRecipe).returning();
    return recipe;
  }

  async updateRecipe(id: number, updateData: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [recipe] = await db.update(recipes)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(recipes.id, id))
      .returning();
    return recipe || undefined;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteRecipeByArticleId(articleId: number): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.articleId, articleId));
    return (result.rowCount || 0) > 0;
  }

  // Recipe Ingredients
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    return await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  }

  async createRecipeIngredient(insertRecipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    console.log("🔥 CREATE RECIPE INGREDIENT - Data:", JSON.stringify(insertRecipeIngredient, null, 2));
    const [ingredient] = await db.insert(recipeIngredients).values(insertRecipeIngredient).returning();
    console.log("✅ CREATE RECIPE INGREDIENT - Success:", JSON.stringify(ingredient, null, 2));
    return ingredient;
  }

  async updateRecipeIngredient(id: number, updateData: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined> {
    console.log("🔥 UPDATE RECIPE INGREDIENT - ID:", id, "Data:", JSON.stringify(updateData, null, 2));
    const [ingredient] = await db.update(recipeIngredients)
      .set(updateData)
      .where(eq(recipeIngredients.id, id))
      .returning();
    console.log("✅ UPDATE RECIPE INGREDIENT - Success:", JSON.stringify(ingredient, null, 2));
    return ingredient || undefined;
  }

  async deleteRecipeIngredient(id: number): Promise<boolean> {
    console.log("🔥 DELETE RECIPE INGREDIENT - ID:", id);
    const result = await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
    const success = (result.rowCount || 0) > 0;
    console.log("✅ DELETE RECIPE INGREDIENT - Success:", success);
    return success;
  }

  // Recipe Operations
  async getRecipeOperations(recipeId: number): Promise<RecipeOperation[]> {
    return await db.select().from(recipeOperations)
      .where(eq(recipeOperations.recipeId, recipeId))
      .orderBy(recipeOperations.order);
  }

  async createRecipeOperation(insertRecipeOperation: InsertRecipeOperation): Promise<RecipeOperation> {
    console.log("🔥 CREATE RECIPE OPERATION - Data:", JSON.stringify(insertRecipeOperation, null, 2));
    const [operation] = await db.insert(recipeOperations).values(insertRecipeOperation).returning();
    console.log("✅ CREATE RECIPE OPERATION - Success:", JSON.stringify(operation, null, 2));
    return operation;
  }

  async updateRecipeOperation(id: number, updateData: Partial<InsertRecipeOperation>): Promise<RecipeOperation | undefined> {
    console.log("🔥 UPDATE RECIPE OPERATION - ID:", id, "Data:", JSON.stringify(updateData, null, 2));
    const [operation] = await db.update(recipeOperations)
      .set(updateData)
      .where(eq(recipeOperations.id, id))
      .returning();
    console.log("✅ UPDATE RECIPE OPERATION - Success:", JSON.stringify(operation, null, 2));
    return operation || undefined;
  }

  async deleteRecipeOperation(id: number): Promise<boolean> {
    console.log("🔥 DELETE RECIPE OPERATION - ID:", id);
    const result = await db.delete(recipeOperations).where(eq(recipeOperations.id, id));
    const success = (result.rowCount || 0) > 0;
    console.log("✅ DELETE RECIPE OPERATION - Success:", success);
    return success;
  }

  // Suppliers
  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    // Generate automatic code
    const existingSuppliers = await this.getAllSuppliers();
    const nextNumber = existingSuppliers.length + 1;
    const code = `FRN-${nextNumber.toString().padStart(6, '0')}`;
    
    const supplierData = {
      ...insertSupplier,
      code,
    };
    
    const [supplier] = await db.insert(suppliers).values(supplierData).returning();
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

  // Clients
  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }
  
  async getClientIdByUserId(id: number): Promise<number | undefined> {
     const [client]= await db.select({idClient:clients.id}).from(clients).where(eq(clients.userId, id));
    return client?.idClient || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // Generate automatic code
    const existingClients = await this.getAllClients();
    const nextNumber = existingClients.length + 1;
    const code = `CLI-${nextNumber.toString().padStart(6, '0')}`;
    
    const clientData = {
      ...insertClient,
      code,
    };
    
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db.update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ============ COMMANDES & DEVIS ============
  
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByClient(clientId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.clientId, clientId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Generate automatic code
    const prefix = insertOrder.type === 'quote' ? 'DEV' : 'CMD';
    const existingOrders = await this.getAllOrders();
    const nextNumber = existingOrders.length + 1;
    const code = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
    
    const orderData = {
      ...insertOrder,
      code,
    };
    
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }
  
  async createOrderWithItems(insertOrder: InsertOrder,items: InsertOrderItem[]): Promise<Order> {
        insertOrder.subtotalHT = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toString();    
        insertOrder.totalTax = items.reduce((sum, item) => sum + parseFloat(item.taxAmount ?? "0"), 0).toString();
        insertOrder.totalTTC = insertOrder.subtotalHT + insertOrder.totalTax ;
    
    return await db.transaction(async (tx) => {
      const prefix = insertOrder.type === "quote" ? "DEV" : "CMD";
      const existingOrders = await tx.select().from(orders);
      const nextNumber = existingOrders.length + 1;
      const code = `${prefix}-${nextNumber.toString().padStart(6, "0")}`;

      const [order] = await tx
        .insert(orders)
        .values({ ...insertOrder, code })
        .returning();

      const orderItemsToInsert = items.map((item) => ({
        ...item,
        orderId: order.id,
      }));

      await tx.insert(orderItems).values(orderItemsToInsert);
                  
      return order;
    });
  }

  
  async updateOrderWithItems(
    orderId: number,
    updatedOrder: Partial<InsertOrder>,
    updatedItems: InsertOrderItem[]
  ): Promise<Order> {
    return await db.transaction(async (tx) => {
      // 1. Vérifier que la commande existe
      const existing = await tx.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, orderId),
      });

      if (!existing) {
        throw new Error("Commande introuvable");
      }
      updatedOrder.subtotalHT = updatedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toString();    
      updatedOrder.totalTax = updatedItems.reduce((sum, item) => sum + parseFloat(item.taxAmount ?? "0"), 0).toString();
      updatedOrder.totalTTC = (parseFloat( updatedOrder.subtotalHT) + parseFloat(updatedOrder.totalTax) ).toString();
      // 2. Mise à jour de la commande
      await tx.update(orders)
        .set({ ...updatedOrder, updatedAt: new Date().toISOString() })
        .where(eq(orders.id, orderId));

      // 3. Supprimer les lignes existantes
      await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));

      // 4. Ajouter les nouvelles lignes
      const itemsToInsert = updatedItems.map(item => ({
        ...item,
        orderId,
      }));

      await tx.insert(orderItems).values(itemsToInsert);

      // 5. Retourner la commande mise à jour
      const [updated] = await tx.select().from(orders).where(eq(orders.id, orderId));
      return updated;
    });
  }

  async updateOrder(id: number, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
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
    return await db.select().from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(orderItems.id);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertOrderItem).returning();
    return item;
  }

  async updateOrderItem(id: number, updateData: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [item] = await db.update(orderItems)
      .set(updateData)
      .where(eq(orderItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ============ OPERATIONS D'INVENTAIRE ============
  
  async getAllInventoryOperations(): Promise<InventoryOperation[]> {
    return await db.select().from(inventoryOperations).orderBy(desc(inventoryOperations.createdAt));
  }

  async getInventoryOperation(id: number): Promise<InventoryOperation | undefined> {
    const [operation] = await db.select().from(inventoryOperations).where(eq(inventoryOperations.id, id));
    return operation || undefined;
  }

  async getInventoryOperationsByType(type: string): Promise<InventoryOperation[]> {
    return await db.select().from(inventoryOperations)
      .where(eq(inventoryOperations.type, type))
      .orderBy(desc(inventoryOperations.createdAt));
  }

  async createInventoryOperation(insertOperation: InsertInventoryOperation): Promise<InventoryOperation> {
    // Generate automatic code based on type
    const prefixes: Record<string, string> = {
      'reception': 'REC',
      'preparation': 'PREP',
      'preparation_reliquat': 'PREL',
      'ajustement': 'AJU',
      'ajustement_rebut': 'REB',
      'inventaire_initiale': 'INV',
      'interne': 'INT',
      'livraison': 'LIV'
    };
    
    const prefix = prefixes[insertOperation.type] || 'OP';
    const existingOps = await this.getInventoryOperationsByType(insertOperation.type);
    const nextNumber = existingOps.length + 1;
    const code = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
    
    const operationData = {
      ...insertOperation,
      code,
    };
    
    const [operation] = await db.insert(inventoryOperations).values(operationData).returning();
    return operation;
  }

  async updateInventoryOperation(id: number, updateData: Partial<InsertInventoryOperation>): Promise<InventoryOperation | undefined> {
    const [operation] = await db.update(inventoryOperations)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(inventoryOperations.id, id))
      .returning();
    return operation || undefined;
  }

  async deleteInventoryOperation(id: number): Promise<boolean> {
    const result = await db.delete(inventoryOperations).where(eq(inventoryOperations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Inventory Operation Items
  async getInventoryOperationItems(operationId: number): Promise<InventoryOperationItem[]> {
    return await db.select().from(inventoryOperationItems)
      .where(eq(inventoryOperationItems.operationId, operationId))
      .orderBy(inventoryOperationItems.id);
  }

  async createInventoryOperationItem(insertItem: InsertInventoryOperationItem): Promise<InventoryOperationItem> {
    const [item] = await db.insert(inventoryOperationItems).values(insertItem).returning();
    return item;
  }

  async updateInventoryOperationItem(id: number, updateData: Partial<InsertInventoryOperationItem>): Promise<InventoryOperationItem | undefined> {
    const [item] = await db.update(inventoryOperationItems)
      .set(updateData)
      .where(eq(inventoryOperationItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteInventoryOperationItem(id: number): Promise<boolean> {
    const result = await db.delete(inventoryOperationItems).where(eq(inventoryOperationItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ============ LIVRAISONS ============
  
  async getAllDeliveries(): Promise<Delivery[]> {
    return await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
  }

  async getDelivery(id: number): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery || undefined;
  }

  async getDeliveriesByOrder(orderId: number): Promise<Delivery[]> {
    return await db.select().from(deliveries)
      .where(eq(deliveries.orderId, orderId))
      .orderBy(desc(deliveries.createdAt));
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    // Generate automatic code
    const existingDeliveries = await this.getAllDeliveries();
    const nextNumber = existingDeliveries.length + 1;
    const code = `LIV-${nextNumber.toString().padStart(6, '0')}`;
    
    const deliveryData = {
      ...insertDelivery,
      code,
    };
    
    const [delivery] = await db.insert(deliveries).values(deliveryData).returning();
    return delivery;
  }

  async updateDelivery(id: number, updateData: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const [delivery] = await db.update(deliveries)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(deliveries.id, id))
      .returning();
    return delivery || undefined;
  }

  async deleteDelivery(id: number): Promise<boolean> {
    const result = await db.delete(deliveries).where(eq(deliveries.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ============ FACTURATION ============
  
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    // Generate automatic code
    const existingInvoices = await this.getAllInvoices();
    const nextNumber = existingInvoices.length + 1;
    const code = `FAC-${nextNumber.toString().padStart(6, '0')}`;
    
    const invoiceData = {
      ...insertInvoice,
      code,
    };
    
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db.update(invoices)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(invoiceItems.id);
  }

  async createInvoiceItem(insertInvoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values(insertInvoiceItem).returning();
    return item;
  }

  async updateInvoiceItem(id: number, updateData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const [item] = await db.update(invoiceItems)
      .set(updateData)
      .where(eq(invoiceItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const result = await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();