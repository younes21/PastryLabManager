import {
  users,
  measurementCategories, measurementUnits, articleCategories, articles, priceLists, priceRules,
  taxes, currencies, deliveryMethods, accountingJournals, accountingAccounts, storageZones, workStations,
  suppliers, clients, recipes, recipeIngredients, recipeOperations,
  orders, orderItems, inventoryOperations, inventoryOperationItems, deliveries, deliveryPackages, deliveryItems,
  invoices, invoiceItems, payments, accountingEntries, accountingEntryLines, stockReservations,
  lots,

  type User, type InsertUser,
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
  type Payment, type InsertPayment,
  type AccountingEntry, type InsertAccountingEntry, type AccountingEntryLine, type InsertAccountingEntryLine,
  InventoryOperationWithItems,
  type StockReservation, type InsertStockReservation,
  stock,
  Stock
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lt, and, or, gte, lte, isNull, sql } from "drizzle-orm";
import camelcaseKeys from 'camelcase-keys';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

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
  getAllArticleCategories(type: "produit" | "ingredient" | "service" | undefined): Promise<ArticleCategory[]>;
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

  // Purchase Orders (Achats Fournisseurs)
  // Receptions (Achats) via Inventory
  generateReceptionCode(): Promise<string>;
  // Stock & cost updates
  adjustArticleStockAndCost(articleId: number, deltaQuantity: number, newUnitCost: string | number): Promise<Article | undefined>;
  getInventoryRowsByOperation(operationId: number): Promise<Stock[]>;

  // Inventory Operations
  getAllInventoryOperations(): Promise<InventoryOperation[]>;
  getInventoryOperation(id: number): Promise<InventoryOperation | undefined>;
  getInventoryOperationsByType(type: string, includeReliquat: boolean): Promise<InventoryOperation[]>;
  getInventoryOperationsByTypes(types: string[], includeReliquat: boolean): Promise<InventoryOperation[]>;
  getInventoryOperationsByOrder(orderId: number): Promise<InventoryOperationWithItems[]>;
  createInventoryOperation(insertOperation: InsertInventoryOperation): Promise<InventoryOperation>;
  createInventoryOperationWithItems(insertOperation: InsertInventoryOperation, items: InsertInventoryOperationItem[]): Promise<InventoryOperation>;
  updateInventoryOperation(id: number, updateData: Partial<InsertInventoryOperation>): Promise<InventoryOperation | undefined>;
  updateInventoryOperationWithItems(operationId: number, updatedOperation: Partial<InsertInventoryOperation>, updatedItems: InsertInventoryOperationItem[]): Promise<InventoryOperation>;
  deleteInventoryOperation(id: number): Promise<boolean>;

  // ============ FACTURATION ============

  // Invoices
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoicesByOrder(orderId: number): Promise<Invoice[]>;
  getInvoicesFromDeliveryOperation(operationId: number): Promise<Invoice[]>;
  createInvoiceFromDelivery(operationId: number, invoiceData?: Partial<InsertInvoice>): Promise<Invoice>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number): Promise<Invoice | undefined>; // Auto-calcul du statut basé sur les paiements
  deleteInvoice(id: number): Promise<boolean>;
  generateInvoiceCode(): Promise<string>;

  // Invoice Items
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;

  // Payments
  getAllPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByInvoice(invoiceId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;

  // ============ GESTION AVANCEE DES STOCKS ============


  // Créer une réservation de stock
  createStockReservation(reservationData: InsertStockReservation): Promise<StockReservation>;
  // Libérer une réservation de stock
  releaseStockReservation(reservationId: number): Promise<StockReservation>;
  // Créer des réservations d'ingrédients pour une préparation
  createIngredientReservationsForPreparation(operationId: number, items: InventoryOperationItem[]): Promise<StockReservation[]>;
  // Libérer toutes les réservations d'une opération d'inventaire
  releaseAllReservationsForOperation(operationId: number): Promise<boolean>;
  // Obtenir les réservations d'une opération d'inventaire
  getReservationsForOperation(operationId: number): Promise<StockReservation[]>;

  getArticleStockByZone(articleId: number): Promise<any[]>;

  // Obtenir les réservations d'un article
  getArticleReservations(articleId: number): Promise<StockReservation[]>;
  // Calculer le stock disponible (stock total - réservations)
  getAvailableStock(articleId: number): Promise<number>;
  // Obtenir le rapport de traçabilité d'un article
  getArticleTraceabilityReport(articleId: number, startDate?: string, endDate?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  getInventoryRowsByOperation(operationId: number): Promise<Stock[]> {
    throw new Error("Method not implemented.");
  }
  getArticleStockByZone(articleId: number): Promise<any[]> {
    throw new Error("Method not implemented.");
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

  async getAllArticleCategories(type: "produit" | "ingredient" | "service" | undefined): Promise<ArticleCategory[]> {
    if (type) {
      return await db.select().from(articleCategories).where(eq(articleCategories.type, type));
    }
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
    return await db.select().from(articles).orderBy(articles.name);
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
    return await db.select().from(recipes).orderBy(recipes.id);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async getRecipeByArticleId(articleId: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.articleId, articleId));
    return recipe || undefined;
  }

  // Aggregated stats for recipes
  async getRecipeStats(): Promise<Array<{ recipeId: number; ingredientsCount: number; operationsCount: number; totalOperationDuration: number }>> {
    // Count ingredients per recipe
    const ingredientCounts = await db
      .select({ recipeId: recipeIngredients.recipeId, cnt: sql<number>`COUNT(${recipeIngredients.id})` })
      .from(recipeIngredients)
      .groupBy(recipeIngredients.recipeId);

    // Count operations per recipe and sum duration
    const operationsAgg = await db
      .select({
        recipeId: recipeOperations.recipeId,
        cnt: sql<number>`COUNT(${recipeOperations.id})`,
        totalDur: sql<number>`COALESCE(SUM(${recipeOperations}.duration), 0)`,
      })
      .from(recipeOperations)
      .groupBy(recipeOperations.recipeId);

    const map: Record<number, { recipeId: number; ingredientsCount: number; operationsCount: number; totalOperationDuration: number }> = {};

    for (const row of ingredientCounts) {
      map[row.recipeId] = map[row.recipeId] || { recipeId: row.recipeId, ingredientsCount: 0, operationsCount: 0, totalOperationDuration: 0 };
      map[row.recipeId].ingredientsCount = Number(row.cnt);
    }

    for (const row of operationsAgg) {
      map[row.recipeId] = map[row.recipeId] || { recipeId: row.recipeId, ingredientsCount: 0, operationsCount: 0, totalOperationDuration: 0 };
      map[row.recipeId].operationsCount = Number(row.cnt);
      map[row.recipeId].totalOperationDuration = Number(row.totalDur || 0);
    }

    return Object.values(map);
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
    const [client] = await db.select({ idClient: clients.id }).from(clients).where(eq(clients.userId, id));
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

  async getConfirmedOrdersWithProductsToPrepare(): Promise<any[]> {
    // Get confirmed orders with their items, articles, and client information
    const confirmedOrders = await db
      .select({
        id: orders.id,
        code: orders.code,
        clientId: orders.clientId,
        status: orders.status,
        orderDate: orders.orderDate,
        deliveryDate: orders.deliveryDate,
        // Client info
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
        clientCompanyName: clients.companyName,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.status, 'confirmed'))
      .orderBy(desc(orders.orderDate));

    // Get items for these orders with article info
    const ordersWithItems = await Promise.all(
      confirmedOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            articleId: orderItems.articleId,
            quantity: orderItems.quantity,
            quantityPrepared: orderItems.quantityPrepared,
            // Article info
            articleCode: articles.code,
            articleName: articles.name,
            articleType: articles.type,
          })
          .from(orderItems)
          .leftJoin(articles, eq(orderItems.articleId, articles.id))
          .where(and(
            eq(orderItems.orderId, order.id),
            eq(articles.type, 'product') // Only products
          ));

        // Filter items that still need preparation
        const itemsNeedingPreparation = items.filter(item => {
          const quantityOrdered = parseFloat(item.quantity);
          const quantityPrepared = parseFloat(item.quantityPrepared || '0');
          return quantityPrepared < quantityOrdered;
        });

        if (itemsNeedingPreparation.length > 0) {
          return {
            ...order,
            client: {
              firstName: order.clientFirstName,
              lastName: order.clientLastName,
              companyName: order.clientCompanyName,
            },
            items: itemsNeedingPreparation.map(item => ({
              ...item,
              article: {
                id: item.articleId,
                code: item.articleCode,
                name: item.articleName,
                type: item.articleType,
              }
            }))
          };
        }
        return null;
      })
    );

    // Filter out orders with no items needing preparation
    return ordersWithItems.filter(order => order !== null);
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

  async createOrderWithItems(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    insertOrder.subtotalHT = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toString();
    insertOrder.totalTax = items.reduce((sum, item) => sum + parseFloat(item.taxAmount ?? "0"), 0).toString();
    insertOrder.totalTTC = (parseFloat(insertOrder.subtotalHT) + parseFloat(insertOrder.totalTax)).toString();

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
      updatedOrder.totalTTC = (parseFloat(updatedOrder.subtotalHT) + parseFloat(updatedOrder.totalTax)).toString();
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

  async getAllInventoryOperations(): Promise<InventoryOperation[]> {
    return await db.select().from(inventoryOperations).orderBy(desc(inventoryOperations.createdAt));
  }

  async getInventoryOperation(id: number): Promise<InventoryOperation | undefined> {
    const [operation] = await db.select().from(inventoryOperations).where(eq(inventoryOperations.id, id));
    return operation || undefined;
  }

  async getInventoryOperationsByType(type: string, includeReliquat: boolean = false): Promise<InventoryOperationWithItems[]> {
    const condition =
      type === 'preparation' && includeReliquat
        ? sql`io.type IN ('preparation', 'preparation_reliquat')`
        : sql`io.type = ${type}`;

    const result = await db.execute(sql`
    SELECT 
      io.*,
      COALESCE(
        json_agg(iot.*) FILTER (WHERE iot.id IS NOT NULL),
        '[]'
      ) AS items
    FROM inventory_operations io
    LEFT JOIN inventory_operation_items iot
      ON iot.operation_id = io.id
    WHERE ${condition}
    GROUP BY io.id
    ORDER BY io.created_at DESC
  `);

    return camelcaseKeys(result.rows, { deep: true }) as InventoryOperationWithItems[];
  }

  async getInventoryOperationsByTypes(types: string[], includeReliquat: boolean = false): Promise<InventoryOperationWithItems[]> {
    // Construire la condition pour plusieurs types
    const typeConditions = types.map(type => {
      if (type === 'preparation' && includeReliquat) {
        return sql`io.type IN ('preparation', 'preparation_reliquat')`;
      }
      return sql`io.type = ${type}`;
    });

    // Joindre les conditions avec OR
    const condition = sql.join(typeConditions, sql` OR `);

    const result = await db.execute(sql`
    SELECT 
      io.*,
      COALESCE(
        json_agg(iot.*) FILTER (WHERE iot.id IS NOT NULL),
        '[]'
      ) AS items
    FROM inventory_operations io
    LEFT JOIN inventory_operation_items iot
      ON iot.operation_id = io.id
    WHERE (${condition})
    GROUP BY io.id
    ORDER BY 
      CASE WHEN io.type = 'inventaire_initiale' THEN 0 ELSE 1 END,
      io.created_at DESC
  `);

    return camelcaseKeys(result.rows, { deep: true }) as InventoryOperationWithItems[];
  }

  async getInventoryOperationsByOperator(operatorId: number): Promise<InventoryOperationWithItems[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          io.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', iot.id,
                'operationId', iot.operation_id,
                'articleId', iot.article_id,
                'quantity', iot.quantity,
                'unitCost', iot.unit_cost,
                'totalCost', iot.total_cost,
                'notes', iot.notes,
                'createdAt', iot.created_at,
                'article', CASE 
                  WHEN a.id IS NOT NULL THEN json_build_object(
                    'id', a.id,
                    'code', a.code,
                    'name', a.name,
                    'type', a.type,
                    'description', a.description,
                    'costPerUnit', a.cost_per_unit,
                    'price', a.price,
                    'currentStock', a.current_stock,
                    'minStock', a.min_stock,
                    'maxStock', a.max_stock,
                    'active', a.active,
                    'createdAt', a.created_at
                  )
                  ELSE NULL
                END
              )
            ) FILTER (WHERE iot.id IS NOT NULL),
            '[]'
          ) AS items
        FROM inventory_operations io
        LEFT JOIN inventory_operation_items iot
          ON iot.operation_id = io.id
        LEFT JOIN articles a
          ON a.id = iot.article_id
        WHERE io.operator_id = ${operatorId}
          AND io.type IN ('preparation', 'preparation_reliquat')
        GROUP BY io.id, io.code, io.type, io.status, io.operator_id, io.scheduled_date, io.started_at, io.completed_at, io.notes, io.created_at, io.updated_at
        ORDER BY io.created_at DESC
      `);

      return camelcaseKeys(result.rows, { deep: true }) as InventoryOperationWithItems[];
    } catch (error) {
      console.error('Error in getInventoryOperationsByOperator:', error);
      throw error;
    }
  }

  async getInventoryOperationsByOrder(orderId: number): Promise<InventoryOperationWithItems[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          io.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', iot.id,
                'operationId', iot.operation_id,
                'articleId', iot.article_id,
                'quantity', iot.quantity,
                'unitCost', iot.unit_cost,
                'totalCost', iot.total_cost,
                'notes', iot.notes,
                'createdAt', iot.created_at,
                'article', CASE 
                  WHEN a.id IS NOT NULL THEN json_build_object(
                    'id', a.id,
                    'code', a.code,
                    'name', a.name,
                    'type', a.type,
                    'description', a.description,
                    'costPerUnit', a.cost_per_unit,
                    'price', a.price,
                    'currentStock', a.current_stock,
                    'minStock', a.min_stock,
                    'maxStock', a.max_stock,
                    'active', a.active,
                    'createdAt', a.created_at
                  )
                  ELSE NULL
                END
              )
            ) FILTER (WHERE iot.id IS NOT NULL),
            '[]'
          ) AS items
        FROM inventory_operations io
        LEFT JOIN inventory_operation_items iot
          ON iot.operation_id = io.id
        LEFT JOIN articles a
          ON a.id = iot.article_id
        WHERE io.order_id = ${orderId}
          AND io.type = 'livraison'
        GROUP BY io.id, io.code, io.type, io.status, io.operator_id, io.scheduled_date, io.started_at, io.completed_at, io.notes, io.created_at, io.updated_at
        ORDER BY io.created_at DESC
      `);

      return camelcaseKeys(result.rows, { deep: true }) as InventoryOperationWithItems[];
    } catch (error) {
      console.error('Error in getInventoryOperationsByOrder:', error);
      throw error;
    }
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

  async createInventoryOperationWithItems(insertOperation: InsertInventoryOperation, items: InsertInventoryOperationItem[]): Promise<InventoryOperation> {
    return await db.transaction(async (tx) => {
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
      const existingOps = await tx.select().from(inventoryOperations).where(eq(inventoryOperations.type, insertOperation.type));
      const nextNumber = existingOps.length + 1;
      const code = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;

      const [operation] = await tx
        .insert(inventoryOperations)
        .values({ ...insertOperation, code })
        .returning();

      const itemsToInsert = items.map((item) => ({
        ...item,
        operationId: operation.id,
      }));

      await tx.insert(inventoryOperationItems).values(itemsToInsert);

      // Gérer les réservations automatiquement pour les nouvelles opérations
      if (operation.type === 'preparation' || operation.type === 'preparation_reliquat') {
        if (operation.status === 'programmed' && itemsToInsert.length > 0) {
          for (const item of itemsToInsert) {
            const article = await this.getArticle(item.articleId);
            if (!article) continue;

            // Trouver la recette pour ce produit
            const recipe = await this.getRecipeByArticleId(article.id);
            if (!recipe) continue;

            const recipeIngredients = await this.getRecipeIngredients(recipe.id);
            const plannedQuantity = parseFloat(item.quantity || '0');
            const recipeQuantity = parseFloat(recipe.quantity || '1');
            const ratio = plannedQuantity / recipeQuantity;

            for (const ingredient of recipeIngredients) {
              const ingredientArticle = await this.getArticle(ingredient.articleId);
              if (!ingredientArticle) continue;

              const requiredQuantity = parseFloat(ingredient.quantity || '0') * ratio;
              const currentStock = parseFloat(ingredientArticle.currentStock || '0');

              if (currentStock < requiredQuantity) {
                throw new Error(`Stock insuffisant pour ${ingredientArticle.name}. Disponible: ${currentStock}, Requis: ${requiredQuantity}`);
              }

              await tx.insert(stockReservations).values({
                articleId: ingredientArticle.id,
                inventoryOperationId: operation.id,
                reservedQuantity: requiredQuantity.toString(),
                reservationType: 'preparation' as const,
                notes: `Réservation pour préparation ${operation.id} - Produit: ${article.name}`,
              });
            }
          }
        }
      }

      return operation;
    });
  }

  // async createAccountingEntryFromOperation(operation: InventoryOperation): Promise<AccountingEntry | undefined> {
  //   if (operation.type === "reception" || operation.type === "livraison" || operation.type === "ajustement") {
  //     return await createAccountingEntryFromOperation(operation);
  //   }
  // }

  async  updateInventoryOperationStatus(
    id: number,
    status: string
  ): Promise<InventoryOperation | undefined> {
    return await db.transaction(async (tx) => {
      const op = await tx.query.inventoryOperations.findFirst({
        where: (o, { eq }) => eq(o.id, id),
        with: { items: true }
      });
      if (!op) throw new Error("Operation not found");
  
      if (op.status === status) return op; // rien à faire
  
      // ---- Passage en completed ----
      if (status === "completed" && op.status !== "completed") {
        for (const item of op.items) {
          const qty = Number(item.quantity) || 0;
          if (qty < 0) throw new Error(`Invalid qty for article ${item.articleId}`);
  
          // Sortie de stock (fromStorageZoneId)
          if (item.fromStorageZoneId) {
            await tx.insert(stock).values({
              articleId: item.articleId,
              storageZoneId: item.fromStorageZoneId,
              lotId: item.lotId ?? null,
              serialNumber: item.serialNumber ?? null,
              quantity: -qty,
              updatedAt: new Date()
            }).onConflictDoUpdate({
              target: [stock.articleId, stock.storageZoneId, stock.lotId, stock.serialNumber],
              set: { quantity: sql`${stock.quantity} - ${qty}`, updatedAt: sql`now()` }
            });
  
            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} - ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
  
          // Entrée de stock (toStorageZoneId)
          if (item.toStorageZoneId) {
            await tx.insert(stock).values({
              articleId: item.articleId,
              storageZoneId: item.toStorageZoneId,
              lotId: item.lotId ?? null,
              serialNumber: item.serialNumber ?? null,
              quantity: qty,
              updatedAt: new Date()
            }).onConflictDoUpdate({
              target: [stock.articleId, stock.storageZoneId, stock.lotId, stock.serialNumber],
              set: { quantity: sql`${stock.quantity} + ${qty}`, updatedAt: sql`now()` }
            });
  
            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} + ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
        }
      }
  
      // ---- Passage en cancelled ----
      if (status === "cancelled" && op.status === "completed") {
        for (const item of op.items) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;
  
          // rollback entrée
          if (item.toStorageZoneId) {
            await tx.insert(stock).values({
              articleId: item.articleId,
              storageZoneId: item.toStorageZoneId,
              lotId: item.lotId ?? null,
              serialNumber: item.serialNumber ?? null,
              quantity: -qty,
              updatedAt: new Date()
            }).onConflictDoUpdate({
              target: [stock.articleId, stock.storageZoneId, stock.lotId, stock.serialNumber],
              set: { quantity: sql`${stock.quantity} - ${qty}`, updatedAt: sql`now()` }
            });
  
            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} - ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
  
          // rollback sortie
          if (item.fromStorageZoneId) {
            await tx.insert(stock).values({
              articleId: item.articleId,
              storageZoneId: item.fromStorageZoneId,
              lotId: item.lotId ?? null,
              serialNumber: item.serialNumber ?? null,
              quantity: qty,
              updatedAt: new Date()
            }).onConflictDoUpdate({
              target: [stock.articleId, stock.storageZoneId, stock.lotId, stock.serialNumber],
              set: { quantity: sql`${stock.quantity} + ${qty}`, updatedAt: sql`now()` }
            });
  
            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} + ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
        }
      }
  
      // ---- Mettre à jour le statut ----
      const [newOp] = await tx.update(inventoryOperations)
        .set({ status, updatedAt: new Date() })
        .where(eq(inventoryOperations.id, id))
        .returning();
  
      return newOp;
    });
  }
  
  async updateInventoryOperation(id: number, updateData: Partial<InsertInventoryOperation>): Promise<InventoryOperation | undefined> {
    const [operation] = await db.update(inventoryOperations)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(inventoryOperations.id, id))
      .returning();
    return operation || undefined;
  }

  async updateInventoryOperationWithItems(
    operationId: number,
    updatedOperation: Partial<InsertInventoryOperation>,
    updatedItems: InsertInventoryOperationItem[]
  ): Promise<InventoryOperation> {
    return await db.transaction(async (tx) => {
      // Get current operation to check status changes
      const [currentOperation] = await tx.select()
        .from(inventoryOperations)
        .where(eq(inventoryOperations.id, operationId));

      if (!currentOperation) {
        throw new Error(`Inventory operation with ID ${operationId} not found`);
      }

      // Update the operation header
      const [operation] = await tx.update(inventoryOperations)
        .set({ ...updatedOperation, updatedAt: new Date().toISOString() })
        .where(eq(inventoryOperations.id, operationId))
        .returning();

      if (!operation) {
        throw new Error(`Inventory operation with ID ${operationId} not found`);
      }

      // Delete existing items
      await tx.delete(inventoryOperationItems)
        .where(eq(inventoryOperationItems.operationId, operationId));

      // Insert new items
      if (updatedItems.length > 0) {
        const itemsToInsert = updatedItems.map(item => ({
          ...item,
          operationId: operationId
        }));
        await tx.insert(inventoryOperationItems).values(itemsToInsert);
      }

      // Gérer les réservations automatiquement
      if (operation.type === 'preparation' || operation.type === 'preparation_reliquat') {
        // Si le statut devient "programmed", créer les réservations
        if (operation.status === 'programmed' && currentOperation.status !== 'programmed') {
          // Libérer d'abord les anciennes réservations si elles existent
          await tx.update(stockReservations)
            .set({ status: 'cancelled' })
            .where(eq(stockReservations.inventoryOperationId, operationId));

          // Créer de nouvelles réservations pour les nouveaux items
          if (updatedItems.length > 0) {
            for (const item of updatedItems) {
              const article = await this.getArticle(item.articleId);
              if (!article) continue;

              // Trouver la recette pour ce produit
              const recipe = await this.getRecipeByArticleId(article.id);
              if (!recipe) continue;

              // Obtenir les ingrédients de la recette
              const recipeIngredients = await this.getRecipeIngredients(recipe.id);

              // Calculer la consommation basée sur la quantité planifiée
              const plannedQuantity = parseFloat(item.quantity || '0');
              const recipeQuantity = parseFloat(recipe.quantity || '1');
              const ratio = plannedQuantity / recipeQuantity;

              // Créer des réservations pour chaque ingrédient
              for (const ingredient of recipeIngredients) {
                const ingredientArticle = await this.getArticle(ingredient.articleId);
                if (!ingredientArticle) continue;

                const requiredQuantity = parseFloat(ingredient.quantity || '0') * ratio;

                // Vérifier si assez de stock est disponible
                const currentStock = parseFloat(ingredientArticle.currentStock || '0');
                if (currentStock < requiredQuantity) {
                  throw new Error(`Stock insuffisant pour ${ingredientArticle.name}. Disponible: ${currentStock}, Requis: ${requiredQuantity}`);
                }

                // Créer la réservation directement dans la transaction
                await tx.insert(stockReservations).values({
                  articleId: ingredientArticle.id,
                  inventoryOperationId: operationId,
                  reservedQuantity: requiredQuantity.toString(),
                  reservationType: 'preparation' as const,
                  notes: `Réservation pour préparation ${operationId} - Produit: ${article.name}`,
                });
              }
            }
          }
        }
        // Si le statut n'est plus "programmed", libérer les réservations
        else if (operation.status !== 'programmed' && currentOperation.status === 'programmed') {
          await tx.update(stockReservations)
            .set({ status: 'cancelled' })
            .where(eq(stockReservations.inventoryOperationId, operationId));
        }
      }

      return operation;
    });
  }

  async deleteInventoryOperation(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Charger l'opération avec ses lignes pour vérifier le statut
      const op = await tx.query.inventoryOperations.findFirst({
        where: (o, { eq }) => eq(o.id, id),
        with: { items: true }
      });

      if (!op) return false;

      // Si l'opération est complétée et de type reception, annuler les stocks
      if (op.status === 'completed' && op.type === 'reception') {
        for (const item of op.items) {
          const qty = Number(item.quantity) || 0;
          
          if (qty > 0) {
            if (!item.toStorageZoneId) {
              throw new Error(`Missing storage zone for article ${item.articleId}`);
            }

            // Retirer du stock
            await tx.insert(stock).values({
              articleId: item.articleId,
              storageZoneId: item.toStorageZoneId,
              lotId: item.lotId ?? null,
              serialNumber: item.serialNumber ?? null,
              quantity: -qty,
              updatedAt: new Date()
            }).onConflictDoUpdate({
              target: ["article_id", "storage_zone_id", "lot_id", "serial_number"],
              set: {
                quantity: sql`${stock.quantity} - ${qty}`,
                updatedAt: sql`now()`
              }
            });

            // Mettre à jour le stock actuel de l'article
            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} - ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
        }
      }

      // Libérer d'abord toutes les réservations liées à cette opération
      await tx.update(stockReservations)
        .set({ status: 'cancelled' })
        .where(eq(stockReservations.inventoryOperationId, id));

      // Supprimer l'opération
      const result = await tx.delete(inventoryOperations).where(eq(inventoryOperations.id, id));
      return (result.rowCount || 0) > 0;
    });
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

  async adjustArticleStockAndCost(articleId: number, deltaQuantity: number, newUnitCost: string | number): Promise<Article | undefined> {
    const article = await this.getArticle(articleId);
    if (!article) return undefined;
    const current = parseFloat(article.currentStock as unknown as string || '0');
    const next = current + (Number.isFinite(deltaQuantity) ? deltaQuantity : 0);
    const [updated] = await db
      .update(articles)
      .set({
        currentStock: next.toString(),
        costPerUnit: typeof newUnitCost === 'number' ? newUnitCost.toString() : newUnitCost,
      })
      .where(eq(articles.id, articleId))
      .returning();
    return updated || undefined;
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

  // ============ ACHATS VIA INVENTORY (aucune table purchase_*) ============
  // Générateur de code pour réceptions
  async generateReceptionCode(): Promise<string> {
    const existingOps = await this.getInventoryOperationsByType('reception');
    const nextNumber = existingOps.length + 1;
    return `REC-${nextNumber.toString().padStart(6, '0')}`;
  }

  // ============ GESTION AVANCEE DES STOCKS ============


  // Créer une réservation de stock
  async createStockReservation(reservationData: InsertStockReservation): Promise<StockReservation> {
    // Vérifier la disponibilité du stock
    const article = await this.getArticle(reservationData.articleId);
    if (!article) {
      throw new Error(`Article ${reservationData.articleId} not found`);
    }

    const availableStock = parseFloat(article.currentStock || '0');
    const reservedQuantity = parseFloat(reservationData.reservedQuantity);

    if (availableStock < reservedQuantity) {
      throw new Error(`Insufficient stock for reservation. Available: ${availableStock}, Required: ${reservedQuantity}`);
    }

    const [newReservation] = await db.insert(stockReservations).values(reservationData).returning();

    return newReservation;
  }

  // Libérer une réservation de stock
  async releaseStockReservation(reservationId: number): Promise<StockReservation> {
    const [updatedReservation] = await db.update(stockReservations)
      .set({ status: 'cancelled' })
      .where(eq(stockReservations.id, reservationId))
      .returning();

    return updatedReservation;
  }

  // Créer des réservations d'ingrédients pour une préparation
  async createIngredientReservationsForPreparation(operationId: number, items: InventoryOperationItem[]): Promise<StockReservation[]> {
    const reservations: StockReservation[] = [];

    for (const item of items) {
      const article = await this.getArticle(item.articleId);
      if (!article) continue;

      // Trouver la recette pour ce produit
      const recipe = await this.getRecipeByArticleId(article.id);
      if (!recipe) continue;

      // Obtenir les ingrédients de la recette
      const recipeIngredients = await this.getRecipeIngredients(recipe.id);

      // Calculer la consommation basée sur la quantité planifiée
      const plannedQuantity = parseFloat(item.quantity || '0');
      const recipeQuantity = parseFloat(recipe.quantity || '1');
      const ratio = plannedQuantity / recipeQuantity;

      // Créer des réservations pour chaque ingrédient
      for (const ingredient of recipeIngredients) {
        const ingredientArticle = await this.getArticle(ingredient.articleId);
        if (!ingredientArticle) continue;

        const requiredQuantity = parseFloat(ingredient.quantity || '0') * ratio;

        // Vérifier si assez de stock est disponible
        const currentStock = parseFloat(ingredientArticle.currentStock || '0');
        if (currentStock < requiredQuantity) {
          throw new Error(`Stock insuffisant pour ${ingredientArticle.name}. Disponible: ${currentStock}, Requis: ${requiredQuantity}`);
        }

        // Créer la réservation
        const reservationData = {
          articleId: ingredientArticle.id,
          inventoryOperationId: operationId,
          reservedQuantity: requiredQuantity.toString(),
          reservationType: 'preparation' as const,
          notes: `Réservation pour préparation ${operationId} - Produit: ${article.name}`,
        };

        const reservation = await this.createStockReservation(reservationData);
        reservations.push(reservation);
      }
    }

    return reservations;
  }

  // Libérer toutes les réservations d'une opération d'inventaire
  async releaseAllReservationsForOperation(operationId: number): Promise<boolean> {
    const result = await db.update(stockReservations)
      .set({ status: 'cancelled' })
      .where(eq(stockReservations.inventoryOperationId, operationId));

    return (result.rowCount || 0) > 0;
  }

  // Obtenir les réservations d'une opération d'inventaire
  async getReservationsForOperation(operationId: number): Promise<StockReservation[]> {
    return await db.select()
      .from(stockReservations)
      .where(eq(stockReservations.inventoryOperationId, operationId));
  }



  // Obtenir les réservations d'un article
  async getArticleReservations(articleId: number): Promise<StockReservation[]> {
    const reservations = await db.select()
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.articleId, articleId),
          eq(stockReservations.status, 'reserved')
        )
      )
      .orderBy(desc(stockReservations.reservedAt));

    return reservations;
  }

  // Obtenir les réservations actives d'un article (avec plus de détails)
  async getActiveArticleReservations(articleId: number): Promise<StockReservation[]> {
    const reservations = await db.select()
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.articleId, articleId),
          eq(stockReservations.status, 'reserved')
        )
      )
      .orderBy(desc(stockReservations.reservedAt));

    return reservations;
  }

  // Calculer le stock disponible (stock total - réservations)
  async getAvailableStock(articleId: number): Promise<number> {
    const article = await this.getArticle(articleId);
    if (!article) return 0;

    const totalStock = parseFloat(article.currentStock || '0');

    // Calculer les réservations actives
    const reservations = await this.getArticleReservations(articleId);
    const reservedQuantity = reservations.reduce((sum, res) =>
      sum + parseFloat(res.reservedQuantity) - parseFloat(res.deliveredQuantity || '0'), 0
    );

    return Math.max(0, totalStock - reservedQuantity);
  }

  // Vérifier si un article a suffisamment de stock disponible pour une quantité donnée
  async hasEnoughAvailableStock(articleId: number, requiredQuantity: number): Promise<boolean> {
    const availableStock = await this.getAvailableStock(articleId);
    return availableStock >= requiredQuantity;
  }

  // Obtenir le détail complet de la disponibilité d'un article
  async getArticleStockDetails(articleId: number): Promise<{
    totalStock: number;
    reservedQuantity: number;
    deliveredQuantity: number;
    availableStock: number;
    reservations: StockReservation[];
  }> {
    const article = await this.getArticle(articleId);
    if (!article) {
      return {
        totalStock: 0,
        reservedQuantity: 0,
        deliveredQuantity: 0,
        availableStock: 0,
        reservations: []
      };
    }

    const totalStock = parseFloat(article.currentStock || '0');
    const reservations = await this.getArticleReservations(articleId);

    const reservedQuantity = reservations.reduce((sum, res) =>
      sum + parseFloat(res.reservedQuantity), 0
    );

    const deliveredQuantity = reservations.reduce((sum, res) =>
      sum + parseFloat(res.deliveredQuantity || '0'), 0
    );

    const availableStock = Math.max(0, totalStock - reservedQuantity + deliveredQuantity);

    return {
      totalStock,
      reservedQuantity,
      deliveredQuantity,
      availableStock,
      reservations
    };
  }

  // Vérifier la disponibilité de tous les ingrédients d'une recette
  async checkRecipeIngredientsAvailability(recipeId: number, plannedQuantity: number): Promise<{
    available: boolean;
    missingIngredients: Array<{
      articleId: number;
      articleName: string;
      requiredQuantity: number;
      availableStock: number;
      shortfall: number;
    }>;
    totalReservations: number;
  }> {
    const recipe = await this.getRecipe(recipeId);
    if (!recipe) {
      return {
        available: false,
        missingIngredients: [],
        totalReservations: 0
      };
    }

    const recipeIngredients = await this.getRecipeIngredients(recipeId);
    const recipeQuantity = parseFloat(recipe.quantity || '1');
    const ratio = plannedQuantity / recipeQuantity;

    let allAvailable = true;
    const missingIngredients: Array<{
      articleId: number;
      articleName: string;
      requiredQuantity: number;
      availableStock: number;
      shortfall: number;
    }> = [];

    let totalReservations = 0;

    for (const ingredient of recipeIngredients) {
      const ingredientArticle = await this.getArticle(ingredient.articleId);
      if (!ingredientArticle) continue;

      const requiredQuantity = parseFloat(ingredient.quantity || '0') * ratio;
      const availableStock = await this.getAvailableStock(ingredient.articleId);

      // Compter les réservations pour cet ingrédient
      const reservations = await this.getArticleReservations(ingredient.articleId);
      const reservedQuantity = reservations.reduce((sum, res) =>
        sum + parseFloat(res.reservedQuantity) - parseFloat(res.deliveredQuantity || '0'), 0
      );
      totalReservations += reservedQuantity;

      if (availableStock < requiredQuantity) {
        allAvailable = false;
        missingIngredients.push({
          articleId: ingredient.articleId,
          articleName: ingredientArticle.name,
          requiredQuantity,
          availableStock,
          shortfall: requiredQuantity - availableStock
        });
      }
    }

    return {
      available: allAvailable,
      missingIngredients,
      totalReservations
    };
  }

  // Obtenir le rapport de traçabilité d'un article
  async getArticleTraceabilityReport(articleId: number, startDate?: string, endDate?: string): Promise<any> {
    let query = sql`
      SELECT 
        sm.*,
        a.name as article_name,
        a.code as article_code,
        sz_from.designation as from_zone,
        sz_to.designation as to_zone,
        u_created.first_name || ' ' || u_created.last_name as created_by_name,
        u_confirmed.first_name || ' ' || u_confirmed.last_name as confirmed_by_name,
        u_done.first_name || ' ' || u_done.last_name as done_by_name
      FROM stock_moves sm
      LEFT JOIN articles a ON a.id = sm.article_id
      LEFT JOIN storage_zones sz_from ON sz_from.id = sm.from_storage_zone_id
      LEFT JOIN storage_zones sz_to ON sz_to.id = sm.to_storage_zone_id
      LEFT JOIN users u_created ON u_created.id = sm.created_by
      LEFT JOIN users u_confirmed ON u_confirmed.id = sm.confirmed_by
      LEFT JOIN users u_done ON u_done.id = sm.done_by
      WHERE sm.article_id = ${articleId}
    `;

    if (startDate) {
      query = sql`${query} AND sm.created_at >= ${startDate}`;
    }

    if (endDate) {
      query = sql`${query} AND sm.created_at <= ${endDate}`;
    }

    query = sql`${query} ORDER BY sm.created_at DESC`;

    const result = await db.execute(query);
    return result.rows;
  }

  // ============ FACTURATION ============

  // Invoices
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

  async getInvoicesByOrder(orderId: number): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.orderId, orderId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesFromDeliveryOperation(operationId: number): Promise<Invoice[]> {
    // Trouver les factures liées aux éléments de livraison d'une opération
    const invoicesData = await db
      .select({ invoice: invoices })
      .from(invoices)
      .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
      .innerJoin(inventoryOperationItems, eq(invoiceItems.inventoryOperationItemId, inventoryOperationItems.id))
      .where(eq(inventoryOperationItems.operationId, operationId))
      .groupBy(invoices.id);

    return invoicesData.map(row => row.invoice);
  }

  async createInvoiceFromDelivery(operationId: number, invoiceData?: Partial<InsertInvoice>): Promise<Invoice> {
    const operation = await db
      .select().from(inventoryOperations)
      .where(and(
        eq(inventoryOperations.id, operationId),
        eq(inventoryOperations.type, 'delivery'),
        eq(inventoryOperations.status, 'completed')
      )).limit(1);

    if (operation.length === 0) {
      throw new Error('Opération de livraison non trouvée ou non complétée');
    }

    const op = operation[0];
    const invoiceCode = await this.generateInvoiceCode();

    // Calculer les montants de la facture à partir des éléments de livraison
    const operationItems = await db
      .select().from(inventoryOperationItems)
      .where(eq(inventoryOperationItems.operationId, operationId));

    const subtotalHT = operationItems.reduce((sum, item) => 
      sum + parseFloat(item.totalCost || '0'), 0
    ).toFixed(2);

    const totalTax = operationItems.reduce((sum, item) => 
      sum + parseFloat(item.taxAmount || '0'), 0
    ).toFixed(2);

    const totalTTC = (parseFloat(subtotalHT) + parseFloat(totalTax)).toFixed(2);

    // Créer la facture
    const newInvoiceData: InsertInvoice = {
      code: invoiceCode,
      orderId: op.orderId || undefined,
      clientId: op.clientId!,
      status: 'draft',
      subtotalHT,
      totalTax,
      totalTTC,
      discount: '0.00',
      amountPaid: '0.00',
      ...invoiceData,
    };

    const [newInvoice] = await db.insert(invoices).values(newInvoiceData).returning();

    // Créer les éléments de facture à partir des éléments de livraison
    for (const opItem of operationItems) {
      await db.insert(invoiceItems).values({
        invoiceId: newInvoice.id,
        articleId: opItem.articleId,
        inventoryOperationItemId: opItem.id,
        description: `Livraison - Article ID ${opItem.articleId}`,
        quantity: opItem.quantity,
        unitPrice: opItem.unitPriceSale || opItem.unitCost || '0.00',
        totalPrice: opItem.totalCost || '0.00',
        taxRate: opItem.taxRate || '0.00',
        taxAmount: opItem.taxAmount || '0.00',
      });
    }

    return newInvoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceCode = await this.generateInvoiceCode();
    const invoiceData = {
      ...invoice,
      code: invoiceCode,
    };

    const [newInvoice] = await db.insert(invoices).values(invoiceData).returning();
    return newInvoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db.update(invoices)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async updateInvoiceStatus(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return undefined;

    const payments = await this.getPaymentsByInvoice(id);
    const totalPaid = payments.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0
    );
    const totalTTC = parseFloat(invoice.totalTTC);

    let newStatus: string;
    if (totalPaid === 0) {
      newStatus = invoice.status === 'cancelled' ? 'cancelled' : 'draft';
    } else if (totalPaid >= totalTTC) {
      newStatus = 'paid';
    } else {
      newStatus = 'partial';
    }

    const [updatedInvoice] = await db.update(invoices)
      .set({
        status: newStatus,
        amountPaid: totalPaid.toFixed(2),
        paidAt: newStatus === 'paid' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(invoices.id, id))
      .returning();

    return updatedInvoice || undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async generateInvoiceCode(): Promise<string> {
    const existingInvoices = await db.select({ id: invoices.id }).from(invoices);
    const nextNumber = existingInvoices.length + 1;
    return `FAC-${nextNumber.toString().padStart(6, '0')}`;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db.insert(invoiceItems).values(item).returning();
    return newItem;
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

  // Payments
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    
    // Mettre à jour automatiquement le statut de la facture
    if (payment.invoiceId) {
      await this.updateInvoiceStatus(payment.invoiceId);
    }
    
    return newPayment;
  }

  async updatePayment(id: number, updateData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();

    // Mettre à jour le statut de la facture si nécessaire
    if (payment && payment.invoiceId) {
      await this.updateInvoiceStatus(payment.invoiceId);
    }

    return payment || undefined;
  }

  async deletePayment(id: number): Promise<boolean> {
    // Obtenir le paiement avant suppression pour mettre à jour la facture
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    
    const result = await db.delete(payments).where(eq(payments.id, id));
    const deleted = (result.rowCount || 0) > 0;

    // Mettre à jour le statut de la facture
    if (deleted && payment && payment.invoiceId) {
      await this.updateInvoiceStatus(payment.invoiceId);
    }

    return deleted;
  }
}

export const storage = new DatabaseStorage();