import {
  users,
  measurementCategories, measurementUnits, articleCategories, articles, priceLists, priceRules,
  taxes, currencies, deliveryMethods, accountingJournals, accountingAccounts, storageZones, workStations,
  suppliers, clients, recipes, recipeIngredients, recipeOperations,
  orders, orderItems, inventoryOperations, inventoryOperationItems,
  invoices, invoiceItems, stockReservations,
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


  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Payment, type InsertPayment,

  InventoryOperationWithItems,
  type StockReservation, type InsertStockReservation,
  stock,
  Stock
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lt, and, sql, gt } from "drizzle-orm";
import camelcaseKeys from 'camelcase-keys';
import {
  ArticleCategoryType,
  OrderType,
  OrderStatus,
  InventoryOperationType,
  InventoryOperationStatus,
  StockReservationStatus,
  StockReservationType,
  StockReservationDirection,
  OrderPrefix,
  PrefixInventoryOperationType,
  DEFAULT_ARTICLE_UNIT,
  ZONE_CODE_PREFIX,
  JOURNAL_CODE_PREFIX,
  TAX_CODE_PREFIX,
  ArticlePrefix,
  STATION_CODE_PREFIX,
  SUPPLIER_CODE_PREFIX,
  CLIENT_CODE_PREFIX,
} from "@shared/constants";


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
  getAllArticleCategories(type: ArticleCategoryType | undefined): Promise<ArticleCategory[]>;
  getActiveArticleCategories(): Promise<ArticleCategory[]>;
  createArticleCategory(category: InsertArticleCategory): Promise<ArticleCategory>;
  updateArticleCategory(id: number, category: Partial<InsertArticleCategory>): Promise<ArticleCategory | undefined>;
  deleteArticleCategory(id: number): Promise<boolean>;

  // Articles (unified)
  getArticle(id: number): Promise<Article | undefined>;
  getAllArticles(): Promise<Article[]>;
  getAllAvailableArticlesStock(withDetails: boolean, excludeDeliveryId?: number): Promise<ArticleStockBase[] | ArticleStockDetail[]>;
  getSelectedArticlesStock(articleIds: number[], withDetails: boolean): Promise<ArticleStockBase[] | ArticleStockDetail[]>;
  getArticleAvailableStock(articleId: number, withDetails: boolean): Promise<ArticleStockBase | ArticleStockDetail | null>;
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
  getPaymentsByClient(clientId: number): Promise<Payment[]>;
  getOutstandingPayments(): Promise<any[]>;
  getPaymentStatistics(): Promise<any>;
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
  // Obtenir toutes les réservations des articles d'une opération (en excluant les réservations de l'opération elle-même)
  getOtherReservationsForOperationArticles(operationId: number): Promise<StockReservation[]>;

  getArticleStockByZone(articleId: number): Promise<any[]>;

  // Obtenir les réservations d'un article
  getArticleReservations(articleId: number): Promise<StockReservation[]>;
  // Obtenir le rapport de traçabilité d'un article
  getArticleTraceabilityReport(articleId: number, startDate?: string, endDate?: string): Promise<any>;


  // ============ GESTION DES ANNULATIONS ============

  // 3. Créer une opération de rebut
  createWasteOperation(deliveryId: number, reason: string): Promise<InventoryOperation>;

  // 2. Créer une opération de retour au stock
  createReturnToStockOperation(deliveryId: number, reason: string): Promise<InventoryOperation>;

  /**
   * Valide une livraison : déduit le stock, met à jour le statut de l'opération et des réservations
   * @param {number} deliveryOperationId
   * @returns {Promise<InventoryOperation>}
   */
  validateDelivery(deliveryOperationId: number): Promise<InventoryOperation>;
}

