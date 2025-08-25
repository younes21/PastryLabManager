import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import {
  insertUserSchema,
  insertMeasurementCategorySchema,
  insertMeasurementUnitSchema,
  insertArticleCategorySchema,
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
  insertRecipeSchema,
  insertRecipeIngredientSchema,
  insertRecipeOperationSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertInventoryOperationSchema,
  insertInventoryOperationItemSchema,
  updateInventoryOperationWithItemsSchema,
  type InsertInventoryOperation,
  insertDeliverySchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertOrderWithItemsSchema,
  updateOrderWithItemsSchema,
  InventoryOperation,
  stock,
  articles,
  storageZones,
  lots,
  inventoryOperations,
  inventoryOperationItems,
  users,
} from "@shared/schema";
import { z } from "zod";

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
      if (user.role == "client") {
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
          article.type === "ingredient" &&
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

      const categories = await storage.getAllArticleCategories(req.params.type as ("produit" | "ingredient" | "service" | undefined));
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
      if (articleData.type === "product") {
        const existingProducts = await storage.getAllArticles();
        const productCount = existingProducts.filter(
          (a) => a.type === "product",
        ).length;
        code = `PRD-${String(productCount + 1).padStart(6, "0")}`;
      } else if (articleData.type === "ingredient") {
        const existingIngredients = await storage.getAllArticles();
        const ingredientCount = existingIngredients.filter(
          (a) => a.type === "ingredient",
        ).length;
        code = `ING-${String(ingredientCount + 1).padStart(6, "0")}`;
      } else if (articleData.type === "service") {
        const existingServices = await storage.getAllArticles();
        const serviceCount = existingServices.filter(
          (a) => a.type === "service",
        ).length;
        code = `SRV-${String(serviceCount + 1).padStart(6, "0")}`;
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

  // ============ OPERATIONS D'INVENTAIRE ROUTES ============

  app.get("/api/inventory-operations", async (req, res) => {
    try {
      const { type, include_reliquat, operator_id } = req.query;
      let operations;
      if (type) {
        const includeReliquat = include_reliquat === 'true';
        operations = await storage.getInventoryOperationsByType(type as string, includeReliquat);
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
        // Use the new method that handles both operation and items
        const operationData = insertInventoryOperationSchema.parse(req.body.operation);
        const itemsData = req.body.items.map((item: any) => {
          const validatedItem = insertInventoryOperationItemSchema.parse(item);
          return {
            ...validatedItem,
            // Remove operationId if present, it will be set by the storage method
            operationId: undefined
          };
        });

        const operation = await storage.createInventoryOperationWithItems(operationData, itemsData);
        res.status(201).json(operation);
      } else {
        // Fallback to the old method for backward compatibility
        const operationData = insertInventoryOperationSchema.parse(req.body);
        const operation = await storage.createInventoryOperation(operationData);
        res.status(201).json(operation);
      }
    } catch (error) {
      console.error("Error creating inventory operation:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid operation data", errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: "Failed to create inventory operation" });
      }
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

  // PATCH endpoint for inventory operations (for status updates)
  app.patch("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }
      if (!["completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status transition" });
      }

      const result = await storage.updateInventoryOperationStatus(id, status);

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
      if (status !== 'in_progress') {
        return res.status(400).json({ message: "Status must be 'in_progress'" });
      }

      if (!startedAt) {
        return res.status(400).json({ message: "startedAt is required" });
      }

      // Get the operation to check if it can be started
      const operation = await storage.getInventoryOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Inventory operation not found" });
      }

      if (operation.status === 'completed' || operation.status === 'cancelled') {
        return res.status(400).json({ message: "Operation cannot be started" });
      }

      if (operation.status === 'in_progress') {
        return res.status(400).json({ message: "Operation is already in progress" });
      }
      // Get operation items to consume ingredients
      const items = await storage.getInventoryOperationItems(id);

      // For preparation operations, consume ingredients based on recipe and create stock moves
      if (operation.type === 'preparation') {
        for (const item of items) {
          const article = await storage.getArticle(item.articleId);
          if (!article) continue;

          // Find the recipe for this product
          const recipe = await storage.getRecipeByArticleId(article.id);
          if (!recipe) continue;

          // Get recipe ingredients
          const recipeIngredients = await storage.getRecipeIngredients(recipe.id);

          // Calculate consumption based on planned quantity
          const plannedQuantity = parseFloat(item.quantity || '0');
          const recipeQuantity = parseFloat(recipe.quantity || '1');
          const ratio = plannedQuantity / recipeQuantity;

        }
      }

      // Update operation status
      const updateData: Partial<InsertInventoryOperation> = {
        status: 'in_progress',
        startedAt: startedAt
      };

      const updatedOperation = await storage.updateInventoryOperation(id, updateData);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Failed to update operation" });
      }
      // Libérer les réservations d'ingrédients une fois que la préparation commence
      if (operation.type === 'preparation' || operation.type === 'preparation_reliquat') {
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

      const { status, completedAt, conformQuantity, wasteReason } = req.body;

      // Validate required fields
      if (status !== 'completed') {
        return res.status(400).json({ message: "Status must be 'completed'" });
      }

      if (!completedAt) {
        return res.status(400).json({ message: "completedAt is required" });
      }

      // Get the operation to check if it's already completed
      const operation = await storage.getInventoryOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Inventory operation not found" });
      }

      if (operation.status === 'completed') {
        return res.status(400).json({ message: "Operation is already completed and cannot be modified" });
      }

      // Update operation status
      const updateData: Partial<InsertInventoryOperation> = {
        status: 'completed',
        completedAt: completedAt,
        completedBy: req.body.completedBy || null
      };

      const updatedOperation = await storage.updateInventoryOperation(id, updateData);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Failed to update operation" });
      }

      // Get operation items to update inventory
      const items = await storage.getInventoryOperationItems(id);

      // Calculate the ratio of conform quantity to planned quantity
      const totalPlanned = items.reduce((sum, item) => sum + parseFloat(item.quantity || '0'), 0);
      const conformQty = parseFloat(conformQuantity || totalPlanned.toString());
      const ratio = totalPlanned > 0 ? conformQty / totalPlanned : 1;


      // Create waste operation if there's waste
      if (conformQty < totalPlanned && operation.type === 'preparation') {
        const wasteQuantity = totalPlanned - conformQty;

        const wasteOperation = {
          type: 'ajustement_rebut',
          status: 'completed',
          operatorId: operation.operatorId,
          scheduledDate: new Date().toISOString(),
          notes: `Rebut de préparation ${operation.code}: ${wasteReason || 'Aucune raison spécifiée'}`
        };

        const wasteItems = items.map((item) => {
          const plannedQuantity = parseFloat(item.quantity || '0');
          const wasteItemQuantity = (plannedQuantity * wasteQuantity) / totalPlanned;

          return {
            articleId: item.articleId,
            quantity: wasteItemQuantity.toString(),
            unitCost: item.unitCost || '0',
            totalCost: (parseFloat(item.unitCost || '0') * wasteItemQuantity).toString(),
            notes: `Rebut de préparation ${operation.code}`,
            wasteReason: wasteReason || 'Aucune raison spécifiée',
            operationId: 0 // Sera remplacé automatiquement par createInventoryOperationWithItems
          };
        });

      await storage.createInventoryOperationWithItems(wasteOperation, wasteItems);

     
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

  // ============ LIVRAISONS ROUTES ============

  app.get("/api/deliveries", async (req, res) => {
    try {
      const deliveries = await storage.getAllDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
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
      let ops = await storage.getInventoryOperationsByType('reception');
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
      if (!op || op.type !== 'reception') {
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
        type: 'reception',
        status: body?.purchaseOrder?.status ?? 'completed',
        supplierId: body?.purchaseOrder?.supplierId,
        storageZoneId: body?.items?.[0]?.storageZoneId ?? null,
        notes: body?.purchaseOrder?.notes ?? null,
        subtotalHT: body?.purchaseOrder?.subtotalHT ?? '0',
        totalTax: body?.purchaseOrder?.totalTax ?? '0',
        totalTTC: body?.purchaseOrder?.totalTTC ?? '0',
        discount: body?.purchaseOrder?.discount ?? '0',
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

    if (!["completed", "cancelled"].includes(status)) {
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
      if (!existingOp || existingOp.type !== 'reception') {
        return res.status(404).json({ message: "Reception not found" });
      }

      // Si l'opération était complétée, annuler d'abord les stocks existants
      if (existingOp.status === 'completed') {
        const existingItems = await storage.getInventoryOperationItems(id);
        for (const item of existingItems) {

          const qty = Number(item.quantity) || 0;
          if (qty > 0) {
            if (!item.toStorageZoneId) {
              throw new Error(`Missing storage zone for article ${item.articleId}`);
            }

            // Retirer du stock
            await db.insert(stock).values({
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
      if (updatedOp.status === 'completed') {
        for (const it of body.items ?? []) {
          const qty = Number(it.quantityOrdered) || 0;
          if (qty > 0) {
            if (!it.storageZoneId) {
              throw new Error(`Missing storage zone for article ${it.articleId}`);
            }

            // Ajouter au stock
            await db.insert(stock).values({
              articleId: it.articleId,
              storageZoneId: it.storageZoneId,
              lotId: it.lotId ?? null,
              serialNumber: it.serialNumber ?? null,
              quantity: qty,
              updatedAt: new Date()
            }).onConflictDoUpdate({
              target: ["article_id", "storage_zone_id", "lot_id", "serial_number"],
              set: {
                quantity: sql`${stock.quantity} + ${qty}`,
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

      const availableStock = await storage.getAvailableStock(id);
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

      if (operation.type !== 'preparation' && operation.type !== 'preparation_reliquat') {
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
      const availableStock = await storage.getAvailableStock(id);

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
          id: stock.id,
          articleId: stock.articleId,
          storageZoneId: stock.storageZoneId,
          quantity: stock.quantity,
          lotId: stock.lotId,
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
        .from(stock)
        .leftJoin(articles, eq(stock.articleId, articles.id))
        .leftJoin(storageZones, eq(stock.storageZoneId, storageZones.id))
        .leftJoin(lots, eq(stock.lotId, lots.id))
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

  const httpServer = createServer(app);
  return httpServer;
}
