import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, sql, and, isNull } from "drizzle-orm";
import {
  insertUserSchema,
  insertMeasurementCategorySchema,
  insertMeasurementUnitSchema,
  insertArticleSchema,
  insertPriceListSchema,
  insertPriceRuleSchema,
  insertTaxSchema,
  insertCurrencySchema,
  insertDeliveryMethodSchema,
  insertAccountingJournalSchema,
  insertAccountingAccountSchema,
  insertStorageZoneSchema,
  insertWorkStationSchema,
  insertSupplierSchema,
  insertClientSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertInventoryOperationSchema,
  insertInventoryOperationItemSchema,
  updateInventoryOperationWithItemsSchema,
  type InsertInventoryOperation,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
  insertOrderWithItemsSchema,
  updateOrderWithItemsSchema,
  stock as stockTable,
  articles,
  storageZones,
  lots,
  suppliers,
  inventoryOperations,
  inventoryOperationItems,
  users,
  orderItems,
  insertStockReservationSchema,
  stockReservations,
  InventoryOperation,
} from "@shared/schema";
import { z } from "zod";
import {
  UserRole,
  ArticleCategoryType,
  OrderStatus,
  InventoryOperationType,
  InventoryOperationStatus,
  StockReservationStatus,
  StockReservationType,
  ArticlePrefix,
  CLIENT_TYPE,
  ProductionStatus,
  ProductionItemStatus,
  FILTER_ALL,
  DateTypes,
} from "@shared/constants";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // get user client id if exists
      let clientId = null;
      if (user.role == UserRole.CLIENT) {
        clientId = await storage.getClientIdByUserId(user.id);
      }
      res.json({ user: userWithoutPassword, clientId: clientId });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const { role } = req.query;
      const users = await storage.getAllUsers();
      let filteredUsers = users;

      // Filter by role if specified
      if (role) {
        filteredUsers = users.filter(user => user.role === role);
      }

      const usersWithoutPasswords = filteredUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const user = await storage.updateUser(id, userData);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });


  // Storage Zones routes (replacing Storage Locations)
  app.get("/api/storage-zones", async (req, res) => {
    try {
      const zones = await storage.getAllStorageZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storage zones" });
    }
  });

  app.post("/api/storage-zones", async (req, res) => {
    try {
      const zoneData = insertStorageZoneSchema.parse(req.body);
      const zone = await storage.createStorageZone(zoneData);
      res.status(201).json(zone);
    } catch (error) {
      res.status(400).json({ message: "Invalid storage zone data" });
    }
  });

  // Routes ingrédients supprimées - utiliser /api/articles avec filtrage type="ingredient"

  // MODULES SUPPRIMÉS - À RÉIMPLÉMENTER
  // Recipes, Productions, Orders, Deliveries routes supprimées

  // Dashboard - version simplifiée sans les modules supprimés
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Articles avec stock faible (type="ingredient")
      const lowStockArticles = await storage.getAllArticles();
      const lowStockCount = lowStockArticles.filter(
        (article) =>
          article.type === ArticleCategoryType.INGREDIENT &&
          article.managedInStock &&
          parseFloat(article.currentStock || "0") <
          parseFloat(article.minStock || "0"),
      ).length;

      res.json({
        lowStockCount,
        activeOrdersCount: 0, // À reimplémenter
        todayProductionCount: 0, // À reimplémenter
        dailyRevenue: "0.00", // À reimplémenter
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Measurement Categories routes
  app.get("/api/measurement-categories", async (req, res) => {
    try {
      const categories = await storage.getAllMeasurementCategories();
      res.json(categories);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch measurement categories" });
    }
  });

  app.post("/api/measurement-categories", async (req, res) => {
    try {
      const categoryData = insertMeasurementCategorySchema.parse(req.body);
      const category = await storage.createMeasurementCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid measurement category data" });
    }
  });

  app.put("/api/measurement-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = req.body;
      const category = await storage.updateMeasurementCategory(
        id,
        categoryData,
      );

      if (!category) {
        return res
          .status(404)
          .json({ message: "Measurement category not found" });
      }

      res.json(category);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Failed to update measurement category" });
    }
  });

  app.delete("/api/measurement-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeasurementCategory(id);

      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Measurement category not found" });
      }

      res.json({ message: "Measurement category deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to delete measurement category" });
    }
  });

  // Measurement Units routes
  app.get("/api/measurement-units", async (req, res) => {
    try {
      const units = await storage.getAllMeasurementUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurement units" });
    }
  });

  app.get("/api/measurement-units/active", async (req, res) => {
    try {
      const units = await storage.getActiveMeasurementUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active measurement units" });
    }
  });

  app.post("/api/measurement-units", async (req, res) => {
    try {
      const unitData = insertMeasurementUnitSchema.parse(req.body);
      const unit = await storage.createMeasurementUnit(unitData);
      res.status(201).json(unit);
    } catch (error) {
      res.status(400).json({ message: "Invalid measurement unit data" });
    }
  });

  app.put("/api/measurement-units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const unitData = req.body;
      const unit = await storage.updateMeasurementUnit(id, unitData);

      if (!unit) {
        return res.status(404).json({ message: "Measurement unit not found" });
      }

      res.json(unit);
    } catch (error) {
      res.status(400).json({ message: "Failed to update measurement unit" });
    }
  });

  app.delete("/api/measurement-units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeasurementUnit(id);

      if (!deleted) {
        return res.status(404).json({ message: "Measurement unit not found" });
      }

      res.json({ message: "Measurement unit deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete measurement unit" });
    }
  });

  // Article Categories routes
  app.get("/api/article-categories/:type?", async (req, res) => {
    try {

      const categories = await storage.getAllArticleCategories(req.params.type as (ArticleCategoryType | undefined));
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article categories" });
    }
  });

  app.post("/api/article-categories", async (req, res) => {
    try {
      const categoryData = req.body;
      const category = await storage.createArticleCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid article category data" });
    }
  });

  app.put("/api/article-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = req.body;
      const category = await storage.updateArticleCategory(id, categoryData);

      if (!category) {
        return res.status(404).json({ message: "Article category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to update article category" });
    }
  });

  app.delete("/api/article-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteArticleCategory(id);

      if (!deleted) {
        return res.status(404).json({ message: "Article category not found" });
      }

      res.json({ message: "Article category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article category" });
    }
  });

  // Price Lists routes
  app.get("/api/price-lists", async (req, res) => {
    try {
      const priceLists = await storage.getAllPriceLists();
      res.json(priceLists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price lists" });
    }
  });

  app.post("/api/price-lists", async (req, res) => {
    try {
      const priceListData = insertPriceListSchema.parse(req.body);
      const priceList = await storage.createPriceList(priceListData);
      res.status(201).json(priceList);
    } catch (error) {
      res.status(400).json({ message: "Invalid price list data" });
    }
  });
  app.put("/api/price-lists/:id", async (req, res) => {
    try {
      const priceListData = insertPriceListSchema.parse(req.body);
      const priceList = await storage.updatePriceList(parseInt(req.params.id), priceListData);
      res.status(201).json(priceList);
    } catch (error) {
      res.status(400).json({ message: "Invalid price list data" });
    }
  });
  app.delete("/api/price-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePriceList(id);

      if (!success) {
        return res.status(404).json({ message: "Price list not found" });
      }

      res.json({ message: "Price list deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete price list,(can be used by clients or has rules)" });
    }
  });
  // Price Rules routes
  app.get("/api/price-rules", async (req, res) => {
    try {
      const priceRules = await storage.getAllPriceRules();
      res.json(priceRules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price rules" });
    }
  });
  app.get("/api/price-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const priceRule = await storage.getPriceRule(id);

      if (!priceRule) {
        return res.status(404).json({ message: "Price rule not found" });
      }

      res.json(priceRule);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price rule" });
    }
  });
  app.get("/api/price-rules/by-list/:priceListId", async (req, res) => {
    try {
      const priceListId = parseInt(req.params.priceListId);
      const priceRules = await storage.getPriceRulesByPriceList(priceListId);
      res.json(priceRules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price rules" });
    }
  });
  app.post("/api/price-rules", async (req, res) => {
    try {
      const validatedData = insertPriceRuleSchema.parse(req.body);
      const priceRule = await storage.createPriceRule(validatedData);
      res.status(201).json(priceRule);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/price-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPriceRuleSchema.partial().parse(req.body);
      const priceRule = await storage.updatePriceRule(id, validatedData);

      if (!priceRule) {
        return res.status(404).json({ message: "Price rule not found" });
      }

      res.json(priceRule);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/price-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePriceRule(id);

      if (!success) {
        return res.status(404).json({ message: "Price rule not found" });
      }

      res.json({ message: "Price rule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete price rule" });
    }
  });
  // Taxes routes
  app.get("/api/taxes", async (req, res) => {
    try {
      const taxes = await storage.getAllTaxes();
      res.json(taxes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch taxes" });
    }
  });

  app.post("/api/taxes", async (req, res) => {
    try {
      const taxData = insertTaxSchema.parse(req.body);
      const tax = await storage.createTax(taxData);
      res.status(201).json(tax);
    } catch (error) {
      res.status(400).json({ message: "Invalid tax data" });
    }
  });

  app.put("/api/taxes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taxData = req.body;
      const tax = await storage.updateTax(id, taxData);

      if (!tax) {
        return res.status(404).json({ message: "Tax not found" });
      }

      res.json(tax);
    } catch (error) {
      res.status(400).json({ message: "Failed to update tax" });
    }
  });

  app.delete("/api/taxes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTax(id);

      if (!deleted) {
        return res.status(404).json({ message: "Tax not found" });
      }

      res.json({ message: "Tax deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tax" });
    }
  });

  // Currencies routes
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currencies" });
    }
  });

  app.get("/api/currencies/base", async (req, res) => {
    try {
      const baseCurrency = await storage.getBaseCurrency();
      if (!baseCurrency) {
        return res.status(404).json({ message: "No base currency found" });
      }
      res.json(baseCurrency);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch base currency" });
    }
  });

  app.put("/api/currencies/:id/set-base", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currency = await storage.setBaseCurrency(id);

      if (!currency) {
        return res.status(404).json({ message: "Currency not found" });
      }

      res.json(currency);
    } catch (error) {
      res.status(400).json({ message: "Failed to set base currency" });
    }
  });

  app.post("/api/currencies", async (req, res) => {
    try {
      const currencyData = insertCurrencySchema.parse(req.body);
      const currency = await storage.createCurrency(currencyData);
      res.status(201).json(currency);
    } catch (error) {
      res.status(400).json({ message: "Invalid currency data" });
    }
  });

  app.put("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currencyData = req.body;
      const currency = await storage.updateCurrency(id, currencyData);

      if (!currency) {
        return res.status(404).json({ message: "Currency not found" });
      }

      res.json(currency);
    } catch (error) {
      res.status(400).json({ message: "Failed to update currency" });
    }
  });

  app.delete("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCurrency(id);

      if (!deleted) {
        return res.status(404).json({ message: "Currency not found" });
      }

      res.json({ message: "Currency deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete currency" });
    }
  });

  // Delivery Methods routes
  app.get("/api/delivery-methods", async (req, res) => {
    try {
      const deliveryMethods = await storage.getAllDeliveryMethods();
      res.json(deliveryMethods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery methods" });
    }
  });

  app.post("/api/delivery-methods", async (req, res) => {
    try {
      const deliveryMethodData = insertDeliveryMethodSchema.parse(req.body);
      const deliveryMethod =
        await storage.createDeliveryMethod(deliveryMethodData);
      res.status(201).json(deliveryMethod);
    } catch (error) {
      res.status(400).json({ message: "Invalid delivery method data" });
    }
  });
  app.put("/api/delivery-methods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const methodData = req.body;
      const method = await storage.updateDeliveryMethod(id, methodData);
      if (!method) {
        return res.status(404).json({ message: "Delivery method not found" });
      }
      res.json(method);
    } catch (error) {
      res.status(400).json({ message: "Failed to update delivery method" });
    }
  });

  app.delete("/api/delivery-methods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDeliveryMethod(id);
      if (!success) {
        return res.status(404).json({ message: "Delivery method not found" });
      }
      res.json({ message: "Delivery method deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete delivery method" });
    }
  });

  // ===== ACCOUNTING JOURNALS ROUTES =====
  app.get("/api/accounting-journals", async (req, res) => {
    try {
      const journals = await storage.getAllAccountingJournals();
      res.json(journals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounting journals" });
    }
  });

  app.post("/api/accounting-journals", async (req, res) => {
    try {
      const journalData = insertAccountingJournalSchema.parse(req.body);
      const journal = await storage.createAccountingJournal(journalData);
      res.status(201).json(journal);
    } catch (error) {
      res.status(400).json({ message: "Invalid accounting journal data" });
    }
  });

  app.put("/api/accounting-journals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const journalData = req.body;
      const journal = await storage.updateAccountingJournal(id, journalData);
      if (!journal) {
        return res.status(404).json({ message: "Accounting journal not found" });
      }
      res.json(journal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update accounting journal" });
    }
  });

  app.delete("/api/accounting-journals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccountingJournal(id);
      if (!success) {
        return res.status(404).json({ message: "Accounting journal not found" });
      }
      res.json({ message: "Accounting journal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accounting journal" });
    }
  });

  // ===== ACCOUNTING ACCOUNTS ROUTES =====
  app.get("/api/accounting-accounts", async (req, res) => {
    try {
      const accounts = await storage.getAllAccountingAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounting accounts" });
    }
  });

  app.post("/api/accounting-accounts", async (req, res) => {
    try {
      console.log("Account data received:", req.body);
      const accountData = insertAccountingAccountSchema.parse(req.body);
      console.log("Account data parsed:", accountData);
      const account = await storage.createAccountingAccount(accountData);
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Account creation error:", error);
      res.status(400).json({ message: "Invalid accounting account data", error: error.message });
    }
  });

  app.put("/api/accounting-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = req.body;
      const account = await storage.updateAccountingAccount(id, accountData);
      if (!account) {
        return res.status(404).json({ message: "Accounting account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to update accounting account" });
    }
  });

  app.delete("/api/accounting-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccountingAccount(id);
      if (!success) {
        return res.status(404).json({ message: "Accounting account not found" });
      }
      res.json({ message: "Accounting account deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accounting account" });
    }
  });

  // ===== WORK STATIONS ROUTES =====
  app.get("/api/work-stations", async (req, res) => {
    try {
      const stations = await storage.getAllWorkStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work stations" });
    }
  });

  app.post("/api/work-stations", async (req, res) => {
    try {
      const stationData = insertWorkStationSchema.parse(req.body);
      const station = await storage.createWorkStation(stationData);
      res.status(201).json(station);
    } catch (error) {
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  app.put("/api/work-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stationData = req.body;
      const station = await storage.updateWorkStation(id, stationData);
      if (!station) {
        return res.status(404).json({ message: "Work station not found" });
      }
      res.json(station);
    } catch (error) {
      res.status(400).json({ message: "Failed to update work station" });
    }
  });

  app.delete("/api/work-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkStation(id);
      if (!success) {
        return res.status(404).json({ message: "Work station not found" });
      }
      res.json({ message: "Work station deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete work station" });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });
  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.parse(req.body);
      console.log("Updating supplier:", id, supplierData);
      const supplier = await storage.updateSupplier(id, supplierData);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      console.log("Updated supplier:", supplier);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(400).json({ message: "Failed to update supplier" });
    }
  });

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = req.body;
      const client = await storage.updateClient(id, clientData);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClient(id);

      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Ingredients routes (filtrage des articles par type="ingredient")
  app.get("/api/ingredients", async (req, res) => {
    try {
      const ingredients = await storage.getAllIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/ingredients/low-stock", async (req, res) => {
    try {
      const ingredients = await storage.getLowStockIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching low stock ingredients:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch low stock ingredients" });
    }
  });

  app.get("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ingredient = await storage.getIngredient(id);
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      console.error("Error fetching ingredient:", error);
      res.status(500).json({ message: "Failed to fetch ingredient" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const newIngredient = await storage.createIngredient(req.body);
      res.status(201).json(newIngredient);
    } catch (error) {
      console.error("Error creating ingredient:", error);
      res.status(500).json({ message: "Failed to create ingredient" });
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedIngredient = await storage.updateIngredient(id, req.body);
      if (!updatedIngredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json(updatedIngredient);
    } catch (error) {
      console.error("Error updating ingredient:", error);
      res.status(500).json({ message: "Failed to update ingredient" });
    }
  });

  app.patch("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("PATCH /api/ingredients/:id called with:", {
        id,
        body: req.body,
      });
      const updatedIngredient = await storage.updateIngredient(id, req.body);
      if (!updatedIngredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      console.log("Updated ingredient:", updatedIngredient);
      res.json(updatedIngredient);
    } catch (error) {
      console.error("Error updating ingredient:", error);
      res.status(500).json({ message: "Failed to update ingredient" });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteIngredient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json({ message: "Ingredient deleted successfully" });
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      res.status(500).json({ message: "Failed to delete ingredient" });
    }
  });

  // Articles routes (unified for products, ingredients, services)
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      console.log(
        "🔥 CREATE ARTICLE - Request body:",
        JSON.stringify(req.body, null, 2),
      );
      const articleData = insertArticleSchema.parse(req.body);

      // Generate automatic code based on type
      let code = "";
      if (articleData.type === ArticleCategoryType.PRODUCT) {
        const existingProducts = await storage.getAllArticles();
        const productCount = existingProducts.filter(
          (a) => a.type === ArticleCategoryType.PRODUCT,
        ).length;
        code = `${ArticlePrefix.PRODUCT}-${String(productCount + 1).padStart(6, "0")}`;
      } else if (articleData.type === ArticleCategoryType.INGREDIENT) {
        const existingIngredients = await storage.getAllArticles();
        const ingredientCount = existingIngredients.filter(
          (a) => a.type === ArticleCategoryType.INGREDIENT,
        ).length;
        code = `${ArticlePrefix.INGREDIENT}-${String(ingredientCount + 1).padStart(6, "0")}`;
      } else if (articleData.type === ArticleCategoryType.SERVICE) {
        const existingServices = await storage.getAllArticles();
        const serviceCount = existingServices.filter(
          (a) => a.type === ArticleCategoryType.SERVICE,
        ).length;
        code = `${ArticlePrefix.SERVICE}-${String(serviceCount + 1).padStart(6, "0")}`;
      }

      const articleWithCode = { ...articleData, code };
      const article = await storage.createArticle(articleWithCode);
      console.log(
        "✅ CREATE ARTICLE - Success:",
        JSON.stringify(article, null, 2),
      );
      res.status(201).json(article);
    } catch (error) {
      console.error("❌ CREATE ARTICLE - Error:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(
        "🔥 UPDATE ARTICLE - ID:",
        id,
        "Data:",
        JSON.stringify(req.body, null, 2),
      );
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.updateArticle(id, articleData);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      console.log(
        "✅ UPDATE ARTICLE - Success:",
        JSON.stringify(article, null, 2),
      );
      res.json(article);
    } catch (error) {
      console.error("❌ UPDATE ARTICLE - Error:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("🔥 DELETE ARTICLE - ID:", id);
      const deleted = await storage.deleteArticle(id);

      if (!deleted) {
        return res.status(404).json({ message: "Article not found" });
      }

      console.log("✅ DELETE ARTICLE - Success");
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("❌ DELETE ARTICLE - Error:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Recipes routes (attached to articles with type="product")
  app.get("/api/recipes", async (req, res) => {
    try {
      const [recipes, stats] = await Promise.all([
        storage.getAllRecipes(),
        storage.getRecipeStats().catch(() => []),
      ]);
      const statsMap = new Map(stats.map((s: any) => [s.recipeId, s]));
      // Charger les ingrédients pour chaque recette
      const enriched = await Promise.all(recipes.map(async (r: any) => {
        const ingredients = await storage.getRecipeIngredients(r.id);
        return {
          ...r,
          ingredients,
          ingredientsCount: statsMap.get(r.id)?.ingredientsCount || 0,
          operationsCount: statsMap.get(r.id)?.operationsCount || 0,
          totalOperationDuration: statsMap.get(r.id)?.totalOperationDuration || 0,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!id) return res.status(404).json({ message: "Recipe not found" });
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      const ingredients = await storage.getRecipeIngredients(recipe.id);
      res.json({ ...recipe, ingredients });
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.get("/api/articles/:articleId/recipe", async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const recipe = await storage.getRecipeByArticleId(articleId);
      if (!recipe) {
        return res
          .status(404)
          .json({ message: "Recipe not found for this article" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe by article:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      console.log(
        "🔥 CREATE RECIPE - Request body:",
        JSON.stringify(req.body, null, 2),
      );

      // Vérifier si une recette existe déjà pour cet article
      const existingRecipe = await storage.getRecipeByArticleId(req.body.articleId);
      if (existingRecipe) {
        console.log("❌ CREATE RECIPE - Recipe already exists for article:", req.body.articleId);
        return res.status(409).json({
          message: "Une recette existe déjà pour ce produit. Vous ne pouvez pas créer plusieurs recettes pour le même produit."
        });
      }

      const newRecipe = await storage.createRecipe(req.body);
      console.log(
        "✅ CREATE RECIPE - Success:",
        JSON.stringify(newRecipe, null, 2),
      );
      res.status(201).json(newRecipe);
    } catch (error) {
      console.error("❌ CREATE RECIPE - Error:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedRecipe = await storage.updateRecipe(id, req.body);
      if (!updatedRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(updatedRecipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecipe(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Recipe Ingredients routes
  app.get("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const ingredients = await storage.getRecipeIngredients(recipeId);
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching recipe ingredients:", error);
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  app.post("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const ingredientData = {
        ...req.body,
        recipeId,
      };
      const ingredient = await storage.createRecipeIngredient(ingredientData);
      res.status(201).json(ingredient);
    } catch (error) {
      console.error("Error creating recipe ingredient:", error);
      res.status(500).json({ message: "Failed to create recipe ingredient" });
    }
  });

  app.put("/api/recipe-ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const ingredient = await storage.updateRecipeIngredient(id, updateData);
      if (!ingredient) {
        return res.status(404).json({ message: "Recipe ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      console.error("Error updating recipe ingredient:", error);
      res.status(500).json({ message: "Failed to update recipe ingredient" });
    }
  });

  app.delete("/api/recipe-ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecipeIngredient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe ingredient not found" });
      }
      res.json({ message: "Recipe ingredient deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe ingredient:", error);
      res.status(500).json({ message: "Failed to delete recipe ingredient" });
    }
  });

  // Recipe Operations routes
  app.get("/api/recipes/:recipeId/operations", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const operations = await storage.getRecipeOperations(recipeId);
      res.json(operations);
    } catch (error) {
      console.error("Error fetching recipe operations:", error);
      res.status(500).json({ message: "Failed to fetch recipe operations" });
    }
  });

  app.post("/api/recipes/:recipeId/operations", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const operationData = {
        ...req.body,
        recipeId,
      };
      const operation = await storage.createRecipeOperation(operationData);
      res.status(201).json(operation);
    } catch (error) {
      console.error("Error creating recipe operation:", error);
      res.status(500).json({ message: "Failed to create recipe operation" });
    }
  });

  app.put("/api/recipe-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const operation = await storage.updateRecipeOperation(id, updateData);
      if (!operation) {
        return res.status(404).json({ message: "Recipe operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Error updating recipe operation:", error);
      res.status(500).json({ message: "Failed to update recipe operation" });
    }
  });

  app.delete("/api/recipe-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecipeOperation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe operation not found" });
      }
      res.json({ message: "Recipe operation deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe operation:", error);
      res.status(500).json({ message: "Failed to delete recipe operation" });
    }
  });

  // ============ COMMANDES & DEVIS ROUTES ============

  // Orders/Quotes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/confirmed-with-products-to-prepare", async (req, res) => {
    try {
      const orders = await storage.getConfirmedOrdersWithProductsToPrepare();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching confirmed orders with products to prepare:", error);
      res.status(500).json({ message: "Failed to fetch confirmed orders with products to prepare" });
    }
  });



  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });
  app.post("/api/ordersWithItems", async (req, res) => {
    try {
      const payload = insertOrderWithItemsSchema.parse(req.body);
      const { order, items } = payload;

      const result = await storage.createOrderWithItems(order, items);

      res.status(201).json(result);
    } catch (error) {
      console.error("Erreur création commande:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Données invalides",
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          message: "Échec de la création de la commande",
        });
      }
    }
  });
  app.put("/api/ordersWithItems/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID de commande invalide" });
      }

      const data = updateOrderWithItemsSchema.parse(req.body);
      const { order, items } = data;

      const updatedOrder = await storage.updateOrderWithItems(orderId, order, items);
      res.json({ message: "Commande mise à jour avec succès", order: updatedOrder });

    } catch (error) {
      console.error("Erreur mise à jour commande:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Données invalides",
          errors: error.errors,
        });
      }

      res.status(500).json({ message: "Échec de la mise à jour de la commande" });
    }
  });
  app.put("/api/orders/reorder", async (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Updates array is required and must not be empty" });
      }

      // Validation des données
      const updateSchema = z.object({
        id: z.number(),
        order: z.number().min(0)
      });

      const validatedUpdates = updates.map(update => updateSchema.parse(update));

      // Mise à jour de l'ordre de chaque commande
      for (const update of validatedUpdates) {
        await storage.updateOrder(update.id, { order: update.order });
      }

      res.json({ message: "Orders reordered successfully" });
    } catch (error) {
      console.error("Error reordering orders:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid update data",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Failed to reorder orders" });
      }
    }
  });
  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, updateData);
      if (order) {
        res.json(order);
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      if (success) {
        res.json({ message: "Order deleted successfully" });
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Order Items
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const items = await storage.getOrderItems(orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const itemData = insertOrderItemSchema.parse({
        ...req.body,
        orderId,
      });
      const item = await storage.createOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  // Route optimisée pour le calcul du statut de production de toutes les commandes
  app.get("/api/orders/production-status-batch", async (req, res) => {
    try {
      // Récupérer toutes les commandes avec leurs articles
      const orders = (await storage.getAllOrders())?.filter(f => f.status == OrderStatus.VALIDATED)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        })
      );

      // Récupérer tous les articles uniques
      const allArticleIds = new Set<number>();
      ordersWithItems.forEach(order => {
        order.items.forEach((item: any) => allArticleIds.add(item.articleId));
      });

      // Récupérer le stock disponible et les noms des articles pour tous les articles en une fois
      const stockData: Record<number, number> = {};
      const articleNames: Record<number, string> = {};
      for (const articleId of Array.from(allArticleIds)) {
        stockData[articleId] = (await storage.getArticleAvailableStock(articleId))?.totalDispo || 0;
        const article = await storage.getArticle(articleId);
        articleNames[articleId] = article?.name || `Article ${articleId}`;
      }

      // Récupérer toutes les opérations de fabrication en cours
      const operationsEnCours = await storage.getInventoryOperationsByType(InventoryOperationType.FABRICATION);
      const operationsEnCoursData: Record<number, any[]> = {};

      operationsEnCours.forEach(op => {
        if (op.status === ProductionStatus.EN_COURS && op.items) {
          op.items.forEach((item: any) => {
            if (!operationsEnCoursData[item.articleId]) {
              operationsEnCoursData[item.articleId] = [];
            }
            operationsEnCoursData[item.articleId].push({
              id: op.id,
              quantity: item.quantity
            });
          });
        }
      });

      // Copie virtuelle pour les ajustements
      const stockVirtuel = { ...stockData };
      const operationsVirtuelles = JSON.parse(JSON.stringify(operationsEnCoursData));

      // Calculer l'état de production pour chaque commande dans l'ordre
      const resultat = [];

      for (const order of ordersWithItems) {
        const ajustements: string[] = [];

        // Vérifier l'état "préparé" / "partiellement préparé"
        let toutDisponible = true;
        let auMoinsUnDisponible = false;

        for (const item of order.items) {
          const qCommande = parseFloat(item.quantity);
          const qStock = stockVirtuel[item.articleId] || 0;

          if (qStock >= qCommande) {
            auMoinsUnDisponible = true;
          } else if (qStock > 0) {
            toutDisponible = false;
            auMoinsUnDisponible = true;
          } else {
            toutDisponible = false;
          }
        }

        // Vérifier l'état "en cours"
        let enCours = true;
        for (const item of order.items) {
          const qStock = stockVirtuel[item.articleId] || 0;
          const op = operationsVirtuelles[item.articleId];

          if (qStock > 0 || !op || op.length === 0) {
            enCours = false;
            break;
          }
        }

        // Déterminer l'état final et appliquer les ajustements virtuels
        let etat = ProductionStatus.NON_PREPARE;

        if (enCours) {
          etat = ProductionStatus.EN_COURS;
          for (const item of order.items) {
            const op = operationsVirtuelles[item.articleId];
            if (op && op.length > 0) {
              const qOp = Math.min(parseFloat(item.quantity), op[0].quantity);
              // Ajustement virtuel : diminuer la quantité dans l'opération
              op[0].quantity -= qOp;
              if (op[0].quantity <= 0) {
                operationsVirtuelles[item.articleId] = op.slice(1);
              }
              ajustements.push(`${articleNames[item.articleId]} -${qOp} (depuis opération ${op[0].id})`);
            }
          }
        } else if (toutDisponible) {
          etat = ProductionStatus.PREPARE;
          for (const item of order.items) {
            const qCommande = parseFloat(item.quantity);
            // Ajustement virtuel : diminuer le stock
            stockVirtuel[item.articleId] -= qCommande;
            ajustements.push(`${articleNames[item.articleId]} -${qCommande}`);
          }
        } else if (auMoinsUnDisponible) {
          etat = ProductionStatus.PARTIELLEMENT_PREPARE;
          for (const item of order.items) {
            const qCommande = parseFloat(item.quantity);
            const qDisponible = Math.min(qCommande, stockVirtuel[item.articleId] || 0);
            if (qDisponible > 0) {
              // Ajustement virtuel : diminuer le stock
              stockVirtuel[item.articleId] -= qDisponible;
              ajustements.push(`${articleNames[item.articleId]} -${qDisponible}`);
            }
          }
        } else {
          etat = ProductionStatus.NON_PREPARE;
          ajustements.push("Aucun ajustement possible");
        }

        resultat.push({
          orderId: order.id,
          etat,
          ajustements
        });
      }

      res.json(resultat);

    } catch (error) {
      console.error("Erreur lors du calcul du statut de production en lot:", error);
      res.status(500).json({ message: "Échec du calcul du statut de production en lot" });
    }
  });
  // Route pour récupérer les détails de production d'une commande spécifique
  app.get("/api/orders/:id/production-detail", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Récupérer toutes les commandes avec leurs articles
      const orders = (await storage.getAllOrders())?.filter(f => f.status === OrderStatus.VALIDATED)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        })
      );

      // Récupérer tous les articles uniques
      const allArticleIds = new Set<number>();
      ordersWithItems.forEach(order => {
        order.items.forEach((item: any) => allArticleIds.add(item.articleId));
      });

      // Récupérer le stock disponible et les noms des articles
      const stockData: Record<number, number> = {};
      const articleNames: Record<number, string> = {};
      const articleImages: Record<number, string> = {};
      for (const articleId of Array.from(allArticleIds)) {
        stockData[articleId] = (await storage.getArticleAvailableStock(articleId))?.totalDispo || 0;
        const article = await storage.getArticle(articleId);
        articleNames[articleId] = article?.name || `Article ${articleId}`;
        articleImages[articleId] = article?.photo || '';
      }

      // Récupérer toutes les opérations de fabrication en cours
      const operationsEnCours = await storage.getInventoryOperationsByType(InventoryOperationType.FABRICATION);
      const operationsEnCoursData: Record<number, any[]> = {};

      operationsEnCours.forEach(op => {
        if (op.status === ProductionStatus.EN_COURS && op.items) {
          op.items.forEach((item: any) => {
            if (!operationsEnCoursData[item.articleId]) {
              operationsEnCoursData[item.articleId] = [];
            }
            operationsEnCoursData[item.articleId].push({
              id: op.id,
              quantity: item.quantity
            });
          });
        }
      });

      // Copie virtuelle pour les ajustements
      const stockVirtuel = { ...stockData };
      const operationsVirtuelles = JSON.parse(JSON.stringify(operationsEnCoursData));

      // Trouver la commande cible et calculer son état dans l'ordre
      const targetOrder = ordersWithItems.find(o => o.id === id);
      if (!targetOrder) {
        return res.status(404).json({ message: "Order not found in active orders" });
      }

      const targetOrderIndex = ordersWithItems.findIndex(o => o.id === id);
      const ajustements: string[] = [];
      let etat = ProductionStatus.NON_PREPARE;

      // Traiter toutes les commandes jusqu'à la commande cible (exclus)
      for (let i = 0; i < targetOrderIndex; i++) {
        const currentOrder = ordersWithItems[i];

        let toutDisponible = true;
        let auMoinsUnDisponible = false;

        for (const item of currentOrder.items) {
          const qCommande = parseFloat(item.quantity);
          const qStock = stockVirtuel[item.articleId] || 0;

          if (qStock >= qCommande) {
            auMoinsUnDisponible = true;
          } else if (qStock > 0) {
            toutDisponible = false;
            auMoinsUnDisponible = true;
          } else {
            toutDisponible = false;
          }
        }

        let enCours = true;
        for (const item of currentOrder.items) {
          const qStock = stockVirtuel[item.articleId] || 0;
          const op = operationsVirtuelles[item.articleId];

          if (qStock > 0 || !op || op.length === 0) {
            enCours = false;
            break;
          }
        }

        // Appliquer les ajustements virtuels pour les commandes précédentes
        if (enCours) {
          for (const item of currentOrder.items) {
            const op = operationsVirtuelles[item.articleId];
            if (op && op.length > 0) {
              const qOp = Math.min(parseFloat(item.quantity), op[0].quantity);
              op[0].quantity -= qOp;
              if (op[0].quantity <= 0) {
                operationsVirtuelles[item.articleId] = op.slice(1);
              }
            }
          }
        } else if (toutDisponible) {
          for (const item of currentOrder.items) {
            const qCommande = parseFloat(item.quantity);
            stockVirtuel[item.articleId] -= qCommande;
          }
        } else if (auMoinsUnDisponible) {
          for (const item of currentOrder.items) {
            const qCommande = parseFloat(item.quantity);
            const qDisponible = Math.min(qCommande, stockVirtuel[item.articleId] || 0);
            if (qDisponible > 0) {
              stockVirtuel[item.articleId] -= qDisponible;
            }
          }
        }
      }

      // Capturer le stock AVANT de traiter la commande cible
      const stockAvantCommande = { ...stockVirtuel };

      // Maintenant traiter la commande cible
      const currentOrder = ordersWithItems[targetOrderIndex];
      let toutDisponible = true;
      let auMoinsUnDisponible = false;

      // Vérifier l'état "préparé" / "partiellement préparé"
      for (const item of currentOrder.items) {
        const qCommande = parseFloat(item.quantity);
        const qStock = stockVirtuel[item.articleId] || 0;

        if (qStock >= qCommande) {
          auMoinsUnDisponible = true;
        } else if (qStock > 0) {
          toutDisponible = false;
          auMoinsUnDisponible = true;
        } else {
          toutDisponible = false;
        }
      }

      // Vérifier l'état "en cours"
      let enCours = true;
      for (const item of currentOrder.items) {
        const qStock = stockVirtuel[item.articleId] || 0;
        const op = operationsVirtuelles[item.articleId];

        if (qStock > 0 || !op || op.length === 0) {
          enCours = false;
          break;
        }
      }

      // Déterminer l'état final
      if (enCours) {
        etat = ProductionStatus.EN_COURS;
        for (const item of currentOrder.items) {
          const op = operationsVirtuelles[item.articleId];
          if (op && op.length > 0) {
            const qOp = Math.min(parseFloat(item.quantity), op[0].quantity);
            op[0].quantity -= qOp;
            if (op[0].quantity <= 0) {
              operationsVirtuelles[item.articleId] = op.slice(1);
            }
            ajustements.push(`${articleNames[item.articleId]} -${qOp} (depuis opération ${op[0].id})`);
          }
        }
      } else if (toutDisponible) {
        etat = ProductionStatus.PREPARE;
        for (const item of currentOrder.items) {
          const qCommande = parseFloat(item.quantity);
          stockVirtuel[item.articleId] -= qCommande;
          ajustements.push(`${articleNames[item.articleId]} -${qCommande}`);
        }
      } else if (auMoinsUnDisponible) {
        etat = ProductionStatus.PARTIELLEMENT_PREPARE;
        for (const item of currentOrder.items) {
          const qCommande = parseFloat(item.quantity);
          const qDisponible = Math.min(qCommande, stockVirtuel[item.articleId] || 0);
          if (qDisponible > 0) {
            stockVirtuel[item.articleId] -= qDisponible;
            ajustements.push(`${articleNames[item.articleId]} -${qDisponible}`);
          }
        }
      } else {
        etat = ProductionStatus.NON_PREPARE;
        ajustements.push("Aucun ajustement possible");
      }

      // Récupérer les livraisons pour cette commande
      const deliveries = await storage.getInventoryOperationsByOrder(id);

      // Calculer les quantités de livraison par article
      const deliveryQuantities: Record<number, { toDeliver: number; delivered: number }> = {};

      deliveries.forEach(delivery => {
        // Exclure les livraisons annulées du calcul des quantités
        if (delivery.status === InventoryOperationStatus.CANCELLED) {
          return;
        }

        delivery.items.forEach(deliveryItem => {
          const articleId = deliveryItem.articleId;
          const quantity = parseFloat(deliveryItem.quantity);

          if (!deliveryQuantities[articleId]) {
            deliveryQuantities[articleId] = { toDeliver: 0, delivered: 0 };
          }

          if (delivery.isValidated) {
            deliveryQuantities[articleId].delivered += quantity;
          } else {
            deliveryQuantities[articleId].toDeliver += quantity;
          }
        });
      });

      // CORRECTION PRINCIPALE : Créer les détails des articles avec les bonnes quantités
      const itemsDetail = targetOrder.items.map(item => {
        const qCommande = parseFloat(item.quantity);
        const qStockInitial = stockData[item.articleId] || 0;

        // Récupérer les quantités de livraison pour cet article
        const deliveryQty = deliveryQuantities[item.articleId] || { toDeliver: 0, delivered: 0 };
        const qToDeliver = deliveryQty.toDeliver;
        const qDelivered = deliveryQty.delivered;

        // Quantité restante à produire = commandée - programmée - livrée
        const qRemaining = qCommande - qToDeliver - qDelivered;

        // CORRECTION : Calculer ce qui peut être planifié MAINTENANT
        // C'est le minimum entre le stock disponible AVANT cette commande et la quantité restante
        const stockDisponiblePourCetteCommande = stockAvantCommande[item.articleId] || 0;
        const qAjuste = Math.min(stockDisponiblePourCetteCommande, qRemaining);

        // CORRECTION : À produire = ce qui reste après avoir utilisé le stock disponible
        const qRestantAProduire = Math.max(0, qRemaining - qAjuste);

        let status: ProductionItemStatus = ProductionItemStatus.MISSING;
        if (qCommande == qDelivered) { status = ProductionItemStatus.DELIVERED; }
        else if (qAjuste === qRemaining) {
          status = ProductionItemStatus.AVAILABLE;
        } else if (qAjuste > 0) {
          status = ProductionItemStatus.PARTIAL;
        } else if (operationsVirtuelles[item.articleId] && operationsVirtuelles[item.articleId].length > 0) {
          status = ProductionItemStatus.IN_PRODUCTION;
        }

        return {
          articleId: item.articleId,
          articleImage: articleImages[item.articleId],
          articleName: articleNames[item.articleId],
          quantity: qCommande, // Quantité commandée originale
          quantityToDeliver: qToDeliver, // Quantité programmée à livrer
          quantityDelivered: qDelivered, // Quantité livrée (validée)
          quantityRemaining: qRemaining, // Quantité restante à produire
          stockAvailable: qStockInitial, // Stock initial pour référence
          quantityAdjusted: qAjuste, // CORRIGÉ : Ce qu'on peut planifier maintenant
          inProduction: qRestantAProduire, // CORRIGÉ : Ce qui reste à produire
          stockRemaining: stockAvantCommande[item.articleId] || 0, // Stock restant AVANT cette commande
          status
        };
      });

      const result = {
        orderId: targetOrder.id,
        etat,
        ajustements,
        items: itemsDetail
      };

      res.json(result);

    } catch (error) {
      console.error("Erreur lors du calcul des détails de production:", error);
      res.status(500).json({ message: "Échec du calcul des détails de production" });
    }
  });

  // Récap global des produits: calcule qté commandée, qté à prélever (stock), qté à produire
  app.get("/api/orders/production-summary", async (req, res) => {
    try {
      const { search, status, type, clientId, date, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

      // 1) charger toutes les commandes confirmées
      let allOrders = await storage.getAllOrders();
      allOrders = allOrders.filter((o: any) => o.status === OrderStatus.VALIDATED);

      // Helper: normaliser une date en "date only" (00:00:00 locale). Retourne null si invalide.
      const toDateOnly = (input?: string | Date | null): Date | null => {
        if (!input) return null;
        const d = (input instanceof Date) ? input : new Date(input);
        if (isNaN(d.getTime())) return null;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      };

      const today = toDateOnly(new Date())!;
      const yesterday = toDateOnly(new Date(Date.now() - 86400000))!;
      const tomorrow = toDateOnly(new Date(Date.now() + 86400000))!;

      // Charger clients (map)
      const clientsList = await storage.getAllClients();
      const clientsMap: Record<number, any> = {};
      clientsList.forEach((c: any) => { clientsMap[c.id] = c; });

      // Fonction de filtrage pour l'AFFICHAGE SEUL (ne modifie pas la consommation)
      const isInFilter = (o: any): boolean => {
        if (status && status !== FILTER_ALL && o.status !== status) return false;
        if (type && type !== FILTER_ALL && o.type !== type) return false;
        if (clientId && clientId !== FILTER_ALL && o.clientId !== parseInt(clientId)) return false;

        if (date && date !== FILTER_ALL) {
          const raw = o.deliveryDate || o.orderDate || o.createdAt;
          if (!raw) return false;
          const od = toDateOnly(raw);
          if (!od) return false;

          if (date === DateTypes.TODAY && od.getTime() !== today.getTime()) return false;
          if (date === DateTypes.YESTERDAY && od.getTime() !== yesterday.getTime()) return false;
          if (date === DateTypes.TOMORROW && od.getTime() !== tomorrow.getTime()) return false;

          if (date === DateTypes.RANGE) {
            const from = toDateOnly(dateFrom);
            const to = toDateOnly(dateTo);

            if (!from && !to) {
              // aucun filtre appliqué
            } else if (from && !to) {
              if (od.getTime() < from.getTime()) return false;
            } else if (!from && to) {
              if (od.getTime() > to.getTime()) return false;
            } else if (from && to) {
              // swap si inversé
              const start = from.getTime() <= to.getTime() ? from : to;
              const end = from.getTime() <= to.getTime() ? to : from;
              if (od.getTime() < start.getTime() || od.getTime() > end.getTime()) return false;
            }
          }
        }

        if (search && search.trim()) {
          const s = search.toLowerCase();
          const client = clientsMap[o.clientId];
          const clientName = client ? (client.type !== CLIENT_TYPE ? `${client.firstName} ${client.lastName}` : client.companyName) : "";
          const code = (o.code || "").toString().toLowerCase();
          if (!code.includes(s) && !clientName.toLowerCase().includes(s)) return false;
        }

        return true;
      };

      // 2) trier par priorité
      const allOrdersSorted = allOrders.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      const filteredIds = new Set<number>(allOrdersSorted.filter(isInFilter).map((o: any) => o.id));

      // 3) charger items pour TOUTES les commandes (consommation virtuelle se fait sur toutes)
      const ordersWithItems = await Promise.all(
        allOrdersSorted.map(async (o: any) => ({ ...o, items: await storage.getOrderItems(o.id) }))
      );

      // 4) préparer stock initial (par article) et info article
      const articleIds = new Set<number>();
      ordersWithItems.forEach(o => o.items.forEach((it: any) => articleIds.add(it.articleId)));

      const stockVirtuel: Record<number, number> = {};
      const articleInfo: Record<number, any> = {};

      // paralléliser les fetchs pour perf
      await Promise.all(Array.from(articleIds).map(async (articleId) => {
        stockVirtuel[articleId] = (await storage.getArticleAvailableStock(articleId))?.totalDispo || 0;
        const art = await storage.getArticle(articleId);
        articleInfo[articleId] = { name: art?.name || `Article ${articleId}`, photo: art?.photo || null, unit: art?.saleUnit || art?.unit || null };
      }));

      // 5) Récupérer les livraisons pour toutes les commandes filtrées
      const deliveryQuantities: Record<number, { toDeliver: number; delivered: number }> = {};

      for (const orderId of Array.from(filteredIds)) {
        const deliveries = await storage.getInventoryOperationsByOrder(orderId);

        deliveries.forEach(delivery => {
          // Exclure les livraisons annulées du calcul des quantités
          if (delivery.status === InventoryOperationStatus.CANCELLED) {
            return;
          }

          delivery.items.forEach(deliveryItem => {
            const articleId = deliveryItem.articleId;
            const quantity = parseFloat(deliveryItem.quantity);

            if (!deliveryQuantities[articleId]) {
              deliveryQuantities[articleId] = { toDeliver: 0, delivered: 0 };
            }

            // Si la livraison est validée, c'est livré, sinon c'est programmé
            if (delivery.isValidated) {
              deliveryQuantities[articleId].delivered += quantity;
            } else {
              deliveryQuantities[articleId].toDeliver += quantity;
            }
          });
        });
      }

      // 6) agrégation : on CONSUME le stock sur toutes les commandes (ordre priorité),
      // mais on n'AGREGATE (ordered/toPick) que si la commande est dans le filtre
      const agg: Record<number, { articleId: number; ordered: number; toPick: number; toDeliver: number; delivered: number; remaining: number; toProduce: number }> = {};

      for (const order of ordersWithItems) {
        const shouldAggregate = filteredIds.has(order.id);

        for (const item of order.items) {
          const articleId = item.articleId as number;
          const qCommande = Number(item.quantity) || 0;

          if (!agg[articleId]) {
            agg[articleId] = {
              articleId,
              ordered: 0,
              toPick: 0,
              toDeliver: 0,
              delivered: 0,
              remaining: 0,
              toProduce: 0
            };
          }

          // 1) si la commande est dans le filtre, on compte Ordered (TOUJOURS)
          if (shouldAggregate) {
            agg[articleId].ordered += qCommande;
          }

          let remaining = qCommande;

          // 2) prélever sur stock virtuel (toujours consommé)
          const qStock = stockVirtuel[articleId] || 0;
          if (qStock > 0) {
            const qFromStock = Math.min(remaining, qStock);
            if (shouldAggregate) {
              agg[articleId].toPick += qFromStock;
            }
            stockVirtuel[articleId] = qStock - qFromStock;
            remaining -= qFromStock;
          }
        }
      }

      // 7) Ajouter les quantités de livraison et calculer les quantités restantes et à produire
      for (const articleId in agg) {
        const deliveryQty = deliveryQuantities[parseInt(articleId)] || { toDeliver: 0, delivered: 0 };
        agg[articleId].toDeliver = deliveryQty.toDeliver;
        agg[articleId].delivered = deliveryQty.delivered;
        agg[articleId].remaining = agg[articleId].ordered - deliveryQty.toDeliver - deliveryQty.delivered;
        // toProduce = remaining - toPick (ce qui reste après avoir prélevé du stock)
        agg[articleId].toProduce = Math.max(0, agg[articleId].remaining - agg[articleId].toPick);
      }

      // 8) construire la réponse (par défaut on renvoie uniquement les articles avec ordered>0)
      const result = Object.values(agg)
        .filter(r => r.ordered > 0)
        .map(r => ({
          articleId: r.articleId,
          name: articleInfo[r.articleId]?.name || `Article ${r.articleId}`,
          photo: articleInfo[r.articleId]?.photo || null,
          unit: articleInfo[r.articleId]?.unit || null,
          ordered: r.ordered,
          toDeliver: r.toDeliver,
          delivered: r.delivered,
          remaining: r.remaining,
          toPick: r.toPick,
          toProduce: r.toProduce
        }))
        .sort((a, b) => b.toProduce - a.toProduce);

      res.json(result);

    } catch (error) {
      console.error("Erreur production-summary:", error);
      res.status(500).json({ message: "Échec du calcul du récapitulatif" });
    }
  });


  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (order) {
        res.json(order);
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  // ============ OPERATIONS D'INVENTAIRE ROUTES ============

  app.get("/api/inventory-operations", async (req, res) => {
    try {
      const { type, include_reliquat, operator_id, orderId } = req.query;
      let operations;

      // Si orderId est spécifié, filtrer par commande
      if (orderId) {
        const orderIdNum = parseInt(orderId as string);
        if (isNaN(orderIdNum)) {
          return res.status(400).json({ message: "Invalid order ID" });
        }
        operations = await storage.getInventoryOperationsByOrder(orderIdNum);
      } else if (type) {
        const includeReliquat = include_reliquat === 'true';
        const types = (type as string).split(',').map(t => t.trim());
        if (types.length === 1) {
          operations = await storage.getInventoryOperationsByType(types[0], includeReliquat);
        } else {
          // Pour plusieurs types, utiliser une méthode qui accepte un tableau
          operations = await storage.getInventoryOperationsByTypes(types, includeReliquat);
        }
      } else if (operator_id) {
        // Filter operations by operator ID
        const operatorId = parseInt(operator_id as string);
        if (isNaN(operatorId)) {
          return res.status(400).json({ message: "Invalid operator ID" });
        }
        operations = await storage.getInventoryOperationsByOperator(operatorId);
      } else {
        operations = await storage.getAllInventoryOperations();
      }
      res.json(operations);
    } catch (error) {
      console.error("Error fetching inventory operations:", error);
      res.status(500).json({ message: "Failed to fetch inventory operations" });
    }
  });

  app.get("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const operation = await storage.getInventoryOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Inventory operation not found" });
      }

      // Get the items for this operation
      const items = await storage.getInventoryOperationItems(id);

      // Return operation with items
      res.json({
        ...operation,
        items: items
      });
    } catch (error) {
      console.error("Error fetching inventory operation:", error);
      res.status(500).json({ message: "Failed to fetch inventory operation" });
    }
  });

  app.post("/api/inventory-operations", async (req, res) => {
    try {
      // Check if the request contains both operation and items
      if (req.body.operation && req.body.items) {
        const operationData = insertInventoryOperationSchema.parse(req.body.operation);
        // Vérification inventaire initiale unique par zone
        if (operationData.type === 'inventaire_initiale' && operationData.storageZoneId) {
          const existing = await db.select().from(inventoryOperations)
            .where(
              and(
                eq(inventoryOperations.type, 'inventaire_initiale'),
                eq(inventoryOperations.storageZoneId, operationData.storageZoneId)
              )
            );
          if (existing.length > 0 && existing.some(f => f.status !== InventoryOperationStatus.CANCELLED)) {
            return res.status(400).json({ message: 'Un inventaire initial existe déjà pour cette zone.' });
          }
        }
        const itemsData = req.body.items.map((item: any) => {
          const validatedItem = insertInventoryOperationItemSchema.parse(item);
          return {
            ...validatedItem,
            operationId: undefined
          };
        });
        // Calcul automatique des totaux pour les livraisons
        if (operationData.type === InventoryOperationType.LIVRAISON) {
          let subtotalHT = 0;
          let totalTax = 0;
          let totalTTC = 0;

          // Récupérer les prix depuis la commande ou les articles
          for (const item of itemsData) {
            let unitPrice = 0;

            // Si on a une commande liée, récupérer le prix depuis la commande
            if (operationData.orderId) {
              const orderItem = await db.select()
                .from(orderItems)
                .where(and(
                  eq(orderItems.orderId, operationData.orderId),
                  eq(orderItems.articleId, item.articleId)
                ))
                .limit(1);

              if (orderItem.length > 0) {
                unitPrice = parseFloat(orderItem[0].unitPrice.toString());
              }
            }

            // Si pas de prix trouvé dans la commande, utiliser le prix de l'article
            if (unitPrice === 0) {
              const article = await db.select()
                .from(articles)
                .where(eq(articles.id, item.articleId))
                .limit(1);

              if (article.length > 0) {
                unitPrice = parseFloat((article[0].salePrice || article[0].price || "0").toString());
              }
            }

            const itemTotal = unitPrice * parseFloat(item.quantity.toString());
            subtotalHT += itemTotal;
          }

          // Calculer la TVA (19% par défaut)
          totalTax = subtotalHT * 0.19;
          totalTTC = subtotalHT + totalTax;

          // Mettre à jour les totaux
          operationData.subtotalHT = subtotalHT.toString();
          operationData.totalTax = totalTax.toString();
          operationData.totalTTC = totalTTC.toString();
        }

        if (operationData.type === 'inventaire_initiale') {
          let totalCost = 0;
          for (const item of itemsData) {
            const unitCost = parseFloat(item.unitCost || "0");
            const quantity = parseFloat(item.quantityAfter || "0");
            item.totalCost = (unitCost * quantity).toString();
            totalCost += unitCost * quantity;
          }
          operationData.subtotalHT = totalCost.toString();
          operationData.totalTTC = totalCost.toString();
        }

        // Pour les préparations, calculer automatiquement les ingrédients à consommer
        if (operationData.type === InventoryOperationType.FABRICATION || operationData.type === InventoryOperationType.FABRICATION_RELIQUAT) {
          const allItems = [...itemsData]; // Copie des items produits

          // Pour chaque produit à produire, calculer les ingrédients nécessaires
          for (let i = 0; i < itemsData.length; i++) {
            const productItem = itemsData[i];
            const result = await storage.calculateIngredientConsumptionItems(productItem);

            // Ajouter les ingrédients
            allItems.push(...result.items);

            // Mettre à jour le coût du produit principal basé sur le coût total des ingrédients
            const productQuantity = parseFloat(productItem.quantity || '0');
            const calculatedUnitCost = productQuantity > 0 ? result.totalCost / productQuantity : 0;

            // Mettre à jour l'item produit avec le coût calculé
            productItem.unitCost = calculatedUnitCost.toString();
            productItem.totalCost = result.totalCost.toString();
            productItem.quantityBefore = result.quantityBefore;
            productItem.quantityAfter = result.quantityAfter;
            console.log(`💰 Product ${productItem.articleId} - Calculated unit cost: ${calculatedUnitCost}, Total cost: ${result.totalCost}`);
          }

          // Remplacer itemsData par allItems (produits + ingrédients)
          itemsData.length = 0;
          itemsData.push(...allItems);
        }

        const operation = await storage.createInventoryOperationWithItems(operationData, itemsData);
        res.status(201).json(operation);
      } else {
        // Fallback to the old method for backward compatibility
        const operationData = insertInventoryOperationSchema.parse(req.body);
        // Vérification inventaire initiale unique par zone
        if (operationData.type === InventoryOperationType.INVENTAIRE_INITIALE && operationData.storageZoneId) {
          const existing = await db.select().from(inventoryOperations)
            .where(
              and(
                eq(inventoryOperations.type, InventoryOperationType.INVENTAIRE_INITIALE),
                eq(inventoryOperations.storageZoneId, operationData.storageZoneId)
              )
            );
          if (existing.length > 0 && existing.some(f => f.status !== InventoryOperationStatus.CANCELLED)) {
            return res.status(400).json({ message: 'Un inventaire initial existe déjà pour cette zone.' });
          }
        }
        const operation = await storage.createInventoryOperation(operationData);
        res.status(201).json(operation);
      }
    } catch (error) {
      console.error("Error creating inventory operation:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid operation data",
          errors: error.errors,
        });
      }
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,   // renvoyer le vrai message de l'erreur
        });
      }
      return res.status(500).json({
        message: "Failed to create inventory operation",
        error: String(error), // au cas où ce n'est pas une Error standard
      });
    }
  });
  app.delete("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Supprimer d'abord les items liés
      const items = await storage.getInventoryOperationItems(id);
      for (const item of items) {
        await storage.deleteInventoryOperationItem(item.id);
      }
      const success = await storage.deleteInventoryOperation(id);
      if (!success) {
        return res.status(404).json({ message: "Préparation non trouvée" });
      }
      res.json({ message: "Préparation supprimée avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de la préparation:", error);
      res.status(500).json({ message: "Erreur lors de la suppression de la préparation" });
    }
  });
  app.put("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      // Check if the request contains both operation and items
      if (req.body.operation && req.body.items) {
        // Use the new method that handles both operation and items
        const data = updateInventoryOperationWithItemsSchema.parse(req.body);
        const { operation, items } = data;

        if (operation.type === 'inventaire_initiale') {
          let totalCost = 0;
          for (const item of items) {
            const unitCost = parseFloat(item.unitCost || "0");
            const quantity = parseFloat(item.quantityAfter || "0");
            totalCost += unitCost * quantity;
          }
          operation.subtotalHT = totalCost.toString();
          operation.totalTTC = totalCost.toString();
        }
        // Pour les préparations, calculer automatiquement les ingrédients à consommer
        if (operation.type === InventoryOperationType.FABRICATION || operation.type === InventoryOperationType.FABRICATION_RELIQUAT) {
          var NewItems = items.filter((f: any) => f.quantity >= 0);
          const allItems = [...NewItems]; // Copie des items produits

          // Pour chaque produit à produire, calculer les ingrédients nécessaires
          for (const productItem of NewItems) {

            const result = await storage.calculateIngredientConsumptionItems(productItem);
            allItems.push(...result.items);
            // Mettre à jour le coût du produit principal basé sur le coût total des ingrédients
            const productQuantity = parseFloat(productItem.quantity || '0');
            const calculatedUnitCost = productQuantity > 0 ? result.totalCost / productQuantity : 0;

            // Mettre à jour l'item produit avec le coût calculé
            productItem.unitCost = calculatedUnitCost.toString();
            productItem.totalCost = result.totalCost.toString();
            productItem.quantityBefore = result.quantityBefore;
            productItem.quantityAfter = result.quantityAfter;

          }

          // Remplacer itemsData par allItems (produits + ingrédients)
          items.length = 0;
          items.push(...allItems);
        }
        const updatedOperation = await storage.updateInventoryOperationWithItems(id, operation, items);
        res.json({ message: "Inventory operation updated successfully", operation: updatedOperation });
      } else {
        // Fallback to updating just the operation header
        const updateData = insertInventoryOperationSchema.partial().parse(req.body);
        const operation = await storage.updateInventoryOperation(id, updateData);

        if (operation) {
          res.json(operation);
        } else {
          res.status(404).json({ message: "Inventory operation not found" });
        }
      }
    } catch (error) {
      console.error("Error updating inventory operation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid operation data",
          errors: error.errors,
        });
      }
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,   // renvoyer le vrai message de l'erreur
        });
      }
      return res.status(500).json({
        message: "Failed to create inventory operation",
        error: String(error), // au cas où ce n'est pas une Error standard
      });
    }
  });

  // PATCH endpoint for inventory operations (for status updates and scheduling)
  app.patch("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, scheduledDate, isDeliveryValidated } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }
      // Pour mettre à jour uniquement le statut de validation de la livraison
      if (typeof isDeliveryValidated === 'boolean') {
        const operation = await storage.getInventoryOperation(id);
        if (!operation) {
          return res.status(404).json({ message: "Operation not found" });
        }
        // Vérifier que c'est bien une livraison
        if (operation.type !== InventoryOperationType.LIVRAISON) {
          return res.status(400).json({ message: "Operation is not a delivery" });
        }
        // Mettre à jour isValidated
        const data = {
          isValidated: isDeliveryValidated,
          status,
          statusDate: new Date().toISOString(),
          validatedAt: isDeliveryValidated ? new Date().toISOString() : null
        } as InventoryOperation;
        const result = await storage.updateInventoryOperation(id, data);
        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ message: "Failed to update delivery status" });
        }
        return;
      }

      // If only status is being updated and it's a completion/cancellation
      if (status && !scheduledDate && [InventoryOperationStatus.COMPLETED, InventoryOperationStatus.CANCELLED].includes(status)) {
        const result = await storage.updateInventoryOperationStatus(id, status);
        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ message: "Inventory operation not found" });
        }
        return;
      }

      // For scheduling (scheduledDate) or other status updates (like "programmed")
      const updateData: any = {};

      if (status) {
        updateData.status = status;
      }

      if (scheduledDate) {
        updateData.scheduledDate = scheduledDate;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const result = await storage.updateInventoryOperation(id, updateData);

      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ message: "Inventory operation not found" });
      }
    } catch (error) {
      console.error("Error updating inventory operation:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid operation data", errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: "Failed to update inventory operation" });
      }
    }
  });

  // Start preparation endpoint - consumes ingredients
  app.patch("/api/inventory-operations/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const { status, startedAt } = req.body;

      // Validate required fields
      if (status !== InventoryOperationStatus.IN_PROGRESS) {
        return res.status(400).json({ message: "Status must be IN_PROGRESS" });
      }

      if (!startedAt) {
        return res.status(400).json({ message: "startedAt is required" });
      }

      // Get the operation to check if it can be started
      const operation = await storage.getInventoryOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Inventory operation not found" });
      }

      if (operation.status === InventoryOperationStatus.COMPLETED || operation.status === InventoryOperationStatus.CANCELLED) {
        return res.status(400).json({ message: "Operation cannot be started" });
      }

      if (operation.status === InventoryOperationStatus.IN_PROGRESS) {
        return res.status(400).json({ message: "Operation is already in progress" });
      }
      // Get operation items to consume ingredients
      const items = await storage.getInventoryOperationItems(id);

      // For preparation operations, only handle waste if any
      if (operation.type === InventoryOperationType.FABRICATION || operation.type === InventoryOperationType.FABRICATION_RELIQUAT) {
        console.log('🔍 Starting preparation - items already calculated during creation');
        // Les ingrédients sont déjà calculés lors de la création
        // Ici on ne fait que démarrer la préparation
      }

      // Update operation status
      const updateData: Partial<InsertInventoryOperation> = {
        status: InventoryOperationStatus.IN_PROGRESS,
        startedAt: startedAt
      };

      const updatedOperation = await storage.updateInventoryOperation(id, updateData);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Failed to update operation" });
      }
      // Libérer les réservations d'ingrédients une fois que la préparation commence
      if (operation.type === InventoryOperationType.FABRICATION || operation.type === InventoryOperationType.FABRICATION_RELIQUAT) {
        await storage.releaseAllReservationsForOperation(id);
      }



      res.json(updatedOperation);
    } catch (error) {
      console.error("Error starting inventory operation:", error);
      res.status(500).json({ message: "Failed to start inventory operation" });
    }
  });

  // Completion endpoint for inventory operations
  app.patch("/api/inventory-operations/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const { status, completedAt, conformQuantity, wasteReason, preparationZoneId, wasteZoneId } = req.body;

      // Validate required fields
      if (status !== InventoryOperationStatus.COMPLETED) {
        return res.status(400).json({ message: "Status must be InventoryOperationStatus.COMPLETED" });
      }

      if (!completedAt) {
        return res.status(400).json({ message: "completedAt is required" });
      }

      // Get the operation to check if it's already completed
      const operation = await storage.getInventoryOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Inventory operation not found" });
      }

      if (operation.status === InventoryOperationStatus.COMPLETED) {
        return res.status(400).json({ message: "Operation is already completed and cannot be modified" });
      }

      // Update operation status
      const updateData: Partial<InsertInventoryOperation> = {
        status: InventoryOperationStatus.COMPLETED,
        completedAt: completedAt,
        completedBy: req.body.completedBy || null
      };


      // For preparation operations, update stock with actual quantities
      if (operation.type === InventoryOperationType.FABRICATION || operation.type === InventoryOperationType.FABRICATION_RELIQUAT) {
        const conformQty = parseFloat(conformQuantity || '0');

        // Handle waste if conform quantity is less than planned
        const items = await storage.getInventoryOperationItems(id);
        const totalPlanned = items
          .filter(item => parseFloat(item.quantity || '0') > 0) // Only positive quantities (products)
          .reduce((sum, item) => sum + parseFloat(item.quantity || '0'), 0);

        // Calculate total produced quantity (conform + waste)
        const totalProduced = conformQty + (conformQty < totalPlanned ? (totalPlanned - conformQty) : 0);

        // Create lot automatically if total produced > 0
        let lotId: number | undefined;
        if (totalProduced > 0) {
          lotId = await storage.createLotForPreparationOperation(id, totalProduced, completedAt);
        }

        // Update stock with lot information
        await storage.updateStockFromOperationItems(id, conformQty, preparationZoneId, wasteZoneId, lotId);

        if (conformQty < totalPlanned && wasteReason) {
          const wasteQuantity = totalPlanned - conformQty;

          // 2. Mettre à jour tous les items de l'opération principale avec la zone de production
          if (preparationZoneId) {
            // await storage.updateAllItemsToStorageZone(id, preparationZoneId);
          }

          // 3. Créer l'opération de rebut avec parentOperationId
          const wasteOperation = {
            type: InventoryOperationType.REBUT_LIVRAISON,
            status: InventoryOperationStatus.COMPLETED,
            operatorId: operation.operatorId,
            scheduledDate: new Date().toISOString(),
            notes: `Rebut de préparation ${operation.code}: ${wasteReason || 'Aucune raison spécifiée'}`,
            parentOperationId: id
          };

          // 1. Quantité négative pour le rebut
          const wasteItems = items
            .filter(item => parseFloat(item.quantity || '0') > 0) // Only positive quantities (products)
            .map((item) => {
              const plannedQuantity = parseFloat(item.quantity || '0');
              const wasteItemQuantity = -(wasteQuantity); // NEGATIVE
              return {
                articleId: item.articleId,
                quantity: wasteItemQuantity.toString(),
                quantityBefore: item.quantityAfter || '0',
                quantityAfter: (parseFloat(item.quantityAfter || '0') + wasteItemQuantity).toString(),
                unitCost: item.unitCost || '0',
                totalCost: (parseFloat(item.unitCost || '0') * Math.abs(wasteItemQuantity)).toString(),
                notes: `Rebut de préparation ${operation.code}`,
                wasteReason: wasteReason || 'Aucune raison spécifiée',
                toStorageZoneId: wasteZoneId || item.toStorageZoneId || 1,
              };
            });

          await storage.createInventoryOperationWithItems(wasteOperation, wasteItems);
        }
      }
      const updatedOperation = await storage.updateInventoryOperation(id, updateData);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Failed to update operation" });
      }
      res.json(updatedOperation);
    } catch (error) {
      console.error("Error completing inventory operation:", error);
      res.status(500).json({ message: "Failed to complete inventory operation" });
    }
  });

  // Inventory Operation Items
  app.get("/api/inventory-operations/:operationId/items", async (req, res) => {
    try {
      const operationId = parseInt(req.params.operationId);
      if (isNaN(operationId)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const items = await storage.getInventoryOperationItems(operationId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory operation items:", error);
      res.status(500).json({ message: "Failed to fetch inventory operation items" });
    }
  });

  // Inventory Operation Lots
  app.get("/api/inventory-operations/:operationId/lots", async (req, res) => {
    try {
      // to be implemented
      throw new Error("Not implemented");
    } catch (error) {
      console.error("Error fetching inventory operation lots:", error);
      res.status(500).json({ message: "Failed to fetch inventory operation lots" });
    }
  });


  // ============ FACTURATION ROUTES ============

  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // ============ ACHATS VIA INVENTORY (PAS DE purchase_*) ============

  // Liste des "bons d'achat" remplacés par opérations d'inventaire type reception + lignes
  app.get("/api/purchase-orders", async (req, res) => {
    try {
      const { supplier_id, status } = req.query;
      // On mappe vers inventory_operations type=reception
      let ops = await storage.getInventoryOperationsByType(InventoryOperationType.RECEPTION);
      if (supplier_id) {
        ops = ops.filter(op => op.supplierId === parseInt(supplier_id as string));
      }
      if (status) {
        ops = ops.filter(op => op.status === (status as string));
      }
      res.json(ops);
    } catch (error) {
      console.error("Error fetching receptions:", error);
      res.status(500).json({ message: "Failed to fetch receptions" });
    }
  });

  app.get("/api/purchase-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const op = await storage.getInventoryOperation(id);
      if (!op || op.type !== InventoryOperationType.RECEPTION) {
        return res.status(404).json({ message: "Reception not found" });
      }
      const items = await storage.getInventoryOperationItems(id);
      res.json({ ...op, items });
    } catch (error) {
      console.error("Error fetching reception:", error);
      res.status(500).json({ message: "Failed to fetch reception" });
    }
  });

  // Création d'une réception: crée inventory_operation (header), inventory_operation_items (lignes)
  // et journal unique inventory par ligne
  app.post("/api/purchase-orders", async (req, res) => {
    try {
      const body = req.body as any;
      // On accepte payload existant de la page, on transforme vers opération
      const op = await storage.createInventoryOperation({
        type: InventoryOperationType.RECEPTION,
        status: body?.purchaseOrder?.status ?? InventoryOperationStatus.COMPLETED,
        supplierId: body?.purchaseOrder?.supplierId,
        storageZoneId: body?.items?.[0]?.storageZoneId ?? null,
        notes: body?.purchaseOrder?.notes ?? null,
        subtotalHT: body?.purchaseOrder?.subtotalHT ?? '0',
        totalTax: body?.purchaseOrder?.totalTax ?? '0',
        totalTTC: body?.purchaseOrder?.totalTTC ?? '0',
        discount: body?.purchaseOrder?.discount ?? '0',
        scheduledDate: body?.purchaseOrder?.scheduledDate || new Date().toISOString(), // Ajouté ici
      } as any);

      const items: any[] = [];
      for (const it of body.items ?? []) {
        const stockRow = await db.query.stock.findFirst({
          where: (s, { eq, and }) =>
            and(eq(s.articleId, it.articleId), eq(s.storageZoneId, it.storageZoneId ?? 0))
        });
        const currentStock = parseFloat(stockRow?.quantity || '0');
        const qtyOrdered = parseFloat(it.quantityOrdered || '0');

        const line = await storage.createInventoryOperationItem({
          operationId: op.id,
          articleId: it.articleId,
          quantity: it.quantityOrdered,
          quantityBefore: currentStock.toString(),
          quantityAfter: (currentStock + qtyOrdered).toString(),
          unitCost: it.unitPrice,
          totalCost: it.totalPrice,
          taxRate: it.taxRate,
          taxAmount: it.taxAmount,
          toStorageZoneId: it.storageZoneId ?? null,
          notes: it.notes ?? null,
        } as any);
        items.push(line);
      }

      res.status(201).json({ ...op, items });
    } catch (error) {
      console.error("Error creating reception:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create reception" });
      }
    }
  });

  app.patch("/api/purchase-orders/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (![InventoryOperationStatus.COMPLETED, InventoryOperationStatus.CANCELLED].includes(status)) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    try {
      const result = await storage.updateInventoryOperationStatus(id, status);

      // pour plutart (ingregration comptabilité)
      // await storage.createAccountingEntryFromOperation(result as InventoryOperation);

      res.json(result);

    } catch (error) {
      console.error("Error updating reception:", error);
      res.status(500).json({ message: "Failed to update reception" });
    }

  });


  // Modification complète d'une réception (PUT)
  app.put("/api/purchase-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = req.body as any;

      // Vérifier que la réception existe et est de type reception
      const existingOp = await storage.getInventoryOperation(id);
      if (!existingOp || existingOp.type !== InventoryOperationType.RECEPTION) {
        return res.status(404).json({ message: "Reception not found" });
      }

      // Si l'opération était complétée, annuler d'abord les stocks existants
      if (existingOp.status === InventoryOperationStatus.COMPLETED) {
        const existingItems = await storage.getInventoryOperationItems(id);
        for (const item of existingItems) {

          const qty = Number(item.quantity) || 0;
          if (qty > 0) {
            if (!item.toStorageZoneId) {
              throw new Error(`Missing storage zone for article ${item.articleId}`);
            }

            // Retirer du stock
            await db.insert(stockTable).values({
              articleId: item.articleId as typeof stockTable.$inferInsert["articleId"],
              storageZoneId: item.toStorageZoneId as typeof stockTable.$inferInsert["storageZoneId"],
              lotId: (item.lotId ?? null) as typeof stockTable.$inferInsert["lotId"],
              serialNumber: (item.serialNumber ?? null) as typeof stockTable.$inferInsert["serialNumber"],
              quantity: (-qty).toString(),
              updatedAt: new Date().toISOString()
            }).onConflictDoUpdate({
              target: [stockTable.articleId, stockTable.storageZoneId, stockTable.lotId, stockTable.serialNumber],
              set: {
                quantity: sql`${stockTable.quantity} - ${qty}`,
                updatedAt: sql`now()`
              }
            });

            // Mettre à jour le stock actuel de l'article
            await db.update(articles)
              .set({ currentStock: sql`${articles.currentStock} - ${qty}` })
              .where(eq(articles.id, item.articleId));
          }
        }
      }

      // Mettre à jour l'opération principale
      const updatedOp = await storage.updateInventoryOperation(id, {
        status: body?.purchaseOrder?.status ?? existingOp.status,
        supplierId: body?.purchaseOrder?.supplierId ?? existingOp.supplierId,
        storageZoneId: body?.items?.[0]?.storageZoneId ?? existingOp.storageZoneId,
        notes: body?.purchaseOrder?.notes ?? existingOp.notes,
        subtotalHT: body?.purchaseOrder?.subtotalHT ?? existingOp.subtotalHT,
        totalTax: body?.purchaseOrder?.totalTax ?? existingOp.totalTax,
        totalTTC: body?.purchaseOrder?.totalTTC ?? existingOp.totalTTC,
        discount: body?.purchaseOrder?.discount ?? existingOp.discount,
        scheduledDate: body?.purchaseOrder?.scheduledDate || existingOp.scheduledDate, // Ajouté ici
      } as any);

      // Supprimer les anciennes lignes
      const existingItems = await storage.getInventoryOperationItems(id);
      for (const item of existingItems) {
        await storage.deleteInventoryOperationItem(item.id);
      }

      // Créer les nouvelles lignes
      const items: any[] = [];
      for (const it of body.items ?? []) {

        const stockRow = await db.query.stock.findFirst({
          where: (s, { eq, and }) =>
            and(eq(s.articleId, it.articleId), eq(s.storageZoneId, it.toStorageZoneId ?? 0))
        });
        const currentStock = parseFloat(stockRow?.quantity || '0');
        const qtyOrdered = parseFloat(it.quantity || '0');

        const line = await storage.createInventoryOperationItem({
          operationId: id,
          articleId: it.articleId,
          quantity: it.quantityOrdered,
          quantityBefore: currentStock.toString(),
          quantityAfter: (currentStock + qtyOrdered).toString(),
          unitCost: it.unitPrice,
          totalCost: it.totalPrice,
          taxRate: it.taxRate,
          taxAmount: it.taxAmount,
          toStorageZoneId: it.storageZoneId ?? null,
          notes: it.notes ?? null,
        } as any);
        items.push(line);
      }

      // Si l'opération est maintenant complétée, ajouter les nouveaux stocks
      if (updatedOp && updatedOp.status === InventoryOperationStatus.COMPLETED) {
        for (const it of body.items ?? []) {
          const qty = Number(it.quantityOrdered) || 0;
          if (qty > 0) {
            if (!it.storageZoneId) {
              throw new Error(`Missing storage zone for article ${it.articleId}`);
            }

            // Ajouter au stock
            await db.insert(stockTable).values({
              articleId: it.articleId as typeof stockTable.$inferInsert["articleId"],
              storageZoneId: it.storageZoneId as typeof stockTable.$inferInsert["storageZoneId"],
              lotId: (it.lotId ?? null) as typeof stockTable.$inferInsert["lotId"],
              serialNumber: (it.serialNumber ?? null) as typeof stockTable.$inferInsert["serialNumber"],
              quantity: qty.toString(),
              updatedAt: new Date().toISOString()
            }).onConflictDoUpdate({
              target: [stockTable.articleId, stockTable.storageZoneId, stockTable.lotId, stockTable.serialNumber],
              set: {
                quantity: sql`${stockTable.quantity} + ${qty}`,
                updatedAt: sql`now()`
              }
            });

            // Mettre à jour le stock actuel de l'article
            await db.update(articles)
              .set({ currentStock: sql`${articles.currentStock} + ${qty}` })
              .where(eq(articles.id, it.articleId));
          }
        }
      }

      res.json({ ...updatedOp, items });
    } catch (error) {
      console.error("Error updating reception:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update reception" });
      }
    }
  });

  app.delete("/api/purchase-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Supprimer d'abord les lignes
      const lines = await storage.getInventoryOperationItems(id);
      for (const l of lines) {
        await storage.deleteInventoryOperationItem(l.id);
      }
      const success = await storage.deleteInventoryOperation(id);
      if (!success) {
        return res.status(404).json({ message: "Reception not found" });
      }
      res.json({ message: "Reception deleted successfully" });
    } catch (error) {
      console.error("Error deleting reception:", error);
      res.status(500).json({ message: "Failed to delete reception" });
    }
  });

  // ============ ENDPOINTS POUR LA GESTION AVANCEE DES STOCKS ============

  // Obtenir les réservations d'un article
  app.get("/api/articles/:id/reservations", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const reservations = await storage.getArticleReservations(id);
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching article reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Obtenir le stock disponible d'un article
  app.get("/api/articles/:id/available-stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const availableStock = (await storage.getArticleAvailableStock(id))?.totalDispo || 0;
      res.json({ availableStock });
    } catch (error) {
      console.error("Error fetching available stock:", error);
      res.status(500).json({ message: "Failed to fetch available stock" });
    }
  });

  // Obtenir le rapport de traçabilité d'un article
  app.get("/api/articles/:id/traceability", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const { startDate, endDate } = req.query;
      const report = await storage.getArticleTraceabilityReport(
        id,
        startDate as string,
        endDate as string
      );

      res.json(report);
    } catch (error) {
      console.error("Error fetching traceability report:", error);
      res.status(500).json({ message: "Failed to fetch traceability report" });
    }
  });


  // Créer une réservation de stock
  app.post("/api/stock-reservations", async (req, res) => {
    try {
      const reservationData = req.body;

      // Validation des données requises
      if (!reservationData.articleId || !reservationData.orderId || !reservationData.reservedQuantity) {
        return res.status(400).json({
          message: "Missing required fields: articleId, orderId, reservedQuantity"
        });
      }

      const newReservation = await storage.createStockReservation(reservationData);
      res.status(201).json(newReservation);
    } catch (error) {
      console.error("Error creating stock reservation:", error);
      res.status(500).json({ message: "Failed to create stock reservation" });
    }
  });

  // Libérer une réservation de stock
  app.patch("/api/stock-reservations/:id/release", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid reservation ID" });
      }

      const updatedReservation = await storage.releaseStockReservation(id);
      res.json(updatedReservation);
    } catch (error) {
      console.error("Error releasing stock reservation:", error);
      res.status(500).json({ message: "Failed to release stock reservation" });
    }
  });

  // Obtenir les réservations d'une opération d'inventaire
  app.get("/api/inventory-operations/:id/reservations", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const reservations = await storage.getReservationsForOperation(id);
      res.json(reservations);
    } catch (error) {
      console.error("Error getting operation reservations:", error);
      res.status(500).json({ message: "Failed to get operation reservations" });
    }
  });

  // Obtenir toutes les réservations des articles d'une opération (en excluant les réservations de l'opération elle-même)
  app.get("/api/inventory-operations/:id/other-reservations", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const reservations = await storage.getOtherReservationsForOperationArticles(id);
      res.json(reservations);
    } catch (error) {
      console.error("Error getting other reservations for operation articles:", error);
      res.status(500).json({ message: "Failed to get other reservations for operation articles" });
    }
  });

  // Créer des réservations d'ingrédients pour une préparation
  app.post("/api/inventory-operations/:id/reservations", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const operation = await storage.getInventoryOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Inventory operation not found" });
      }

      if (operation.type !== InventoryOperationType.FABRICATION && operation.type !== InventoryOperationType.FABRICATION_RELIQUAT) {
        return res.status(400).json({ message: "Operation must be a preparation type" });
      }

      const items = await storage.getInventoryOperationItems(id);
      const reservations = await storage.createIngredientReservationsForPreparation(id, items);

      res.status(201).json({
        message: "Ingredient reservations created successfully",
        reservations
      });
    } catch (error) {
      console.error("Error creating ingredient reservations:", error);
      res.status(500).json({
        message: "Failed to create ingredient reservations",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint pour vérifier la disponibilité d'un article
  app.get("/api/articles/:id/stock-details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const stockDetails = await storage.getArticleStockDetails(id);
      res.json(stockDetails);
    } catch (error) {
      console.error("Error getting article stock details:", error);
      res.status(500).json({ message: "Failed to get article stock details" });
    }
  });

  // Endpoint pour vérifier la disponibilité des ingrédients d'une recette
  app.post("/api/recipes/:id/check-availability", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }

      const { plannedQuantity } = req.body;
      if (!plannedQuantity || isNaN(parseFloat(plannedQuantity))) {
        return res.status(400).json({ message: "Invalid planned quantity" });
      }

      const availability = await storage.checkRecipeIngredientsAvailability(id, parseFloat(plannedQuantity));
      res.json(availability);
    } catch (error) {
      console.error("Error checking recipe availability:", error);
      res.status(500).json({ message: "Failed to check recipe availability" });
    }
  });

  // Endpoint pour vérifier si un article a suffisamment de stock
  app.post("/api/articles/:id/check-stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const { requiredQuantity } = req.body;
      if (!requiredQuantity || isNaN(parseFloat(requiredQuantity))) {
        return res.status(400).json({ message: "Invalid required quantity" });
      }

      const hasEnough = await storage.hasEnoughAvailableStock(id, parseFloat(requiredQuantity));
      const availableStock = (await storage.getArticleAvailableStock(id))?.totalDispo || 0;

      res.json({
        hasEnough,
        availableStock,
        requiredQuantity: parseFloat(requiredQuantity),
        shortfall: Math.max(0, parseFloat(requiredQuantity) - availableStock)
      });
    } catch (error) {
      console.error("Error checking article stock:", error);
      res.status(500).json({ message: "Failed to check article stock" });
    }
  });

  // ============ ENDPOINTS POUR LA PAGE STOCK ============

  // Endpoint pour récupérer tous les items de stock avec les détails des articles et zones
  app.get("/api/stock/items", async (req, res) => {
    try {
      const stockItems = await db
        .select({
          id: stockTable.id,
          articleId: stockTable.articleId,
          storageZoneId: stockTable.storageZoneId,
          quantity: stockTable.quantity,
          lotId: stockTable.lotId,
          article: {
            id: articles.id,
            code: articles.code,
            name: articles.name,
            type: articles.type,
            unit: articles.unit,
            costPerUnit: articles.costPerUnit,
            currentStock: articles.currentStock,
            storageZoneId: articles.storageZoneId,
            minStock: articles.minStock,
            maxStock: articles.maxStock,
          },
          storageZone: {
            id: storageZones.id,
            designation: storageZones.designation,
          },
          lot: {
            id: lots.id,
            code: lots.code,
            expirationDate: lots.expirationDate,
          },
        })
        .from(stockTable)
        .leftJoin(articles, eq(stockTable.articleId, articles.id))
        .leftJoin(storageZones, eq(stockTable.storageZoneId, storageZones.id))
        .leftJoin(lots, eq(stockTable.lotId, lots.id))
        .where(eq(articles.active, true));

      res.json(stockItems);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      res.status(500).json({ message: "Failed to fetch stock items" });
    }
  });

  // Endpoint pour récupérer les opérations d'inventaire pour un article spécifique
  app.get("/api/stock/:articleId/operations", async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const operations = await db
        .select({
          id: inventoryOperations.id,
          code: inventoryOperations.code,
          type: inventoryOperations.type,
          status: inventoryOperations.status,
          scheduledDate: inventoryOperations.scheduledDate,
          completedAt: inventoryOperations.completedAt,
          notes: inventoryOperations.notes,
          createdBy: inventoryOperations.createdBy,
          createdByUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(inventoryOperations)
        .leftJoin(users, eq(inventoryOperations.createdBy, users.id))
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${inventoryOperationItems} 
            WHERE ${inventoryOperationItems.operationId} = ${inventoryOperations.id} 
            AND ${inventoryOperationItems.articleId} = ${articleId}
          )`
        )
        .orderBy(sql`${inventoryOperations.scheduledDate} DESC`);

      // Pour chaque opération, récupérer les items correspondant à l'article
      const operationsWithItems = await Promise.all(
        operations.map(async (operation) => {
          const items = await db
            .select({
              id: inventoryOperationItems.id,
              operationId: inventoryOperationItems.operationId,
              articleId: inventoryOperationItems.articleId,
              quantity: inventoryOperationItems.quantity,
              quantityBefore: inventoryOperationItems.quantityBefore,
              quantityAfter: inventoryOperationItems.quantityAfter,
              unitCost: inventoryOperationItems.unitCost,
              fromStorageZoneId: inventoryOperationItems.fromStorageZoneId,
              toStorageZoneId: inventoryOperationItems.toStorageZoneId,
              notes: inventoryOperationItems.notes,
              createdAt: inventoryOperationItems.createdAt,
              article: {
                id: articles.id,
                code: articles.code,
                name: articles.name,
                type: articles.type,
                unit: articles.unit,
              },
              fromStorageZone: {
                id: storageZones.id,
                designation: storageZones.designation,
              },
              toStorageZone: {
                id: storageZones.id,
                designation: storageZones.designation,
              },
            })
            .from(inventoryOperationItems)
            .leftJoin(articles, eq(inventoryOperationItems.articleId, articles.id))
            .leftJoin(storageZones, eq(inventoryOperationItems.fromStorageZoneId, storageZones.id))
            .where(
              sql`${inventoryOperationItems.operationId} = ${operation.id} AND ${inventoryOperationItems.articleId} = ${articleId}`
            );

          return {
            ...operation,
            items,
          };
        })
      );

      res.json(operationsWithItems);
    } catch (error) {
      console.error("Error fetching inventory operations:", error);
      res.status(500).json({ message: "Failed to fetch inventory operations" });
    }
  });

  // ============ INVOICES ROUTES ============

  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const { clientId } = req.query;

      if (clientId) {
        const invoices = await storage.getInvoicesByClient(parseInt(clientId as string));
        res.json(invoices);
      } else {
        const invoices = await storage.getAllInvoices();
        res.json(invoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get invoice by ID
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Get invoices by order
  app.get("/api/orders/:orderId/invoices", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const invoices = await storage.getInvoicesByOrder(orderId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices for order:", error);
      res.status(500).json({ message: "Failed to fetch invoices for order" });
    }
  });

  // Get invoices from delivery operation
  app.get("/api/inventory-operations/:operationId/invoices", async (req, res) => {
    try {
      const operationId = parseInt(req.params.operationId);
      const invoices = await storage.getInvoicesFromDeliveryOperation(operationId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices from delivery operation:", error);
      res.status(500).json({ message: "Failed to fetch invoices from delivery operation" });
    }
  });

  // Create invoice from delivery operation
  app.post("/api/inventory-operations/:operationId/create-invoice", async (req, res) => {
    try {
      const operationId = parseInt(req.params.operationId);
      const invoiceData = req.body; // Optional additional data

      const invoice = await storage.createInvoiceFromDelivery(operationId, invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice from delivery:", error instanceof Error ? error.message : error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create invoice from delivery" });
    }
  });

  // Create invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Invalid invoice data" });
    }
  });

  // Update invoice
  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, updateData);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });

  // Update invoice status based on payments
  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.updateInvoiceStatus(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(400).json({ message: "Failed to update invoice status" });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInvoice(id);

      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // ============ INVOICE ITEMS ROUTES ============

  // Get items for an invoice
  app.get("/api/invoices/:invoiceId/items", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const items = await storage.getInvoiceItems(invoiceId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  // Create invoice item
  app.post("/api/invoice-items", async (req, res) => {
    try {
      const itemData = insertInvoiceItemSchema.parse(req.body);
      const item = await storage.createInvoiceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating invoice item:", error);
      res.status(400).json({ message: "Invalid invoice item data" });
    }
  });

  // Update invoice item
  app.put("/api/invoice-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertInvoiceItemSchema.partial().parse(req.body);
      const item = await storage.updateInvoiceItem(id, updateData);

      if (!item) {
        return res.status(404).json({ message: "Invoice item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error updating invoice item:", error);
      res.status(400).json({ message: "Failed to update invoice item" });
    }
  });

  // Delete invoice item
  app.delete("/api/invoice-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInvoiceItem(id);

      if (!deleted) {
        return res.status(404).json({ message: "Invoice item not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  // ============ PAYMENTS ROUTES ============



  // Get outstanding payments
  app.get("/api/payments/outstanding", async (req, res) => {
    try {
      const outstandingPayments = await storage.getOutstandingPayments();
      res.json(outstandingPayments);
    } catch (error) {
      console.error("Error fetching outstanding payments:", error);
      res.status(500).json({ message: "Failed to fetch outstanding payments" });
    }
  });

  // Get payment statistics
  app.get("/api/payments/statistics", async (req, res) => {
    try {
      const statistics = await storage.getPaymentStatistics();
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching payment statistics:", error);
      res.status(500).json({ message: "Failed to fetch payment statistics" });
    }
  });

  // Get payment by ID
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  // Get payments for an invoice
  app.get("/api/invoices/:invoiceId/payments", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const payments = await storage.getPaymentsByInvoice(invoiceId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments for invoice:", error);
      res.status(500).json({ message: "Failed to fetch payments for invoice" });
    }
  });

  // Create payment
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  // Update payment
  app.put("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertPaymentSchema.partial().parse(req.body);
      const payment = await storage.updatePayment(id, updateData);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(400).json({ message: "Failed to update payment" });
    }
  });

  // Delete payment
  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePayment(id);

      if (!deleted) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // Stock reservations routes
  app.post("/api/stock-reservations", async (req, res) => {
    try {
      const reservationData = insertStockReservationSchema.parse(req.body);
      const newReservation = await storage.createStockReservation(reservationData);
      res.status(201).json(newReservation);
    } catch (error) {
      console.error("Error creating stock reservation:", error);
      res.status(500).json({ message: "Failed to create stock reservation" });
    }
  });

  app.patch("/api/stock-reservations/:id/release", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedReservation = await storage.releaseStockReservation(parseInt(id));
      res.json(updatedReservation);
    } catch (error) {
      console.error("Error releasing stock reservation:", error);
      res.status(500).json({ message: "Failed to release stock reservation" });
    }
  });

  // Route pour récupérer les informations de disponibilité des articles pour la répartition des livraisons
  app.get("/api/articles/:articleId/availability", async (req, res) => {
    try {
      const { articleId } = req.params;
      const { excludeDeliveryId } = req.query;
      const articleIdNum = parseInt(articleId);
      const excludeDeliveryIdNum = excludeDeliveryId ? parseInt(excludeDeliveryId as string) : undefined;

      if (isNaN(articleIdNum)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      // Récupérer l'article
      const article = await storage.getArticle(articleIdNum);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      // Récupérer les lots de l'article
      const articleLots = await db.select().from(lots).where(eq(lots.articleId, articleIdNum));
      // Récupérer les zones de stockage où l'article existe
      const articleZones = await db.select().from(storageZones)
        .where(sql`EXISTS (
          SELECT 1 FROM stock 
          WHERE stock.article_id = ${articleIdNum} 
          AND stock.storage_zone_id = storage_zones.id
          AND stock.quantity > 0
        )`);
      // Récupérer toutes les réservations actives (order, preparation, delivery)
      const whereConditions = [
        eq(stockReservations.articleId, articleIdNum),
        eq(stockReservations.status, StockReservationStatus.RESERVED)
      ];

      // Exclure les réservations de la livraison spécifiée si fournie
      if (excludeDeliveryIdNum) {
        whereConditions.push(sql`${stockReservations.inventoryOperationId} != ${excludeDeliveryIdNum}`);
      }

      const reservations = await db.select().from(stockReservations)
        .where(and(...whereConditions));
      // Calculer la disponibilité par lot et zone
      const availability = [];
      for (const lot of articleLots) {
        for (const zone of articleZones) {
          // Récupérer le stock disponible pour ce lot et cette zone
          const stockQuery = await db
            .select({ quantity: stockTable.quantity })
            .from(stockTable)
            .where(
              and(
                eq(stockTable.articleId, articleIdNum),
                eq(stockTable.storageZoneId, zone.id),
                eq(stockTable.lotId, lot.id),
                sql`${stockTable.quantity} > 0`
              )
            );
          if (stockQuery.length > 0) {
            const stockQuantity = parseFloat(stockQuery[0].quantity);
            // Calculer les réservations pour ce lot et cette zone
            const reservedQuantity = reservations
              .filter(r => r.lotId === lot.id && r.storageZoneId === zone.id)
              .reduce((sum, r) => sum + parseFloat(r.reservedQuantity), 0);
            const availableQuantity = stockQuantity - reservedQuantity;

            availability.push({
              lotId: lot.id,
              lotCode: lot.code,
              lotExpirationDate: lot.expirationDate,
              storageZoneId: zone.id,
              storageZoneCode: zone.code,
              storageZoneDesignation: zone.designation,
              stockQuantity,
              reservedQuantity,
              availableQuantity,
              isPerishable: article.isPerishable,
              requiresLotSelection: article.isPerishable || articleLots.length > 1,
              requiresZoneSelection: articleZones.length > 1
            });
          }
        }
      }
      // Si l'article n'a pas de lots, vérifier la disponibilité générale
      if (articleLots.length === 0 || availability.length == 0) {
        for (const zone of articleZones) {
          const stockQuery = await db
            .select({ quantity: stockTable.quantity })
            .from(stockTable)
            .where(
              and(
                eq(stockTable.articleId, articleIdNum),
                eq(stockTable.storageZoneId, zone.id),
                isNull(stockTable.lotId),
                sql`${stockTable.quantity} > 0`
              )
            );
          if (stockQuery.length > 0) {
            const stockQuantity = parseFloat(stockQuery[0].quantity);
            // Calculer les réservations pour cette zone (sans lot)
            const reservedQuantity = reservations
              .filter(r => !r.lotId && r.storageZoneId === zone.id)
              .reduce((sum, r) => sum + parseFloat(r.reservedQuantity), 0);
            const availableQuantity = stockQuantity - reservedQuantity;

            availability.push({
              lotId: null,
              lotCode: null,
              lotExpirationDate: null,
              storageZoneId: zone.id,
              storageZoneCode: zone.code,
              storageZoneDesignation: zone.designation,
              stockQuantity,
              reservedQuantity,
              availableQuantity,
              isPerishable: article.isPerishable,
              requiresLotSelection: false,
              requiresZoneSelection: articleZones.length > 1
            });

          }
        }
      }
      res.json({
        article,
        availability,
        summary: {
          totalStock: availability.reduce((sum, a) => sum + a.stockQuantity, 0),
          totalReserved: availability.reduce((sum, a) => sum + a.reservedQuantity, 0),
          totalAvailable: availability.reduce((sum, a) => sum + a.availableQuantity, 0),
          requiresLotSelection: article.isPerishable || articleLots.length > 1,
          requiresZoneSelection: articleZones.length > 1,
          canDirectDelivery: articleLots.length === 1 && articleZones.length === 1 && !article.isPerishable
        }
      });
    } catch (error) {
      console.error("Error fetching article availability:", error);
      res.status(500).json({ message: "Failed to fetch article availability" });
    }
  });

  // Route pour créer un lot
  app.post("/api/lots", async (req, res) => {
    try {
      const { articleId, code, manufacturingDate, useDate, expirationDate, alertDate, supplierId, notes } = req.body;

      // Validation des données
      if (!articleId || !code) {
        return res.status(400).json({ message: "L'ID de l'article et le code du lot sont requis" });
      }

      // Vérifier que le code du lot est unique
      const existingLot = await db
        .select()
        .from(lots)
        .where(eq(lots.code, code));

      if (existingLot.length > 0) {
        return res.status(400).json({ message: "Un lot avec ce code existe déjà" });
      }

      // Créer le lot
      const newLot = await db
        .insert(lots)
        .values({
          articleId: parseInt(articleId),
          code,
          manufacturingDate: manufacturingDate || null,
          useDate: useDate || null,
          expirationDate: expirationDate || null,
          alertDate: alertDate || null,
          supplierId: supplierId ? parseInt(supplierId) : null,
          notes: notes || null,
        })
        .returning();

      res.status(201).json(newLot[0]);
    } catch (error) {
      console.error("Error creating lot:", error);
      res.status(500).json({ message: "Erreur lors de la création du lot" });
    }
  });

  // Route pour récupérer les lots (optionnellement filtrés par zone)
  app.get("/api/lots", async (req, res) => {
    try {
      const { storageZoneId, articleId } = req.query;
      let lotsResult = [];

      if (storageZoneId) {
        // 1. Lots dont l'article est en stock dans la zone
        lotsResult = await db.select().from(lots)
          .where(sql`${lots.articleId} IN (SELECT article_id FROM stock WHERE storage_zone_id = ${storageZoneId})`);
        // 2. Si aucun lot trouvé, lots des articles dont la zone par défaut correspond
        if (lotsResult.length === 0) {
          lotsResult = await db.select().from(lots)
            .where(sql`${lots.articleId} IN (SELECT id FROM articles WHERE storage_zone_id = ${storageZoneId})`);
        }
      } else if (articleId) {
        // Filtrer par article spécifique
        lotsResult = await db.select().from(lots)
          .where(eq(lots.articleId, parseInt(articleId as string)));
      } else {
        // Récupérer tous les lots avec les informations de l'article
        lotsResult = await db
          .select({
            id: lots.id,
            articleId: lots.articleId,
            code: lots.code,
            manufacturingDate: lots.manufacturingDate,
            useDate: lots.useDate,
            expirationDate: lots.expirationDate,
            alertDate: lots.alertDate,
            supplierId: lots.supplierId,
            notes: lots.notes,
            createdAt: lots.createdAt,
            // Informations de l'article
            articleName: articles.name,
            articleCode: articles.code,
            articleUnit: articles.unit,
            // Informations du fournisseur
            supplierName: suppliers.companyName,
            supplierCode: suppliers.code,
          })
          .from(lots)
          .leftJoin(articles, eq(lots.articleId, articles.id))
          .leftJoin(suppliers, eq(lots.supplierId, suppliers.id))
          .orderBy(lots.createdAt);
      }

      res.json(lotsResult);
    } catch (error) {
      console.error("Error fetching lots:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des lots" });
    }
  });

  // Route pour récupérer un lot spécifique
  app.get("/api/lots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lotResult = await db
        .select({
          id: lots.id,
          articleId: lots.articleId,
          code: lots.code,
          manufacturingDate: lots.manufacturingDate,
          useDate: lots.useDate,
          expirationDate: lots.expirationDate,
          alertDate: lots.alertDate,
          supplierId: lots.supplierId,
          notes: lots.notes,
          createdAt: lots.createdAt,
          // Informations de l'article
          articleName: articles.name,
          articleCode: articles.code,
          articleUnit: articles.unit,
          // Informations du fournisseur
          supplierName: suppliers.companyName,
          supplierCode: suppliers.code,
        })
        .from(lots)
        .leftJoin(articles, eq(lots.articleId, articles.id))
        .leftJoin(suppliers, eq(lots.supplierId, suppliers.id))
        .where(eq(lots.id, parseInt(id)))
        .limit(1);

      if (lotResult.length === 0) {
        return res.status(404).json({ message: "Lot non trouvé" });
      }

      res.json(lotResult[0]);
    } catch (error) {
      console.error("Error fetching lot:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du lot" });
    }
  });

  // Route pour mettre à jour un lot
  app.put("/api/lots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { code, manufacturingDate, useDate, expirationDate, alertDate, supplierId, notes } = req.body;

      // Vérifier que le lot existe
      const existingLot = await db
        .select()
        .from(lots)
        .where(eq(lots.id, parseInt(id)))
        .limit(1);

      if (existingLot.length === 0) {
        return res.status(404).json({ message: "Lot non trouvé" });
      }

      // Vérifier que le code du lot est unique (si modifié)
      if (code && code !== existingLot[0].code) {
        const duplicateLot = await db
          .select()
          .from(lots)
          .where(eq(lots.code, code))
          .limit(1);

        if (duplicateLot.length > 0) {
          return res.status(400).json({ message: "Un lot avec ce code existe déjà" });
        }
      }

      // Mettre à jour le lot
      const updatedLot = await db
        .update(lots)
        .set({
          code: code || existingLot[0].code,
          manufacturingDate: manufacturingDate || null,
          useDate: useDate || null,
          expirationDate: expirationDate || null,
          alertDate: alertDate || null,
          supplierId: supplierId ? parseInt(supplierId) : null,
          notes: notes || null,
        })
        .where(eq(lots.id, parseInt(id)))
        .returning();

      res.json(updatedLot[0]);
    } catch (error) {
      console.error("Error updating lot:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du lot" });
    }
  });

  // Route pour supprimer un lot
  app.delete("/api/lots/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que le lot existe
      const existingLot = await db
        .select()
        .from(lots)
        .where(eq(lots.id, parseInt(id)))
        .limit(1);

      if (existingLot.length === 0) {
        return res.status(404).json({ message: "Lot non trouvé" });
      }

      // Vérifier s'il y a des stocks associés à ce lot
      const stockWithLot = await db
        .select()
        .from(stockTable)
        .where(eq(stockTable.lotId, parseInt(id)))
        .limit(1);

      if (stockWithLot.length > 0) {
        return res.status(400).json({
          message: "Impossible de supprimer ce lot car il est associé à des stocks existants"
        });
      }

      // Supprimer le lot
      await db
        .delete(lots)
        .where(eq(lots.id, parseInt(id)));

      res.json({ message: "Lot supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting lot:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du lot" });
    }
  });

  //        ----------------------- DELIVERIES -----------------------
  app.get("/api/deliveries", async (req, res) => {
    try {
      const { orderId, clientId, status } = req.query;

      // Récupérer les livraisons avec filtres
      const deliveries = await storage.getInventoryOperationsByType(InventoryOperationType.LIVRAISON, false);

      // Filtrer par orderId si fourni
      let filteredDeliveries = deliveries;
      if (orderId) {
        filteredDeliveries = deliveries.filter(d => d.orderId === parseInt(orderId as string));
      }

      // Récupérer toutes les données nécessaires en une seule fois
      const deliveriesWithFullData = await Promise.all(
        filteredDeliveries.map(async (delivery) => {
          // Récupérer les items de la livraison
          const items = await storage.getInventoryOperationItems(delivery.id);

          // Récupérer les données de la commande si elle existe
          let order = null;
          let client = null;
          if (delivery.orderId) {
            order = await storage.getOrder(delivery.orderId);
            if (order && order.clientId) {
              client = await storage.getClient(order.clientId);
            }
          }

          // Enrichir les items avec les données des articles
          const enrichedItems = await Promise.all(
            items.map(async (item) => {
              const article = await storage.getArticle(item.articleId);
              return {
                ...item,
                article: article ? {
                  id: article.id,
                  name: article.name,
                  code: article.code,
                  unit: article.unit,
                  unitPrice: article.salePrice
                } : null
              };
            })
          );

          return {
            ...delivery,
            items: enrichedItems,
            order: order ? {
              id: order.id,
              code: order.code,
              totalTTC: order.totalTTC,
              createdAt: order.createdAt,
              deliveryDate: order.deliveryDate
            } : null,
            client: client ? {
              id: client.id,
              name: client.type === CLIENT_TYPE ? client.companyName : `${client.firstName} ${client.lastName}`,
              type: client.type
            } : null
          };
        })
      );

      // Filtrer par clientId si fourni
      let finalDeliveries = deliveriesWithFullData;
      if (clientId) {
        finalDeliveries = deliveriesWithFullData.filter(d => d.client?.id === parseInt(clientId as string));
      }

      // Filtrer par status si fourni
      if (status) {
        finalDeliveries = finalDeliveries.filter(d => d.status === status);
      }

      res.json(finalDeliveries);
    } catch (error) {
      console.error("Erreur lors de la récupération des livraisons:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des livraisons" });
    }
  });

  // API optimisée pour la page deliveries - récupère toutes les données nécessaires
  app.get("/api/deliveries/page-data", async (req, res) => {
    try {
      const { orderId, excludeDeliveryId } = req.query;

      // Récupérer toutes les livraisons avec leurs données complètes
      const deliveries = await storage.getInventoryOperationsByType(InventoryOperationType.LIVRAISON, false);

      // Filtrer par orderId si fourni
      let filteredDeliveries = deliveries;
      if (orderId) {
        filteredDeliveries = deliveries.filter(d => d.orderId === parseInt(orderId as string));
      }


      // Récupérer toutes les données nécessaires en parallèle
      const excludeDeliveryIdNum = excludeDeliveryId ? parseInt(excludeDeliveryId as string) : undefined;
      const [allClients, allArticles, allOrders] = await Promise.all([
        storage.getAllClients(),
        storage.getAllAvailableArticlesStock(true, excludeDeliveryIdNum),
        orderId ?
          (async () => {
            const singleOrder = await storage.getOrder(parseInt(orderId as string));
            return singleOrder ? [singleOrder] : [];
          })() :
          storage.getAllOrders()
      ]);

      // Créer des maps pour un accès rapide
      const ordersMap = new Map(allOrders.map((o: any) => [o.id, o]));

      // Récupérer tous les IDs de livraisons et commandes pour les requêtes optimisées
      const deliveryIds = filteredDeliveries.map(d => d.id);
      const orderIds = [...new Set(filteredDeliveries.map(d => d.orderId).filter(Boolean))];

      // Récupérer tous les items de livraisons en une seule requête
      const allDeliveryItems = await db.execute(sql`
        SELECT 
          ioi.id,
          ioi.operation_id as "operationId",
          ioi.article_id as "articleId",
          ioi.quantity,
          ioi.quantity_before as "quantityBefore",
          ioi.quantity_after as "quantityAfter",
          ioi.unit_cost as "unitCost",
          ioi.from_storage_zone_id as "fromStorageZoneId",
          ioi.to_storage_zone_id as "toStorageZoneId",
          ioi.lot_id as "lotId",
          ioi.notes,
          ioi.created_at as "createdAt",
          -- Zone de stockage source
          CASE 
            WHEN sz_from.id IS NOT NULL THEN json_build_object(
              'id', sz_from.id,
              'designation', sz_from.designation,
              'code', sz_from.code
            )
            ELSE NULL
          END as "fromStorageZone",
          -- Lot
          CASE 
            WHEN l.id IS NOT NULL THEN json_build_object(
              'id', l.id,
              'code', l.code,
              'expirationDate', l.expiration_date
            )
            ELSE NULL
          END as "lot"
        FROM inventory_operation_items ioi
        LEFT JOIN storage_zones sz_from ON sz_from.id = ioi.from_storage_zone_id
        LEFT JOIN lots l ON l.id = ioi.lot_id
        WHERE ioi.operation_id = ANY(${sql.raw(`ARRAY[${deliveryIds.join(",")}]::int[]`)})
        ORDER BY ioi.operation_id, ioi.id
      `);

      // Récupérer tous les items de commandes en une seule requête si nécessaire
      let allOrderItems: any[] = [];
      if (orderIds.length > 0) {
        const orderItemsResult = await db.execute(sql`
          SELECT 
            oi.id,
            oi.order_id as "orderId",
            oi.article_id as "articleId",
            oi.quantity,
            oi.unit_price as "unitPrice",
            oi.total_price as "totalPrice"
          FROM order_items oi
          WHERE oi.order_id = ANY(${sql.raw(`ARRAY[${orderIds.join(",")}]::int[]`)})
          ORDER BY oi.order_id, oi.id
        `);
        allOrderItems = orderItemsResult.rows;
      }

      // Grouper les items par livraison et commande
      const itemsByDelivery = new Map<number, any[]>();
      const itemsByOrder = new Map<number, any[]>();

      allDeliveryItems.rows.forEach((item: any) => {
        const deliveryId = item.operationId;
        if (!itemsByDelivery.has(deliveryId)) {
          itemsByDelivery.set(deliveryId, []);
        }
        itemsByDelivery.get(deliveryId)!.push(item);
      });

      allOrderItems.forEach((item: any) => {
        const orderId = item.orderId;
        if (!itemsByOrder.has(orderId)) {
          itemsByOrder.set(orderId, []);
        }
        itemsByOrder.get(orderId)!.push(item);
      });

      // Enrichir les livraisons avec toutes les données
      const enrichedDeliveries = filteredDeliveries.map((delivery) => {
        const items = itemsByDelivery.get(delivery.id) || [];

        // Calculer les totaux pour cette livraison
        let totalOrdred = 0;
        let totalDelivred = 0;

        if (delivery.orderId) {
          const orderItems = itemsByOrder.get(delivery.orderId) || [];

          // Calculer le total commandé (somme des quantités de tous les articles de la commande)
          totalOrdred = orderItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);

          // Calculer le total livré pour cette livraison spécifique
          // Exclure les livraisons annulées du calcul des quantités livrées
          if (delivery.status !== InventoryOperationStatus.CANCELLED) {
            totalDelivred = items.reduce((sum, item) => sum + parseFloat(String(item.quantity)), 0);
          }
        }

        // Déterminer si c'est une livraison partielle
        const livraisonPartielle = totalOrdred > totalDelivred;

        return {
          ...delivery,
          items,
          totalOrdred: totalOrdred,
          totalDelivred: totalDelivred,
          isPartial: livraisonPartielle,
        };
      });

      // Si orderId est spécifié, enrichir la commande correspondante avec les détails de livraison
      if (orderId) {
        const orderIdNum = parseInt(orderId as string);
        const order = ordersMap.get(orderIdNum);
        if (order) {
          // Récupérer les livraisons existantes pour cette commande
          const existingDeliveries = await storage.getInventoryOperationsByOrder(orderIdNum);
          const orderItems = itemsByOrder.get(orderIdNum) || [];

          // Pour chaque item, calculer qté déjà livrée et qté restante
          const itemsWithDelivery = orderItems.map(item => {
            // Somme des quantités livrées pour cet article dans toutes les livraisons
            // Exclure les livraisons annulées du calcul
            let delivered = 0;
            existingDeliveries.forEach(delivery => {
              // Ne pas compter les livraisons annulées
              if (delivery.status !== InventoryOperationStatus.CANCELLED) {
                delivery.items.forEach(deliveryItem => {
                  if (deliveryItem.articleId === item.articleId) {
                    delivered += parseFloat(deliveryItem.quantity);
                  }
                });
              }
            });
            const quantityOrdered = parseFloat(item.quantity);

            return {
              articleId: item.articleId,
              quantityOrdered,
              quantityDelivered: delivered,
              quantityRemaining: Math.max(0, quantityOrdered - delivered),
            };
          });

          // Enrichir la commande dans la map avec les détails de livraison
          (ordersMap as any).set(orderIdNum, {
            ...order,
            deliveryDetails: {
              items: itemsWithDelivery,
            }
          });
        }
      }

      const responseData = {
        deliveries: enrichedDeliveries,
        clients: allClients.map(c => ({
          id: c.id,
          name: c.type === CLIENT_TYPE ? c.companyName : `${c.firstName} ${c.lastName}`,
          type: c.type
        })),
        orders: Array.from(ordersMap.values()).map((o: any) => ({
          id: o.id,
          code: o.code,
          clientId: o.clientId,
          totalTTC: o.totalTTC,
          createdAt: o.createdAt,
          deliveryDate: o.deliveryDate,
          notes: o.notes,
          // Inclure les détails de livraison si disponibles
          ...(o.deliveryDetails && { deliveryDetails: o.deliveryDetails })
        })),
        articles: allArticles.map(a => ({
          id: a.id,
          name: a.name,
          code: a.code,
          unit: a.unit,
          photo: a.photo,
          stockInfo: (a as any).stockInfo,
          totalStock: a.totalStock,
          totalDispo: a.totalDispo,
          unitPrice: a.unitPrice,
          isPerishable: a.isPerishable
        }))
      };

      res.json(responseData);
    } catch (error) {
      console.error("Erreur lors de la récupération des données de la page deliveries:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
  });

  // Détails de livraison pour une commande spécifique (utilisé pour enrichir côté client sans recharger toute la page)
  app.get("/api/orders/:id/delivery-details", async (req, res) => {
    try {
      const orderIdNum = parseInt(req.params.id);
      const excludeDeliveryId = req.query.excludeDeliveryId ? parseInt(req.query.excludeDeliveryId as string) : null;

      if (Number.isNaN(orderIdNum)) {
        return res.status(400).json({ message: "orderId invalide" });
      }

      const order = await storage.getOrder(orderIdNum);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      const [orderItems, existingDeliveries] = await Promise.all([
        storage.getOrderItems(orderIdNum),
        storage.getInventoryOperationsByOrder(orderIdNum)
      ]);

      const itemsWithDelivery = orderItems.map((item: any) => {
        let delivered = 0;
        existingDeliveries.forEach((delivery: any) => {
          // Exclure la livraison spécifiée si elle est en cours de modification
          if (excludeDeliveryId && delivery.id === excludeDeliveryId) {
            return;
          }

          // Exclure les livraisons annulées du calcul des quantités
          if (delivery.status === InventoryOperationStatus.CANCELLED) {
            return;
          }

          (delivery.items || []).forEach((deliveryItem: any) => {
            if (deliveryItem.articleId === item.articleId) {
              delivered += parseFloat(deliveryItem.quantity);
            }
          });
        });
        const quantityOrdered = parseFloat(item.quantity);
        return {
          id: item.id,
          articleId: item.articleId,
          quantityOrdered,
          quantityDelivered: delivered,
          quantityRemaining: Math.max(0, quantityOrdered - delivered),
        };
      });

      return res.json({
        orderId: orderIdNum,
        items: itemsWithDelivery,
      });
    } catch (error) {
      console.error("Erreur /api/orders/:id/delivery-details:", error);
      return res.status(500).json({ message: "Erreur lors de la récupération des détails de livraison de la commande" });
    }
  });


  // Création d'une livraison
  app.post("/api/deliveries", async (req, res) => {
    try {
      // Validation input
      const { deliveryDate, scheduledDate, note, orderId, clientId, items } = req.body;
      if (!orderId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "orderId et items sont requis" });
      }

      // Récupérer les données de la commande
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      // Construction des items avec calculs automatiques
      const opItems = await Promise.all(items.map(async (it: any) => {
        const article = await storage.getArticle(it.idArticle);
        const orderItem = it.idOrderItem ? await storage.getOrderItem(it.idOrderItem) : null;

        // Calculer les quantités avant et après
        const currentStock = parseFloat(article?.currentStock || '0');
        const quantityToDeliver = parseFloat(it.qteLivree);
        const quantityAfter = currentStock - quantityToDeliver;

        // Calculer les coûts
        const unitCost = parseFloat(article?.costPerUnit || '0');
        const totalCost = unitCost * quantityToDeliver;
        const unitPriceSale = parseFloat(orderItem?.unitPrice?.toString() || "0.00");
        const totalPriceSale = unitPriceSale * quantityToDeliver;
        const taxRate = parseFloat(orderItem?.taxRate || "0.00") == 0
          ? 0 : parseFloat(orderItem?.taxRate || "0.00") / 100;

        return {
          articleId: it.idArticle,
          fromStorageZoneId: it.idzone,
          lotId: it.idlot,
          quantity: it.qteLivree,
          quantityBefore: currentStock.toString(),
          quantityAfter: quantityAfter.toString(),
          unitCost: unitCost.toString(),
          totalCost: totalCost.toString(),
          taxAmountCost: (totalCost * taxRate).toString(),
          orderItemId: it.idOrderItem || orderItem?.id || null,
          taxRate: orderItem?.taxRate?.toString() || "0.00", // Taxe de l'article
          // Ajouter les prix de vente pour le calcul des montants
          unitPriceSale: unitPriceSale.toString(),
          totalPriceSale: totalPriceSale.toString(),
          taxAmountSale: (totalPriceSale * taxRate).toString(),

        };
      }));

      // Calculer les montants totaux basés sur les articles réellement livrés
      let subtotalHT = 0;
      let totalTax = 0;
      let totalTTC = 0;

      for (const item of opItems) {
        const quantity = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.unitPriceSale || '0');
        const taxRate = parseFloat(item.taxRate || '0');

        const itemSubtotal = quantity * unitPrice;
        const itemTax = itemSubtotal * (taxRate / 100);
        const itemTotal = itemSubtotal + itemTax;

        subtotalHT += itemSubtotal;
        totalTax += itemTax;
        totalTTC += itemTotal;
      }

      // Construction de l'opération avec scheduled_date et montants calculés
      const operation = {
        type: InventoryOperationType.LIVRAISON,
        orderId,
        clientId,
        notes: note,
        deliveryDate,
        scheduledDate: scheduledDate || deliveryDate, // Utiliser scheduledDate si fourni, sinon deliveryDate
        status: InventoryOperationStatus.DRAFT,
        subtotalHT: subtotalHT.toFixed(2),
        totalTax: totalTax.toFixed(2),
        totalTTC: totalTTC.toFixed(2),
      };

      // Création transactionnelle
      const created = await storage.createInventoryOperationWithItems(operation, opItems);
      res.status(201).json(created);
    } catch (error) {
      console.error("Erreur création livraison:", error);
      res.status(500).json({ message: "Erreur lors de la création de la livraison" });
    }
  });

  // Modification d'une livraison
  app.put("/api/deliveries/:id", async (req, res) => {
    try {
      const operationId = parseInt(req.params.id);
      const { deliveryDate, scheduledDate, note, orderId, items } = req.body;
      if (!orderId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "orderId et items sont requis" });
      }

      // Récupérer les données de la commande
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      // Construction des items avec calculs automatiques
      const opItems = await Promise.all(items.map(async (it: any) => {
        const article = await storage.getArticle(it.idArticle);
        const orderItem = it.idOrderItem ? await storage.getOrderItem(it.idOrderItem) : null;

        // Calculer les quantités avant et après
        const currentStock = parseFloat(article?.currentStock || '0');
        const quantityToDeliver = parseFloat(it.qteLivree);
        const quantityAfter = currentStock - quantityToDeliver;

        // Calculer les coûts
        const unitCost = parseFloat(article?.costPerUnit || '0');
        const totalCost = unitCost * quantityToDeliver;
        const unitPriceSale = parseFloat(orderItem?.unitPrice?.toString() || "0.00");
        const totalPriceSale = unitPriceSale * quantityToDeliver;
        const taxRate = parseFloat(orderItem?.taxRate || "0.00") == 0
          ? 0 : parseFloat(orderItem?.taxRate || "0.00") / 100;

        return {
          articleId: it.idArticle,
          fromStorageZoneId: it.idzone,
          lotId: it.idlot,
          quantity: it.qteLivree,
          quantityBefore: currentStock.toString(),
          quantityAfter: quantityAfter.toString(),
          unitCost: unitCost.toString(),
          totalCost: totalCost.toString(),
          taxAmountCost: (totalCost * taxRate).toString(),
          orderItemId: it.idOrderItem || orderItem?.id || null,
          taxRate: orderItem?.taxRate?.toString() || "0.00", // Taxe de l'article
          // Ajouter les prix de vente pour le calcul des montants
          unitPriceSale: unitPriceSale.toString(),
          totalPriceSale: totalPriceSale.toString(),
          taxAmountSale: (totalPriceSale * taxRate).toString(),

        };
      }));

      // Calculer les montants totaux basés sur les articles réellement livrés
      let subtotalHT = 0;
      let totalTax = 0;
      let totalTTC = 0;

      for (const item of opItems) {
        const quantity = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.unitPriceSale || '0');
        const taxRate = parseFloat(item.taxRate || '0');

        const itemSubtotal = quantity * unitPrice;
        const itemTax = itemSubtotal * (taxRate / 100);
        const itemTotal = itemSubtotal + itemTax;

        subtotalHT += itemSubtotal;
        totalTax += itemTax;
        totalTTC += itemTotal;
      }

      // Construction de l'opération avec scheduled_date et montants calculés
      const operation = {
        type: InventoryOperationType.LIVRAISON,
        orderId,
        notes: note,
        deliveryDate,
        scheduledDate: scheduledDate || deliveryDate, // Utiliser scheduledDate si fourni, sinon deliveryDate
        status: InventoryOperationStatus.DRAFT,
        subtotalHT: subtotalHT.toFixed(2),
        totalTax: totalTax.toFixed(2),
        totalTTC: totalTTC.toFixed(2),
      };

      // Update transactionnel
      const updated = await storage.updateInventoryOperationWithItems(operationId, operation, opItems);
      res.json(updated);
    } catch (error) {
      console.error("Erreur modification livraison:", error);
      res.status(500).json({ message: "Erreur lors de la modification de la livraison" });
    }
  });

  // Suppression d'une livraison
  app.delete("/api/deliveries/:id", async (req, res) => {
    try {
      const operationId = parseInt(req.params.id);

      // Vérifier que l'opération existe et est bien une livraison
      const operation = await storage.getInventoryOperation(operationId);
      if (!operation) {
        return res.status(404).json({ message: "Livraison non trouvée" });
      }

      if (operation.type !== InventoryOperationType.LIVRAISON) {
        return res.status(400).json({ message: "Cette opération n'est pas une livraison" });
      }

      // Vérifier le statut - on ne peut pas supprimer une livraison validée
      if (operation.status === InventoryOperationStatus.COMPLETED) {
        return res.status(400).json({ message: "Impossible de supprimer une livraison validée" });
      }

      // Supprimer l'opération d'inventaire (cela supprimera aussi les items associés)
      const deleted = await storage.deleteInventoryOperation(operationId);

      if (deleted) {
        res.json({ message: "Livraison supprimée avec succès" });
      } else {
        res.status(500).json({ message: "Erreur lors de la suppression de la livraison" });
      }
    } catch (error) {
      console.error("Erreur suppression livraison:", error);
      res.status(500).json({ message: "Erreur lors de la suppression de la livraison" });
    }
  });


  // Supprimer/libérer toutes les réservations de stock pour une livraison
  // app.delete("/api/deliveries/:id/reservations", async (req, res) => {
  //   try {
  //     const deliveryOperationId = parseInt(req.params.id);
  //     // Annule toutes les réservations actives de type StockReservationType.DELIVERY pour cette opération
  //     const result = await db.update(stockReservations)
  //       .set({ status: StockReservationStatus.CANCELLED })
  //       .where(and(
  //         eq(stockReservations.inventoryOperationId, deliveryOperationId),
  //         eq(stockReservations.reservationType, StockReservationType.DELIVERY),
  //         eq(stockReservations.status, StockReservationStatus.RESERVED)
  //       ));
  //     res.json({ cancelledCount: result.rowCount || 0 });
  //   } catch (error) {
  //     console.error("Erreur lors de la suppression des réservations de livraison:", error);
  //     res.status(500).json({ message: error instanceof Error ? error.message : "Erreur lors de la suppression des réservations de livraison" });
  //   }
  // });

  // // Lister toutes les réservations de stock pour une livraison
  // app.get("/api/deliveries/:id/reservations", async (req, res) => {
  //   try {
  //     const deliveryOperationId = parseInt(req.params.id);
  //     const reservations = await db.select().from(stockReservations)
  //       .where(and(
  //         eq(stockReservations.inventoryOperationId, deliveryOperationId),
  //         eq(stockReservations.reservationType, StockReservationType.DELIVERY)
  //       ));
  //     res.json(reservations);
  //   } catch (error) {
  //     console.error("Erreur lors de la récupération des réservations de livraison:", error);
  //     res.status(500).json({ message: error instanceof Error ? error.message : "Erreur lors de la récupération des réservations de livraison" });
  //   }
  // });

  // Récupérer les détails d'une livraison avec ses items
  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      if (isNaN(deliveryId)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      // 🔹 1. Requête unique avec jointures
      const rows = await db
        .select({
          articleId: articles.id,
          articleName: articles.name,
          articlePhoto: articles.photo,
          articleUnit: articles.saleUnit, // car c’est une LIVRAISON
          zoneId: storageZones.id,
          zoneName: storageZones.designation,
          lotId: lots.id,
          lotName: lots.code,
          quantity: inventoryOperationItems.quantity,
          notes: inventoryOperationItems.notes,
          // returnQuantity: inventoryOperationItems.returnQuantity,
          // wasteQuantity: inventoryOperationItems.wasteQuantity,
          // returnReason: inventoryOperationItems.returnReason,
          // wasteReason: inventoryOperationItems.wasteReason,
        })
        .from(inventoryOperationItems)
        .leftJoin(
          inventoryOperations,
          eq(inventoryOperationItems.operationId, inventoryOperations.id)
        )
        .leftJoin(articles, eq(inventoryOperationItems.articleId, articles.id))
        .leftJoin(
          storageZones,
          eq(inventoryOperationItems.fromStorageZoneId, storageZones.id)
        )
        .leftJoin(lots, eq(inventoryOperationItems.lotId, lots.id))
        .where(eq(inventoryOperationItems.operationId, deliveryId))
        .orderBy(articles.name, storageZones.designation);

      if (!rows.length) {
        return res.status(404).json({ message: "Livraison non trouvée" });
      }

      // 🔹 2. Regrouper les résultats par article
      const summaryMap = new Map<number, any>();

      for (const row of rows) {
        if (!row.articleId) continue;
        const existing = summaryMap.get(row.articleId);

        const zoneData = {
          zoneId: row.zoneId,
          zoneName: row.zoneName,
          lotId: row.lotId,
          lotName: row.lotName,
          quantity: row.quantity,
          notes: row.notes,
          returnQuantity: 0,
          wasteQuantity: 0,
          returnReason: "",
          wasteReason: ""
        };

        if (existing) {
          existing.totalQuantity += row.quantity;
          existing.zones.push(zoneData);
        } else {
          summaryMap.set(row.articleId, {
            articleId: row.articleId,
            articleName: row.articleName,
            articlePhoto: row.articlePhoto,
            articleUnit: row.articleUnit,
            totalQuantity: row.quantity,
            zones: [zoneData],
          });
        }
      }

      // 🔹 3. Convertir la map en tableau
      const summaryItems = Array.from(summaryMap.values());

      res.json(summaryItems);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la livraison:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des détails de la livraison",
      });
    }
  });

  // debuter une livraison (déduire le stock, mettre à jour les statuts)
  app.post("/api/deliveries/:id/start", async (req, res) => {
    try {
      const deliveryOperationId = parseInt(req.params.id);
      const validatedOp = await storage.StartDelivery(deliveryOperationId);
      res.json(validatedOp);
    } catch (error) {
      console.error("Erreur lors du changement d'état de la livraison:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erreur lors du changement d'état de la livraison" });
    }
  });

  // Annuler une livraison après validation avec détails des quantités
  app.post("/api/deliveries/:id/cancel-after-validation", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const { returnReason, WasteReason, cancellationItems } = req.body as CancellationData;

      if ((!returnReason && !WasteReason) || ((returnReason?.trim()?.length || 0) < 3 && (WasteReason?.trim()?.length || 0) < 3)) {
        return res.status(400).json({ message: "La raison d'annulation (rebut ou retour) doit contenir au moins 3 caractères" });
      }

      const result = await storage.cancelDeliveryAfterValidation(deliveryId, {
        returnReason: returnReason?.trim(),
        WasteReason: WasteReason?.trim(),
        cancellationItems
      });

      res.json(result);
    } catch (error) {
      console.error("Erreur lors de l'annulation après validation:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erreur lors de l'annulation" });
    }
  });

  // Récupérer les détails d'annulation d'une livraison
  app.get("/api/deliveries/:id/cancellation-details", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);

      // Récupérer la livraison originale
      const [delivery] = await db.select()
        .from(inventoryOperations)
        .where(and(
          eq(inventoryOperations.id, deliveryId),
          eq(inventoryOperations.type, InventoryOperationType.LIVRAISON)
        ));

      if (!delivery) {
        return res.status(404).json({ message: "Livraison non trouvée" });
      }

      // Récupérer les opérations de retour et rebut liées
      const [returnOperation] = await db.select()
        .from(inventoryOperations)
        .where(and(
          eq(inventoryOperations.parentOperationId, deliveryId),
          eq(inventoryOperations.type, InventoryOperationType.RETOUR_LIVRAISON)
        ));

      const [wasteOperation] = await db.select()
        .from(inventoryOperations)
        .where(and(
          eq(inventoryOperations.parentOperationId, deliveryId),
          eq(inventoryOperations.type, InventoryOperationType.REBUT_LIVRAISON)
        ));

      // Récupérer les items de retour
      const returnItems = returnOperation ? await db.select({
        inventoryOperationItems: inventoryOperationItems,
        articles: articles,
        storageZones: storageZones,
        lots: lots
      })
        .from(inventoryOperationItems)
        .leftJoin(articles, eq(inventoryOperationItems.articleId, articles.id))
        .leftJoin(storageZones, eq(inventoryOperationItems.fromStorageZoneId, storageZones.id))
        .leftJoin(lots, eq(inventoryOperationItems.lotId, lots.id))
        .where(eq(inventoryOperationItems.operationId, returnOperation.id)) : [];

      // Récupérer les items de rebut
      const wasteItems = wasteOperation ? await db.select({
        inventoryOperationItems: inventoryOperationItems,
        articles: articles,
        storageZones: storageZones,
        lots: lots
      })
        .from(inventoryOperationItems)
        .leftJoin(articles, eq(inventoryOperationItems.articleId, articles.id))
        .leftJoin(storageZones, eq(inventoryOperationItems.fromStorageZoneId, storageZones.id))
        .leftJoin(lots, eq(inventoryOperationItems.lotId, lots.id))
        .where(eq(inventoryOperationItems.operationId, wasteOperation.id)) : [];

      // Construire l'objet de réponse
      const cancellationDetails = {
        delivery: {
          id: delivery.id,
          code: delivery.code,
          reason: delivery.notes
        },
        returnOperation: returnOperation ? {
          id: returnOperation.id,
          code: returnOperation.code,
          reason: returnOperation.notes,
          items: returnItems.map(item => ({
            articleId: item.inventoryOperationItems.articleId,
            articleName: item.articles?.name || '',
            articlePhoto: item.articles?.photo || '',
            articleUnit: item.articles?.unit || '',
            zoneId: item.inventoryOperationItems.fromStorageZoneId,
            zoneName: item.storageZones?.designation || '',
            lotId: item.inventoryOperationItems.lotId,
            lotName: item.lots?.code || 'vide',
            quantity: parseFloat(item.inventoryOperationItems.quantity || '0'),
            reason: item.inventoryOperationItems.reason || ''
          }))
        } : null,
        wasteOperation: wasteOperation ? {
          id: wasteOperation.id,
          code: wasteOperation.code,
          reason: wasteOperation.notes,
          items: wasteItems.map(item => ({
            articleId: item.inventoryOperationItems.articleId,
            articleName: item.articles?.name || '',
            articlePhoto: item.articles?.photo || '',
            articleUnit: item.articles?.unit || '',
            zoneId: item.inventoryOperationItems.fromStorageZoneId,
            zoneName: item.storageZones?.designation || '',
            lotId: item.inventoryOperationItems.lotId,
            lotName: item.lots?.code || 'vide',
            quantity: parseFloat(item.inventoryOperationItems.quantity || '0'),
            reason: item.inventoryOperationItems.reason || ''
          }))
        } : null
      };

      res.json(cancellationDetails);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails d'annulation:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Erreur lors de la récupération des détails" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