export class DatabaseStorage implements IStorage {
  updateInvoiceStatus(id: number): Promise<Invoice | undefined> {
    throw new Error("Method not implemented.");
  }
  getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    throw new Error("Method not implemented.");
  }
  createWasteOperation(deliveryId: number, reason: string): Promise<InventoryOperation> {
    throw new Error("Method not implemented.");
  }
  createReturnToStockOperation(deliveryId: number, reason: string): Promise<InventoryOperation> {
    throw new Error("Method not implemented.");
  }
  getInvoicesByOrder(orderId: number): Promise<Invoice[]> {
    throw new Error("Method not implemented.");
  }
  getInvoicesFromDeliveryOperation(operationId: number): Promise<Invoice[]> {
    throw new Error("Method not implemented.");
  }
  createInvoiceFromDelivery(operationId: number, invoiceData?: Partial<InsertInvoice>): Promise<Invoice> {
    throw new Error("Method not implemented.");
  }
  generateInvoiceCode(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getAllPayments(): Promise<Payment[]> {
    throw new Error("Method not implemented.");
  }
  getPayment(id: number): Promise<Payment | undefined> {
    throw new Error("Method not implemented.");
  }
  getPaymentsByClient(clientId: number): Promise<Payment[]> {
    throw new Error("Method not implemented.");
  }
  getOutstandingPayments(): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getPaymentStatistics(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  createPayment(payment: InsertPayment): Promise<Payment> {
    throw new Error("Method not implemented.");
  }
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    throw new Error("Method not implemented.");
  }
  deletePayment(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

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
    return await db.select().from(articles).where(eq(articles.type, ArticleCategoryType.INGREDIENT as string)).orderBy(articles.name);
  }

  async getIngredient(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(and(eq(articles.id, id), eq(articles.type, ArticleCategoryType.INGREDIENT as string)));
    return article || undefined;
  }

  async createIngredient(insertArticle: Omit<InsertArticle, 'type'>): Promise<Article> {
    // Générer un code automatique pour les ingrédients
    const existingIngredients = await this.getAllIngredients();
    const nextNumber = existingIngredients.length + 1;
    const code = `${ArticlePrefix.INGREDIENT}-${nextNumber.toString().padStart(6, '0')}`;

    const articleData = {
      ...insertArticle,
      type: ArticleCategoryType.INGREDIENT as string,
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
        eq(articles.type, ArticleCategoryType.INGREDIENT as string),
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

  async getAllArticleCategories(type: ArticleCategoryType | undefined): Promise<ArticleCategory[]> {
    if (type) {
      return await db.select().from(articleCategories).where(eq(articleCategories.type, type as string));
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

  //************************* fonctions pour avoir stock (total stock, total stock dispo) d'un seul article ou plusieurs articles ou tous les articles, (total stock, dispo stock) ou detailed:(total stock/dispo par zone,lot)******* */
  async queryArticleStock<T extends boolean>(
    withDetails: T,
    articleIds?: number | number[],
    excludeDeliveryId?: number
  ): Promise<T extends true ? ArticleStockDetail[] : ArticleStockBase[]> {
    const result = await db.execute(sql`
    SELECT a.id, a.name, a.code, a.unit, a.photo,
           a.sale_price AS "unitPrice", a.is_perishable AS "isPerishable",
           COALESCE(SUM(s.quantity),0)::float8 AS "totalStock",
           COALESCE(SUM(s.quantity + COALESCE(sr_in.total_reserved,0) - COALESCE(sr_out.total_reserved,0)),0)::float8 AS "totalDispo"
           ${withDetails ? sql`, COALESCE(json_agg(json_build_object(
              'id', s.id,'storageZoneId', s.storage_zone_id,'lotId', s.lot_id,'quantity', s.quantity,
              'reservedQuantity', COALESCE(sr_out.total_reserved,0),
              'availableQuantity', s.quantity - COALESCE(sr_out.total_reserved,0),
              'storageZone', CASE WHEN sz.id IS NOT NULL THEN json_build_object('id',sz.id,'designation',sz.designation,'code',sz.code) END,
              'lot', CASE WHEN l.id IS NOT NULL THEN json_build_object('id',l.id,'code',l.code,'expirationDate',l.expiration_date) END
           )) FILTER (WHERE s.id IS NOT NULL),'[]') AS "stockInfo"` : sql``}
    FROM articles a
    LEFT JOIN stock s ON s.article_id=a.id
    LEFT JOIN storage_zones sz ON sz.id=s.storage_zone_id
    LEFT JOIN lots l ON l.id=s.lot_id
    LEFT JOIN (SELECT article_id,lot_id,storage_zone_id,SUM(reserved_quantity) total_reserved 
               FROM stock_reservations WHERE status=${StockReservationStatus.RESERVED} AND reservation_direction=${StockReservationDirection.IN} 
               GROUP BY article_id,lot_id,storage_zone_id) sr_in 
      ON sr_in.article_id=a.id AND sr_in.lot_id=s.lot_id AND sr_in.storage_zone_id=s.storage_zone_id
    LEFT JOIN (SELECT article_id,lot_id,storage_zone_id,SUM(reserved_quantity) total_reserved 
               FROM stock_reservations WHERE status=${StockReservationStatus.RESERVED} AND reservation_direction=${StockReservationDirection.OUT} 
               ${excludeDeliveryId ? sql`AND inventory_operation_id != ${excludeDeliveryId}` : sql``}
               GROUP BY article_id,lot_id,storage_zone_id) sr_out 
      ON sr_out.article_id=a.id AND sr_out.lot_id=s.lot_id AND sr_out.storage_zone_id=s.storage_zone_id
    WHERE a.active=true
    ${typeof articleIds === "number"
        ? sql`AND a.id=${articleIds}`
        : Array.isArray(articleIds) && articleIds.length > 0
          ? sql`AND a.id = ANY(${articleIds}::int[])`
          : sql``
      }
    GROUP BY a.id;
  `);

    return result.rows as unknown as (T extends true ? ArticleStockDetail[] : ArticleStockBase[]);
  }



  // Tous les articles
  async getAllAvailableArticlesStock(withDetails = false, excludeDeliveryId?: number): Promise<ArticleStockBase[] | ArticleStockDetail[]> {
    return this.queryArticleStock(withDetails, undefined, excludeDeliveryId);
  }

  // Un seul article
  async getArticleAvailableStock(articleId: number, withDetails = false): Promise<ArticleStockBase | ArticleStockDetail | null> {
    const rows = await this.queryArticleStock(withDetails, articleId);
    return rows[0] ?? null;
  }

  // Une sélection d'articles
  async getSelectedArticlesStock(articleIds: number[], withDetails = false): Promise<ArticleStockBase[] | ArticleStockDetail[]> {
    return this.queryArticleStock(withDetails, articleIds);
  }
  //*************************//*************************//*************************//*************************//*************************

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
    const code = `${TAX_CODE_PREFIX}-${nextNumber.toString().padStart(6, '0')}`;

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
    const code = `${PrefixInventoryOperationType[InventoryOperationType.LIVRAISON]}-${nextNumber.toString().padStart(6, '0')}`;

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
    const code = `${JOURNAL_CODE_PREFIX}-${nextNumber.toString().padStart(6, '0')}`;

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
    const code = `${ZONE_CODE_PREFIX}-${nextNumber.toString().padStart(6, '0')}`;

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
    const code = `${STATION_CODE_PREFIX}-${nextNumber.toString().padStart(6, '0')}`;

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
    const code = `${SUPPLIER_CODE_PREFIX}-${nextNumber.toString().padStart(6, '0')}`;

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
    const code = `${CLIENT_CODE_PREFIX}-${nextNumber.toString().padStart(6, '0')}`;

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
      .where(eq(orders.status, OrderStatus.CONFIRMED))
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
            articleCurrentStock: articles.currentStock,
            articleUnit: articles.unit,
          })
          .from(orderItems)
          .leftJoin(articles, eq(orderItems.articleId, articles.id))
          .where(and(
            eq(orderItems.orderId, order.id),
            eq(articles.type, ArticleCategoryType.PRODUCT) // Only products
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
                currentStock: item.articleCurrentStock,
                unit: item.articleUnit,
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
    const prefix = insertOrder.type === OrderType.QUOTE ? OrderPrefix.DEV : OrderPrefix.CMD;
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
      const prefix = insertOrder.type === OrderType.QUOTE ? OrderPrefix.DEV : OrderPrefix.CMD;
      const existingOrders = await tx.select().from(orders);
      const nextNumber = existingOrders.length + 1;
      const code = `${prefix}-${nextNumber.toString().padStart(6, "0")}`;
      // 2. Calculer la nouvelle position (dernière position + 1)
      const lastPosition = existingOrders.length > 0
        ? Math.max(...existingOrders.map(order => order.order ?? 0))
        : 0;
      const newPosition = lastPosition + 1;
      const [order] = await tx
        .insert(orders)
        .values({ ...insertOrder, code, order: newPosition })
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
    const foundOrders = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id));
    if (foundOrders[0]?.status != updateData.status) {
      updateData.statusDate = new Date().toISOString();
      if (updateData.status == OrderStatus.VALIDATED) {
        updateData.validatedAt = new Date().toISOString();
        // updateData.validatedBy = ...userId...when implementing user token...;
      }
    }

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
      type === InventoryOperationType.FABRICATION && includeReliquat
        ? sql`io.type IN (${InventoryOperationType.FABRICATION},${InventoryOperationType.FABRICATION_RELIQUAT} )`
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
      if (type === InventoryOperationType.FABRICATION && includeReliquat) {
        return sql`io.type IN (${InventoryOperationType.FABRICATION},${InventoryOperationType.FABRICATION_RELIQUAT} )`;
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
          AND io.type IN (${InventoryOperationType.FABRICATION},${InventoryOperationType.FABRICATION_RELIQUAT} )
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
          AND io.type = ${InventoryOperationType.LIVRAISON}
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


    const prefix = PrefixInventoryOperationType[insertOperation.type];
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



  // async createAccountingEntryFromOperation(operation: InventoryOperation): Promise<AccountingEntry | undefined> {
  //   if (operation.type === "reception" || operation.type === "livraison" || operation.type === "ajustement") {
  //     return await createAccountingEntryFromOperation(operation);
  //   }
  // }

  // Fonction de calcul du PMP (Prix Moyen Pondéré)
  private async calculateWeightedAveragePrice(
    tx: any,
    articleId: number,
    incomingQuantity: number,
    incomingUnitCost: number
  ): Promise<number> {
    // Récupérer l'article actuel
    const [article] = await tx.select().from(articles).where(eq(articles.id, articleId));
    if (!article) throw new Error(`Article ${articleId} not found`);

    const currentStock = parseFloat(article.currentStock || '0');
    const currentCostPerUnit = parseFloat(article.costPerUnit || '0');

    // Si stock nul, le PMP devient le prix d'entrée
    if (currentStock === 0) {
      return incomingUnitCost;
    }

    // Calcul PMP : (Stock_actuel × PMP_actuel + Quantité_entrante × Prix_entrant) / (Stock_actuel + Quantité_entrante)
    const totalCurrentValue = currentStock * currentCostPerUnit;
    const totalIncomingValue = incomingQuantity * incomingUnitCost;
    const newTotalStock = currentStock + incomingQuantity;

    return (totalCurrentValue + totalIncomingValue) / newTotalStock;
  }

  async updateInventoryOperationStatus(
    id: number,
    status: string,
    scheduledDate?: string
  ): Promise<InventoryOperation | undefined> {
    return await db.transaction(async (tx) => {
      const op = await tx.query.inventoryOperations.findFirst({
        where: (o, { eq }) => eq(o.id, id),
        with: { items: true }
      });
      if (!op) throw new Error("Operation not found");

      if (op.status === status) return op; // rien à faire

      // ---- Passage en completed ----
      if (status === InventoryOperationStatus.COMPLETED && op.status !== InventoryOperationStatus.COMPLETED) {
        for (const item of op.items) {
          const qty = Number(item.quantity) || 0;
          if (qty < 0) throw new Error(`Invalid qty for article ${item.articleId}`);

          // Sortie de stock (fromStorageZoneId)
          if (item.fromStorageZoneId) {
            await this.upsertStock(tx, item.articleId, item.fromStorageZoneId, -qty, item.lotId ?? null, item.serialNumber ?? null);

            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} - ${qty}` })
              .where(eq(articles.id, item.articleId));
          }

          // Entrée de stock (toStorageZoneId) - avec calcul PMP
          if (item.toStorageZoneId) {
            // Calculer le nouveau PMP pour les opérations d'achat et d'inventaire initial
            if ((op.type === InventoryOperationType.RECEPTION || op.type === 'inventaire_initiale') && item.unitCost && parseFloat(item.unitCost) > 0) {
              const newPMP = await this.calculateWeightedAveragePrice(
                tx,
                item.articleId,
                qty,
                parseFloat(item.unitCost)
              );

              // Mettre à jour le PMP de l'article
              await tx.update(articles)
                .set({ costPerUnit: newPMP.toFixed(2) })
                .where(eq(articles.id, item.articleId));
            }

            await this.upsertStock(tx, item.articleId, item.toStorageZoneId, qty, item.lotId ?? null, item.serialNumber ?? null);

            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} + ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
        }
      }

      // ---- Passage en cancelled ----
      if (status === InventoryOperationStatus.CANCELLED && op.status === InventoryOperationStatus.COMPLETED) {
        for (const item of op.items) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;

          // rollback entrée
          if (item.toStorageZoneId) {
            await this.upsertStock(tx, item.articleId, item.toStorageZoneId, -qty, item.lotId ?? null, item.serialNumber ?? null);

            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} - ${qty}` })
              .where(eq(articles.id, item.articleId));
          }

          // rollback sortie
          if (item.fromStorageZoneId) {
            await this.upsertStock(tx, item.articleId, item.fromStorageZoneId, qty, item.lotId ?? null, item.serialNumber ?? null);

            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} + ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
        }
      }

      // ---- Mettre à jour le statut ----
      const updateData: any = { status, updatedAt: new Date().toISOString() };
      if (scheduledDate) {
        updateData.scheduledDate = scheduledDate;
      }

      const [newOp] = await tx.update(inventoryOperations)
        .set(updateData)
        .where(eq(inventoryOperations.id, id))
        .returning();

      return newOp;
    });
  }

  async updateInventoryOperation(id: number, updateData: Partial<InsertInventoryOperation>): Promise<InventoryOperation | undefined> {

    return await db.transaction(async (tx) => {
      try {
        // Récupérer l'opération actuelle avec ses items
        const currentOperation = await tx.query.inventoryOperations.findFirst({
          where: (o, { eq }) => eq(o.id, id),
          with: { items: true }
        });

        if (!currentOperation) {
          return undefined;
        }

        // Mettre à jour l'opération
        const [operation] = await tx.update(inventoryOperations)
          .set({ ...updateData, updatedAt: new Date().toISOString() })
          .where(eq(inventoryOperations.id, id))
          .returning();

        if (!operation) {
          return undefined;
        }

        // Si scheduledDate est définie et que l'opération devient "programmed"
        if (updateData.scheduledDate && operation.status === InventoryOperationStatus.PROGRAMMED) {
          // Libérer d'abord les anciennes réservations si elles existent
          await tx.update(stockReservations)
            .set({ status: InventoryOperationStatus.CANCELLED })
            .where(eq(stockReservations.inventoryOperationId, id));

          // Créer de nouvelles réservations pour les ingrédients
          if (currentOperation.items && currentOperation.items.length > 0) {
            // Only process items with positive quantities == new product
            for (const item of currentOperation.items.filter(f => f.quantity && parseFloat(f.quantity) >= 0)) {
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
                  inventoryOperationId: id,
                  reservedQuantity: requiredQuantity.toString(),
                  reservationType: StockReservationType.PRODUCTION as const,
                  reservationDirection: StockReservationDirection.OUT,
                  stateChangedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  notes: `Réservation pour préparation ${id} - Produit: ${article.name}`,
                });
              }
            }
          }
        }
        // Si l'opération n'est plus "programmed", libérer les réservations
        else if (updateData.status && updateData.status !== InventoryOperationStatus.PROGRAMMED && currentOperation.status === InventoryOperationStatus.PROGRAMMED) {
          await tx.update(stockReservations)
            .set({ status: InventoryOperationStatus.CANCELLED })
            .where(eq(stockReservations.inventoryOperationId, id));
        }

        return operation;
      } catch (error) {
        tx.rollback();
        throw error;
      }
    });


  }

  // Fonction pour convertir les coûts entre unités
  private convertCost(cost: number, fromUnit: string, toUnit: string): number {
    return cost;
  }

  // Fonction utilitaire pour upsert le stock sans contrainte unique
  private async upsertStock(
    tx: any,
    articleId: number,
    storageZoneId: number,
    quantity: number,
    lotId?: number | null,
    serialNumber?: string | null
  ): Promise<void> {
    const existingStock = await tx.query.stock.findFirst({
      where: and(
        eq(stock.articleId, articleId),
        eq(stock.storageZoneId, storageZoneId),
        lotId ? eq(stock.lotId, lotId) : sql`${stock.lotId} IS NULL`,
        serialNumber ? eq(stock.serialNumber, serialNumber) : sql`${stock.serialNumber} IS NULL`
      )
    });

    if (existingStock) {
      // Update existing stock record
      await tx.update(stock)
        .set({
          quantity: sql`${stock.quantity} + ${quantity}`,
          updatedAt: sql`now()`
        })
        .where(
          and(
            eq(stock.articleId, articleId),
            eq(stock.storageZoneId, storageZoneId),
            lotId ? eq(stock.lotId, lotId) : sql`${stock.lotId} IS NULL`,
            serialNumber ? eq(stock.serialNumber, serialNumber) : sql`${stock.serialNumber} IS NULL`
          )
        );
    } else {
      // Insert new stock record
      await tx.insert(stock).values({
        articleId: articleId,
        storageZoneId: storageZoneId,
        lotId: lotId ?? null,
        serialNumber: serialNumber ?? null,
        quantity: quantity.toString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Fonction récursive pour calculer le coût d'un sous-produit
  private async calculateSubProductCost(ingredients: any[], subProductQuantity: number): Promise<number> {
    let totalCost = 0;

    for (const ingredient of ingredients) {
      const article = await this.getArticle(ingredient.articleId);
      if (!article) continue;

      const subIngredientQuantity = parseFloat(ingredient.quantity || '0');
      const adjustedQuantity = subIngredientQuantity * subProductQuantity;

      if (article.type === ArticleCategoryType.PRODUCT) {
        // Si c'est un sous-sous-produit, calculer récursivement son coût
        const subRecipe = await this.getRecipeByArticleId(article.id);
        if (subRecipe) {
          const subIngredients = await this.getRecipeIngredients(subRecipe.id);
          const subSubProductCost = await this.calculateSubProductCost(subIngredients, adjustedQuantity);
          totalCost += subSubProductCost;
        }
      } else {
        // Pour un ingrédient normal, convertir le coût selon les unités
        const subArticleCost = parseFloat(article.costPerUnit || '0');
        const convertedCost = this.convertCost(subArticleCost, article.unit || DEFAULT_ARTICLE_UNIT, ingredient.unit || DEFAULT_ARTICLE_UNIT);
        const ingredientCost = convertedCost * adjustedQuantity;
        totalCost += ingredientCost;
      }
    }

    return totalCost;
  }

  // Fonction pour calculer le coût total d'une recette (récursivement)
  private async calculateTotalRecipeCost(ingredients: any[]): Promise<number> {
    let totalCost = 0;

    for (const ingredient of ingredients) {
      const article = await this.getArticle(ingredient.articleId);
      if (!article) continue;

      if (article.type === ArticleCategoryType.PRODUCT) {
        // Pour un sous-produit, calculer le coût basé sur ses ingrédients (récursivement)
        const subRecipe = await this.getRecipeByArticleId(article.id);
        if (subRecipe) {
          const subIngredients = await this.getRecipeIngredients(subRecipe.id);
          const subProductQuantity = parseFloat(ingredient.quantity || '0');
          const subProductCost = await this.calculateSubProductCost(subIngredients, subProductQuantity);
          totalCost += subProductCost;
        }
      } else {
        // Pour un ingrédient normal, convertir le coût selon l'unité de la recette
        const originalCost = parseFloat(article.costPerUnit || '0');
        const unitCost = this.convertCost(originalCost, article.unit || DEFAULT_ARTICLE_UNIT, ingredient.unit || DEFAULT_ARTICLE_UNIT);
        const ingredientCost = unitCost * parseFloat(ingredient.quantity || '0');
        totalCost += ingredientCost;
      }
    }

    return totalCost;
  }

  async calculateIngredientConsumptionItems(productItem: any): Promise<{ items: any[], totalCost: number, quantityAfter: string, quantityBefore: string }> {
    try {
      const RETURN_EMPTY = { items: [], totalCost: 0, quantityAfter: "0", quantityBefore: "0" };

      const article = await this.getArticle(productItem.articleId);
      if (!article) {
        console.log('❌ Article not found:', productItem.articleId);
        return RETURN_EMPTY;
      }
      console.log('✅ Article found:', article.name);

      // Find the recipe for this product
      const recipe = await this.getRecipeByArticleId(article.id);
      if (!recipe) {
        console.log('❌ Recipe not found for article:', article.id);
        return RETURN_EMPTY;
      }
      console.log('✅ Recipe found:', recipe.id);

      // Get recipe ingredients
      const recipeIngredients = await this.getRecipeIngredients(recipe.id);
      console.log('✅ Recipe ingredients found:', recipeIngredients.length);

      // Calculate consumption based on planned quantity
      const plannedQuantity = parseFloat(productItem.quantity || '0');
      const recipeQuantity = parseFloat(recipe.quantity || '1');
      const ratio = plannedQuantity / recipeQuantity;

      const ingredientItems: any[] = [];

      // Create inventory operation items for each ingredient
      for (const ingredient of recipeIngredients) {
        const ingredientArticle = await this.getArticle(ingredient.articleId);
        if (!ingredientArticle) continue;

        const requiredQuantity = parseFloat(ingredient.quantity || '0') * ratio;
        const currentStock = parseFloat(ingredientArticle.currentStock || '0');

        // Calculer le coût unitaire récursivement
        let unitCost = 0;
        if (ingredientArticle.type === ArticleCategoryType.PRODUCT) {
          // Pour un sous-produit, calculer le coût basé sur ses ingrédients (récursivement)
          const subRecipe = await this.getRecipeByArticleId(ingredientArticle.id);
          if (subRecipe) {
            const subIngredients = await this.getRecipeIngredients(subRecipe.id);
            const subProductQuantity = parseFloat(ingredient.quantity || '0');
            const subProductCost = await this.calculateSubProductCost(subIngredients, subProductQuantity);
            unitCost = subProductCost / subProductQuantity; // Coût unitaire
          }
        } else {
          // Pour un ingrédient normal, convertir le coût selon l'unité de la recette
          const originalCost = parseFloat(ingredientArticle.costPerUnit || '0');
          unitCost = this.convertCost(originalCost, ingredientArticle.unit || DEFAULT_ARTICLE_UNIT, ingredient.unit || DEFAULT_ARTICLE_UNIT);
        }

        console.log(`🔍 Processing ingredient: ${ingredientArticle.name}, required: ${requiredQuantity}, unitCost: ${unitCost}`);

        // Create negative quantity item for consumption (without operationId - will be set later)
        ingredientItems.push({
          articleId: ingredientArticle.id,
          quantity: (-requiredQuantity).toString(), // Negative quantity for consumption
          quantityBefore: currentStock.toString(),
          quantityAfter: (currentStock - requiredQuantity).toString(),
          unitCost: unitCost.toString(),
          totalCost: (unitCost * requiredQuantity).toString(),
          notes: `Consommation pour préparation - ${article.name}`,
          fromStorageZoneId: null, // Will be determined by stock availability
          toStorageZoneId: null,
        });
      }
      const totalCost = ingredientItems.map(f => parseFloat(f.totalCost || "0")).reduce((a, b) => a + b);
      const quantityBefore = article.currentStock?.toString() || "0";
      const quantityAfter = (parseFloat(productItem.quantityBefore || "0") + parseFloat(productItem.quantity || "0")).toString();
      return { items: ingredientItems, totalCost: totalCost, quantityBefore: quantityBefore, quantityAfter: quantityAfter };
    } catch (error) {
      console.error('❌ Error in calculateIngredientConsumptionItems:', error);
      throw error;
    }
  }

  async createIngredientConsumptionItems(operationId: number, productItem: any): Promise<void> {
    try {
      console.log('🔍 createIngredientConsumptionItems - operationId:', operationId, 'productItem:', productItem);

      const article = await this.getArticle(productItem.articleId);
      if (!article) {
        console.log('❌ Article not found:', productItem.articleId);
        return;
      }
      console.log('✅ Article found:', article.name);

      // Find the recipe for this product
      const recipe = await this.getRecipeByArticleId(article.id);
      if (!recipe) {
        console.log('❌ Recipe not found for article:', article.id);
        return;
      }
      console.log('✅ Recipe found:', recipe.id);

      // Get recipe ingredients
      const recipeIngredients = await this.getRecipeIngredients(recipe.id);
      console.log('✅ Recipe ingredients found:', recipeIngredients.length);

      // Calculate consumption based on planned quantity
      const plannedQuantity = parseFloat(productItem.quantity || '0');
      const recipeQuantity = parseFloat(recipe.quantity || '1');
      const ratio = plannedQuantity / recipeQuantity;

      // Create inventory operation items for each ingredient
      for (const ingredient of recipeIngredients) {
        const ingredientArticle = await this.getArticle(ingredient.articleId);
        if (!ingredientArticle) continue;

        const requiredQuantity = parseFloat(ingredient.quantity || '0') * ratio;
        const currentStock = parseFloat(ingredientArticle.currentStock || '0');
        const unitCost = parseFloat(ingredientArticle.costPerUnit || '0');

        console.log(`🔍 Processing ingredient: ${ingredientArticle.name}, required: ${requiredQuantity}`);

        // Create negative quantity item for consumption
        await db.insert(inventoryOperationItems).values({
          articleId: ingredientArticle.id,
          quantity: (-requiredQuantity).toString(), // Negative quantity for consumption
          quantityBefore: currentStock.toString(),
          quantityAfter: (currentStock - requiredQuantity).toString(),
          unitCost: unitCost.toString(),
          operationId: operationId,
          notes: `Consommation pour préparation - ${article.name}`,
          fromStorageZoneId: null, // Will be determined by stock availability
          toStorageZoneId: null,
        });

        // Find the actual storage zone where the ingredient is stored
        const stockLocation = await db.query.stock.findFirst({
          where: and(
            eq(stock.articleId, ingredientArticle.id),
            gt(stock.quantity, 0)
          ),
          orderBy: [desc(stock.updatedAt)]
        });

        const storageZoneId = stockLocation?.storageZoneId || ingredientArticle.storageZoneId || 1;

        // Update stock (consume ingredients)
        await this.upsertStock(db, ingredientArticle.id, storageZoneId, -requiredQuantity);

        // Update article current stock
        await db.update(articles)
          .set({
            currentStock: sql`${articles.currentStock} - ${requiredQuantity}`
          })
          .where(eq(articles.id, ingredientArticle.id));
      }

      console.log('✅ createIngredientConsumptionItems completed successfully');
    } catch (error) {
      console.error('❌ Error in createIngredientConsumptionItems:', error);
      throw error;
    }
  }

  async updateStockFromOperationItems(operationId: number, conformQuantity: number, preparationZoneId?: number, wasteZoneId?: number, lotId?: number): Promise<void> {
    return await db.transaction(async (tx) => {
      try {
        // Get all operation items
        const items = await this.getInventoryOperationItems(operationId);

        // Calculate the ratio between conform quantity and planned quantity
        const principalProduct = items.find(item => parseFloat(item.quantity || '0') >= 0);

        // Update stock for each item
        for (const item of items) {
          const article = await this.getArticle(item.articleId);
          if (!article) continue;
          if (item.id === principalProduct?.id) {

            await this.upsertStock(tx, article.id, preparationZoneId!, conformQuantity, lotId);
            await tx.update(articles)
              .set({
                currentStock: sql`${articles.currentStock} + ${conformQuantity}`
              })
              .where(eq(articles.id, article.id));

            await tx.update(inventoryOperationItems)
              .set({
                toStorageZoneId: preparationZoneId,
                lotId: lotId
              })
              .where(
                and(
                  eq(inventoryOperationItems.id, item.id),
                  eq(inventoryOperationItems.articleId, item.articleId)));

          } else {

            await this.upsertStock(tx, article.id, preparationZoneId!, parseFloat(item.quantity || '0'));
            await tx.update(articles)
              .set({
                currentStock: sql`${articles.currentStock} + ${parseFloat(item.quantity || '0')}`
              })
              .where(eq(articles.id, article.id));
          }


          // if (totalPlanned > 0) {
          //   // Positive quantity = product production -> use preparation zone
          //   storageZoneId = preparationZoneId || item.toStorageZoneId || article.storageZoneId || 1;
          // } else {
          //   // Negative quantity = ingredient consumption -> find actual storage location
          //   const stockLocation = await tx.query.stock.findFirst({
          //     where: and(
          //       eq(stock.articleId, article.id),
          //       gt(stock.quantity, 0)
          //     ),
          //     orderBy: [desc(stock.updatedAt)]
          //   });
          //   storageZoneId = stockLocation?.storageZoneId || item.fromStorageZoneId || article.storageZoneId || 1;
          // }


          // Update the inventory operation item with the new storage zone for products
          // if (totalPlanned > 0 && preparationZoneId) {
          //   await tx.update(inventoryOperationItems)
          //     .set({ toStorageZoneId: preparationZoneId })
          //     .where(eq(inventoryOperationItems.id, item.id));
          // }
        }

        console.log('✅ updateStockFromOperationItems completed successfully');
      } catch (error) {
        tx.rollback();
        throw error;
      }
    });
  }

  async createLotForPreparationOperation(operationId: number, totalProducedQuantity: number, manufacturingDate: string): Promise<number | undefined> {
    return await db.transaction(async (tx) => {
      try {
        // Get the operation and its items
        const operation = await this.getInventoryOperation(operationId);
        if (!operation) {
          throw new Error(`Operation ${operationId} not found`);
        }

        // Find the main product (positive quantity)
        const items = await this.getInventoryOperationItems(operationId);
        const mainProductItem = items.find(item => parseFloat(item.quantity || '0') > 0);

        if (!mainProductItem) {
          console.log('No main product found for lot creation');
          return;
        }

        const article = await this.getArticle(mainProductItem.articleId);
        if (!article) {
          throw new Error(`Article ${mainProductItem.articleId} not found`);
        }

        // Generate lot code: {ArticleCode}-{yyyyMMdd}-{seq}
        const today = new Date(manufacturingDate);
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        // Get the next sequence number for this article and date
        const existingLots = await tx.query.lots.findMany({
          where: and(
            eq(lots.articleId, article.id),
            sql`DATE(${lots.manufacturingDate}) = DATE(${sql.raw(`'${manufacturingDate}'`)})`
          ),
          orderBy: [desc(lots.id)]
        });

        const nextSeq = (existingLots.length + 1).toString().padStart(3, '0');
        const lotCode = `${article.code}-${dateStr}-${nextSeq}`;

        // Calculate dates based on article shelf life
        const shelfLifeDays = article.shelfLife || 0;
        const manufacturingDateObj = new Date(manufacturingDate);
        const useDate = new Date(manufacturingDateObj);
        useDate.setDate(useDate.getDate() + shelfLifeDays);

        const expirationDate = new Date(useDate);
        const alertDate = new Date(expirationDate);
        alertDate.setDate(alertDate.getDate() - 3);

        // Create the lot
        const lotData = {
          articleId: article.id,
          code: lotCode,
          manufacturingDate: manufacturingDate,
          useDate: useDate.toISOString(),
          expirationDate: expirationDate.toISOString(),
          alertDate: alertDate.toISOString(),
          supplierId: null, // Internal production
          notes: "Lot généré automatiquement via production"
        };

        const [newLot] = await tx.insert(lots).values(lotData).returning();


        console.log(`✅ Lot created successfully: ${lotCode} for operation ${operationId}`);
        return newLot.id;
      } catch (error) {
        console.error('❌ Error creating lot for preparation operation:', error);
        throw error;
      }
    });
  }


  async createProductProductionItems(operationId: number, conformQuantity: number): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get the original product items from the operation
      const items = await this.getInventoryOperationItems(operationId);
      const productItems = items.filter(item => parseFloat(item.quantity || '0') > 0); // Only positive quantities (products)

      for (const item of productItems) {
        const article = await this.getArticle(item.articleId);
        if (!article) continue;

        const currentStock = parseFloat(article.currentStock || '0');
        const unitCost = parseFloat(article.costPerUnit || '0');

        // Create positive quantity item for production
        await tx.insert(inventoryOperationItems).values({
          articleId: article.id,
          quantity: conformQuantity.toString(), // Positive quantity for production
          quantityBefore: currentStock.toString(),
          quantityAfter: (currentStock + conformQuantity).toString(),
          unitCost: unitCost.toString(),
          operationId: operationId,
          notes: `Production terminée - Quantité conforme: ${conformQuantity}`,
          fromStorageZoneId: null,
          toStorageZoneId: item.toStorageZoneId || 1, // Use the target storage zone
        });

        // Determine the target storage zone
        const targetStorageZoneId = item.toStorageZoneId || article.storageZoneId || 1;

        // Update stock (add produced products)
        await this.upsertStock(tx, article.id, targetStorageZoneId, conformQuantity);

        // Update article current stock
        await tx.update(articles)
          .set({
            currentStock: sql`${articles.currentStock} + ${conformQuantity}`
          })
          .where(eq(articles.id, article.id));
      }
    });
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
          articleId: (item as any).articleId || (item as any).idArticle,
          quantity: (item as any).quantity || (item as any).qteLivree,
          lotId: (item as any).lotId || (item as any).idlot || null,
          fromStorageZoneId: (item as any).fromStorageZoneId || (item as any).idzone || null,
          toStorageZoneId: (item as any).toStorageZoneId || null,
          orderItemId: (item as any).orderItemId || (item as any).idOrderItem || null,
          notes: (item as any).notes || null,
          operationId: operationId
        }));
        await tx.insert(inventoryOperationItems).values(itemsToInsert);
      }

      // Gérer les réservations automatiquement
      if (operation.type === InventoryOperationType.LIVRAISON) {
        // Annuler seulement les réservations de cette livraison spécifique
        await tx.update(stockReservations)
          .set({ status: StockReservationStatus.CANCELLED })
          .where(and(
            eq(stockReservations.inventoryOperationId, operationId),
            eq(stockReservations.reservationType, StockReservationType.DELIVERY),
            eq(stockReservations.status, StockReservationStatus.RESERVED)
          ));

        if (updatedItems.length > 0) {
          for (const item of updatedItems) {
            const articleId = (item as any).articleId || (item as any).idArticle;
            const article = await this.getArticle(articleId);
            if (!article) continue;

            const totalStock = parseFloat(article.currentStock || '0');
            const requestedQuantity = parseFloat(((item as any).quantity || (item as any).qteLivree) as string);

            // Calculer les réservations actives EXCLUANT cette livraison
            const activeReservations = await tx.select({ reservedQuantity: stockReservations.reservedQuantity })
              .from(stockReservations)
              .where(and(
                eq(stockReservations.articleId, articleId),
                eq(stockReservations.status, StockReservationStatus.RESERVED),
                // Exclure cette livraison du calcul
                sql`${stockReservations.inventoryOperationId} != ${operationId}`
              ));

            const totalReserved = activeReservations.reduce((sum, r) => sum + parseFloat(r.reservedQuantity || '0'), 0);
            const availableStock = totalStock - totalReserved;

            if (availableStock < requestedQuantity) {
              throw new Error(`Stock insuffisant pour l'article ${articleId}. Disponible: ${availableStock}, Requis: ${requestedQuantity}`);
            }

            await tx.insert(stockReservations).values({
              articleId: articleId,
              inventoryOperationId: operationId,
              orderItemId: (item as any).orderItemId || (item as any).idOrderItem || null,
              lotId: (item as any).lotId || (item as any).idlot || null,
              storageZoneId: (item as any).fromStorageZoneId || (item as any).idzone || null,
              reservedQuantity: requestedQuantity.toString(),
              status: StockReservationStatus.RESERVED,
              reservationDirection: StockReservationDirection.OUT,
              stateChangedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              reservationType: StockReservationType.DELIVERY,
              notes: `Réservation après mise à jour livraison ${operationId}`,
            });
          }
        }
      } else if (operation.type === InventoryOperationType.FABRICATION || operation.type === InventoryOperationType.FABRICATION_RELIQUAT) {
        // Si le statut devient "programmed", créer les réservations
        if (operation.status === InventoryOperationStatus.PROGRAMMED && currentOperation.status !== InventoryOperationStatus.PROGRAMMED) {
          // Libérer d'abord les anciennes réservations si elles existent
          await tx.update(stockReservations)
            .set({ status: StockReservationStatus.CANCELLED })
            .where(eq(stockReservations.inventoryOperationId, operationId));

          // Créer de nouvelles réservations pour les nouveaux items
          if (updatedItems.length > 0) {
            // Only process items with positive quantities == new product
            for (const item of updatedItems.filter(f => f.quantity && parseFloat(f.quantity) >= 0)) {
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
                  reservationDirection: StockReservationDirection.OUT as const,
                  inventoryOperationId: operationId,
                  reservedQuantity: requiredQuantity.toString(),
                  reservationType: InventoryOperationType.FABRICATION as const,
                  notes: `Réservation pour préparation ${operationId} - Produit: ${article.name}`,
                });
              }
            }
          }
        }
        // Si le statut reste "programmed" mais que les items changent, rafraîchir les réservations
        else if (operation.status === InventoryOperationStatus.PROGRAMMED && currentOperation.status === InventoryOperationStatus.PROGRAMMED) {
          // Libérer d'abord les anciennes réservations
          await tx.update(stockReservations)
            .set({ status: StockReservationStatus.CANCELLED })
            .where(eq(stockReservations.inventoryOperationId, operationId));

          // Créer de nouvelles réservations basées sur les nouveaux items
          if (updatedItems.length > 0) {
            // Only process items with positive quantities == new product
            for (const item of updatedItems.filter(f => f.quantity && parseFloat(f.quantity) >= 0)) {
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
                  reservationDirection: StockReservationDirection.OUT as const,
                  inventoryOperationId: operationId,
                  reservedQuantity: requiredQuantity.toString(),
                  reservationType: StockReservationType.PRODUCTION as const,
                  notes: `Réservation pour préparation ${operationId} - Produit: ${article.name}`,
                });
              }
            }
          }
        }
        // Si le statut n'est plus "programmed", libérer les réservations
        else if (operation.status !== InventoryOperationStatus.PROGRAMMED && currentOperation.status === InventoryOperationStatus.PROGRAMMED) {
          await tx.update(stockReservations)
            .set({ status: StockReservationStatus.CANCELLED })
            .where(eq(stockReservations.inventoryOperationId, operationId));
        }
      }
      // Gérer les réservations pour les livraisons
      else if (operation.type === InventoryOperationType.LIVRAISON) {
        // Libérer d'abord les anciennes réservations de type StockReservationType.DELIVERY
        await tx.update(stockReservations)
          .set({ status: StockReservationStatus.CANCELLED })
          .where(and(
            eq(stockReservations.inventoryOperationId, operationId),
            eq(stockReservations.reservationType, StockReservationType.DELIVERY)
          ));

        // Créer de nouvelles réservations pour les items de livraison
        if (updatedItems.length > 0) {
          for (const item of updatedItems) {
            await tx.insert(stockReservations).values({
              articleId: item.articleId,
              inventoryOperationId: operationId,
              lotId: item.lotId || null,
              storageZoneId: item.toStorageZoneId || null,
              orderItemId: item.orderItemId || null,
              reservedQuantity: item.quantity || '0',
              reservationType: StockReservationType.DELIVERY as const,
              reservationDirection: StockReservationDirection.OUT as const,
              status: StockReservationStatus.RESERVED as const,
              notes: `Réservation pour livraison ${operationId}`,
              createdAt: new Date().toISOString()
            });
          }
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
      if (op.status === InventoryOperationStatus.COMPLETED && op.type === InventoryOperationType.RECEPTION) {
        for (const item of op.items) {
          const qty = Number(item.quantity) || 0;

          if (qty > 0) {
            if (!item.toStorageZoneId) {
              throw new Error(`Missing storage zone for article ${item.articleId}`);
            }

            // Retirer du stock
            await this.upsertStock(tx, item.articleId, item.toStorageZoneId, -qty, item.lotId ?? null, item.serialNumber ?? null);

            // Mettre à jour le stock actuel de l'article
            await tx.update(articles)
              .set({ currentStock: sql`${articles.currentStock} - ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
        }
      }

      // Libérer d'abord toutes les réservations liées à cette opération
      await tx.update(stockReservations)
        .set({ status: StockReservationStatus.CANCELLED })
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
    const existingOps = await this.getInventoryOperationsByType(InventoryOperationType.RECEPTION);
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
      .set({ status: StockReservationStatus.CANCELLED })
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
          reservationType: StockReservationType.PRODUCTION as const,
          reservationDirection: StockReservationDirection.OUT as const,
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
      .set({ status: StockReservationStatus.CANCELLED })
      .where(eq(stockReservations.inventoryOperationId, operationId));

    return (result.rowCount || 0) > 0;
  }

  // Obtenir les réservations d'une opération d'inventaire
  async getReservationsForOperation(operationId: number): Promise<StockReservation[]> {
    return await db.select()
      .from(stockReservations)
      .where(eq(stockReservations.inventoryOperationId, operationId));
  }

  // Obtenir toutes les réservations des articles d'une opération (en excluant les réservations de l'opération elle-même)
  async getOtherReservationsForOperationArticles(operationId: number): Promise<StockReservation[]> {
    return await db.transaction(async (tx) => {
      // Récupérer les articles de l'opération
      const operationItems = await tx.select()
        .from(inventoryOperationItems)
        .where(eq(inventoryOperationItems.operationId, operationId));

      if (operationItems.length === 0) {
        return [];
      }

      // Extraire les IDs des articles
      const articleIds = operationItems.map(item => item.articleId);

      // Récupérer toutes les réservations de ces articles, sauf celles de l'opération en cours
      const reservations = await tx.select()
        .from(stockReservations)
        .where(
          and(
            sql`${stockReservations.articleId} = ANY(${articleIds})`,
            sql`${stockReservations.inventoryOperationId} != ${operationId}`,
            eq(stockReservations.status, StockReservationStatus.RESERVED)
          )
        );

      return reservations;
    });
  }



  // Obtenir les réservations d'un article
  async getArticleReservations(articleId: number): Promise<StockReservation[]> {
    const reservations = await db.select()
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.articleId, articleId),
          eq(stockReservations.status, StockReservationStatus.RESERVED)
        )
      )
      .orderBy(desc(stockReservations.createdAt));

    return reservations;
  }

  // Calculer le stock disponible (stock total - réservations)
  // async getAvailableStock(articleId: number): Promise<number> {
  //   const article = await this.getArticle(articleId);
  //   if (!article) return 0;

  //   const totalStock = parseFloat(article.currentStock || '0');

  //   // Calculer les réservations actives
  //   const reservations = await this.getArticleReservations(articleId);
  //   const reservedQuantity = reservations.reduce((sum, res) =>
  //     sum + parseFloat(res.reservedQuantity), 0
  //   );

  //   return Math.max(0, totalStock - reservedQuantity);
  // }

  // Vérifier si un article a suffisamment de stock disponible pour une quantité donnée
  async hasEnoughAvailableStock(articleId: number, requiredQuantity: number): Promise<boolean> {
    const availableStock = await this.getArticleAvailableStock(articleId);
    const availableArticle = availableStock?.totalDispo || 0;
    return availableArticle >= requiredQuantity;
  }

  // Obtenir le détail complet de la disponibilité d'un article
  async getArticleStockDetails(articleId: number): Promise<{
    totalStock: number;
    reservedQuantity: number;
    availableStock: number;
    reservations: StockReservation[];
  }> {
    const article = await this.getArticle(articleId);
    if (!article) {
      return {
        totalStock: 0,
        reservedQuantity: 0,
        availableStock: 0,
        reservations: []
      };
    }

    const totalStock = parseFloat(article.currentStock || '0');
    const reservations = await this.getArticleReservations(articleId);

    const reservedQuantity = reservations.reduce((sum, res) =>
      sum + parseFloat(res.reservedQuantity), 0
    );

    const availableStock = Math.max(0, totalStock - reservedQuantity);

    return {
      totalStock,
      reservedQuantity,
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
      const availableStock = await this.getArticleAvailableStock(ingredient.articleId);
      const availableArticle = availableStock?.totalDispo || 0;
      // Compter les réservations pour cet ingrédient
      const reservations = await this.getArticleReservations(ingredient.articleId);
      const reservedQuantity = reservations.reduce((sum, res) => sum + parseFloat(res.reservedQuantity), 0);

      totalReservations += reservedQuantity;

      if (availableArticle < requiredQuantity) {
        allAvailable = false;
        missingIngredients.push({
          articleId: ingredient.articleId,
          articleName: ingredientArticle.name,
          requiredQuantity,
          availableStock: availableArticle,
          shortfall: requiredQuantity - availableArticle
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


  /**
   * Valide une livraison : déduit le stock, met à jour le statut de l'opération et des réservations
   * @param {number} deliveryOperationId
   * @returns {Promise<InventoryOperation>}
   */
  async validateDelivery(deliveryOperationId: number): Promise<InventoryOperation> {
    return await db.transaction(async (tx) => {
      // 1. Récupérer l'opération et vérifier sa validité
      const [operation] = await tx.select().from(inventoryOperations).where(eq(inventoryOperations.id, deliveryOperationId));
      if (!operation) throw new Error(`Opération ${deliveryOperationId} non trouvée`);
      if (operation.type !== InventoryOperationType.LIVRAISON) throw new Error(`L'opération ${deliveryOperationId} n'est pas une livraison`);
      if (operation.isValidated) throw new Error(`Livraison ${deliveryOperationId} déjà validée`);

      // 2. Récupérer les items de l'opération pour vérification
      const operationItems = await tx.select().from(inventoryOperationItems)
        .where(eq(inventoryOperationItems.operationId, deliveryOperationId));
      if (operationItems.length === 0) throw new Error(`Aucun item trouvé pour l'opération ${deliveryOperationId}`);

      // 3. Récupérer les réservations de type StockReservationType.DELIVERY pour cette opération
      const reservations = await tx.select().from(stockReservations)
        .where(and(
          eq(stockReservations.inventoryOperationId, deliveryOperationId),
          eq(stockReservations.reservationType, StockReservationType.DELIVERY),
          eq(stockReservations.status, StockReservationStatus.RESERVED)
        ));
      if (reservations.length === 0) throw new Error(`Aucune réservation de stock trouvée pour cette livraison`);

      // 4. Vérifier la cohérence entre les items et les réservations
      const itemsByArticle = new Map<number, number>();
      operationItems.forEach(item => {
        const current = itemsByArticle.get(item.articleId) || 0;
        itemsByArticle.set(item.articleId, current + parseFloat(item.quantity));
      });

      const reservationsByArticle = new Map<number, number>();
      reservations.forEach(res => {
        const current = reservationsByArticle.get(res.articleId) || 0;
        reservationsByArticle.set(res.articleId, current + parseFloat(res.reservedQuantity));
      });

      // Vérifier que chaque article a une réservation correspondante
      for (const [articleId, itemQuantity] of itemsByArticle) {
        const reservedQuantity = reservationsByArticle.get(articleId) || 0;
        if (Math.abs(itemQuantity - reservedQuantity) > 0.001) {
          throw new Error(`Incohérence pour l'article ${articleId}: items=${itemQuantity}, réservations=${reservedQuantity}`);
        }
      }

      // 5. Vérifier le stock et déduire pour chaque réservation
      for (const res of reservations) {
        // Récupérer le stock courant (par article, lot, zone)
        const stockRow = await tx.select().from(stock)
          .where(and(
            eq(stock.articleId, res.articleId),
            eq(stock.storageZoneId, res.storageZoneId!),
            res.lotId ? eq(stock.lotId, res.lotId) : sql`1=1`
          ))
          .limit(1);

        if (!stockRow[0]) {
          throw new Error(`Stock introuvable pour l'article ${res.articleId} (zone ${res.storageZoneId}, lot ${res.lotId || 'aucun'})`);
        }

        const available = parseFloat(stockRow[0].quantity);
        const reserved = parseFloat(res.reservedQuantity);

        if (available < reserved) {
          throw new Error(`Stock insuffisant pour l'article ${res.articleId} (zone ${res.storageZoneId}, lot ${res.lotId || 'aucun'}). Disponible: ${available}, Requis: ${reserved}`);
        }

        // Déduire le stock
        await tx.update(stock)
          .set({
            quantity: (available - reserved).toString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(stock.id, stockRow[0].id));

        // Mettre à jour la réservation avec tous les champs nécessaires
        await tx.update(stockReservations)
          .set({
            status: StockReservationStatus.COMPLETED,
            stateChangedAt: new Date().toISOString(),
            notes: `Livraison validée le ${new Date().toISOString()}`
          })
          .where(eq(stockReservations.id, res.id));
      }

      // 6. Mettre à jour l'opération comme validée
      const [updatedOp] = await tx.update(inventoryOperations)
        .set({
          isValidated: true,
          validatedAt: new Date().toISOString(),
          status: InventoryOperationStatus.COMPLETED,
          completedAt: new Date().toISOString()
        })
        .where(eq(inventoryOperations.id, deliveryOperationId))
        .returning();

      return updatedOp;
    });
  }
  async createInventoryOperationWithItems(insertOperation: InsertInventoryOperation, items: any[]): Promise<InventoryOperation> {
    return await db.transaction(async (tx) => {

      const prefix = PrefixInventoryOperationType[insertOperation.type];
      const existingOps = await tx.select().from(inventoryOperations).where(eq(inventoryOperations.type, insertOperation.type));
      const nextNumber = existingOps.length + 1;
      const code = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;

      // 1. Créer l'opération d'inventaire
      const [operation] = await tx.insert(inventoryOperations).values({ ...insertOperation, code }).returning();
      if (!operation) throw new Error("Erreur lors de la création de l'opération d'inventaire");
      // 2. Créer les items

      const itemsToInsert = items.map((it) => ({
        articleId: it.articleId || it.idArticle,
        quantity: it.quantity || it.qteLivree,
        lotId: it.lotId || it.idlot || null,
        fromStorageZoneId: it.fromStorageZoneId || it.idzone || null,
        toStorageZoneId: it.toStorageZoneId || null,
        orderItemId: it.orderItemId || it.idOrderItem || null,
        notes: it.notes || null,
        operationId: operation.id
      }));

      // Insérer les items et obtenir leurs IDs
      const itemsResult = await tx.insert(inventoryOperationItems).values(itemsToInsert).returning();

      // 3. Si c'est une livraison, créer les réservations dans la même transaction
      if (insertOperation.type === InventoryOperationType.LIVRAISON) {
        // Libérer d'abord les anciennes réservations (au cas où)
        await tx.update(stockReservations)
          .set({ status: StockReservationStatus.CANCELLED })
          .where(and(
            eq(stockReservations.inventoryOperationId, operation.id),
            eq(stockReservations.reservationType, StockReservationType.DELIVERY),
            eq(stockReservations.status, StockReservationStatus.RESERVED)
          ));
        // Créer les réservations
        for (const opItem of itemsResult) {
          const article = await this.getArticle(opItem.articleId);
          if (!article) throw new Error(`Article ${opItem.articleId} not found`);
          const totalStock = parseFloat(article.currentStock || '0');
          // Calcul du total réservé (toutes réservations actives)
          const activeReservations = await tx.select({ reservedQuantity: stockReservations.reservedQuantity })
            .from(stockReservations)
            .where(
              and(
                eq(stockReservations.articleId, opItem.articleId),
                eq(stockReservations.status, StockReservationStatus.RESERVED)
              )
            );
          const totalReserved = activeReservations.reduce((sum, r) => sum + parseFloat(r.reservedQuantity || '0'), 0);
          const availableStock = totalStock - totalReserved;
          const requestedQuantity = parseFloat(opItem.quantity);
          if (availableStock < requestedQuantity) {
            throw new Error(`Stock insuffisant pour l'article ${opItem.articleId}. Disponible: ${availableStock}, Requis: ${requestedQuantity}`);
          }
          // Créer la réservation
          await tx.insert(stockReservations).values({
            articleId: opItem.articleId,
            inventoryOperationId: operation.id,
            inventoryOperationItemId: opItem.id, // Correction principale
            orderId: insertOperation.orderId || null,
            orderItemId: opItem.orderItemId || null,
            lotId: opItem.lotId || null,
            storageZoneId: opItem.fromStorageZoneId || null,
            reservedQuantity: requestedQuantity.toString(),
            status: StockReservationStatus.RESERVED,
            reservationDirection: StockReservationDirection.OUT,
            stateChangedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            reservationType: StockReservationType.DELIVERY,
            notes: `Réservation pour livraison (opération ${operation.id})`,
          });
        }
      } else if (operation.type === InventoryOperationType.FABRICATION || operation.type === InventoryOperationType.FABRICATION_RELIQUAT) {
        if (operation.status === InventoryOperationStatus.PROGRAMMED && itemsToInsert.length > 0) {
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
                reservationType: StockReservationType.PRODUCTION as const,
                reservationDirection: StockReservationDirection.OUT,
                stateChangedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                notes: `Réservation pour préparation ${operation.id} - Produit: ${article.name}`,
              });
            }
          }
        }
      }
      return operation;
    });
  }
}

export const storage = new DatabaseStorage();

export interface ArticleStockBase {
  id: number;
  name: string;
  code: string;
  unit: string;
  photo: string | null;
  unitPrice: number;
  isPerishable: boolean;
  totalStock: number;
  totalDispo: number;
}

export interface ArticleStockDetail extends ArticleStockBase {
  stockInfo: {
    id: number;
    storageZoneId: number | null;
    lotId: number | null;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    storageZone?: {
      id: number;
      designation: string;
      code: string;
    } | null;
    lot?: {
      id: number;
      code: string;
      expirationDate: string | null;
    } | null;
  }[];
}


