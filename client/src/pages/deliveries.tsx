import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Save,
  X,
  FileText,
  Edit3,
  Trash2,
  Search,
  Package,
  Truck,
  ArrowLeft,
  Eye,
  Ban,
  User,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { 
  InventoryOperation, 
  InventoryOperationItem, 
  Client, 
  Order, 
  Article 
} from "@shared/schema";

export default function DeliveriesPage() {
  usePageTitle("Livraisons");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States
  const [currentDelivery, setCurrentDelivery] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [showArticleSelect, setShowArticleSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("list");

  // Article select ref
  const articleSelectRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<InventoryOperation[]>({
    queryKey: ["/api/inventory-operations", { type: "delivery" }],
    queryFn: async () => {
      const response = await fetch("/api/inventory-operations?type=delivery");
      if (!response.ok) throw new Error("Failed to fetch deliveries");
      return response.json();
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  // Mutations
  const createDeliveryMutation = useMutation({
    mutationFn: async (deliveryData: any) => {
      return await apiRequest("/api/inventory-operations", "POST", deliveryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
      toast({ 
        title: "Livraison créée",
        description: "La livraison a été créée avec succès"
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Erreur lors de la création",
        variant: "destructive" 
      });
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/inventory-operations/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
      toast({ 
        title: "Livraison mise à jour",
        description: "La livraison a été modifiée avec succès"
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Erreur lors de la modification",
        variant: "destructive" 
      });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/inventory-operations/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
      toast({ 
        title: "Livraison supprimée",
        description: "La livraison a été supprimée avec succès"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive" 
      });
    },
  });

  // Effects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        articleSelectRef.current &&
        !articleSelectRef.current.contains(event.target as Node)
      ) {
        setShowArticleSelect(false);
      }
    };

    if (showArticleSelect) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showArticleSelect]);

  // Helper functions
  const resetForm = () => {
    setCurrentDelivery(null);
    setItems([]);
    setIsEditing(false);
    setIsViewing(false);
    setActiveTab("list");
  };

  const startNewDelivery = () => {
    setCurrentDelivery({
      type: "delivery",
      status: "draft",
      clientId: null,
      orderId: null,
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: "",
      currency: "DZD",
      subtotalHT: 0,
      totalTax: 0,
      totalTTC: 0,
    });
    setItems([]);
    setIsEditing(true);
    setIsViewing(false);
    setActiveTab("form");
  };

  const editDelivery = (delivery: InventoryOperation) => {
    setCurrentDelivery(delivery);
    // Charger les items de la livraison
    loadDeliveryItems(delivery.id);
    setIsEditing(true);
    setIsViewing(false);
    setActiveTab("form");
  };

  const viewDelivery = (delivery: InventoryOperation) => {
    setCurrentDelivery(delivery);
    loadDeliveryItems(delivery.id);
    setIsEditing(false);
    setIsViewing(true);
    setActiveTab("form");
  };

  const loadDeliveryItems = async (deliveryId: number) => {
    try {
      const response = await fetch(`/api/inventory-operations/${deliveryId}/items`);
      if (!response.ok) throw new Error("Failed to fetch delivery items");
      const deliveryItems = await response.json();
      
      setItems(deliveryItems.map((item: any) => ({
        id: item.id,
        articleId: item.articleId,
        article: articles.find(a => a.id === item.articleId),
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice || "0"),
        totalPrice: parseFloat(item.totalPrice || "0"),
        notes: item.notes || "",
      })));
    } catch (error) {
      console.error("Erreur lors du chargement des articles:", error);
    }
  };

  const addArticleToDelivery = () => {
    if (!selectedArticle) return;

    const existingItem = items.find(item => item.articleId === selectedArticle.id);
    if (existingItem) {
      toast({
        title: "Article déjà ajouté",
        description: "Cet article est déjà dans la livraison",
        variant: "destructive"
      });
      return;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      articleId: selectedArticle.id,
      article: selectedArticle,
      quantity: 1,
      unitPrice: parseFloat(selectedArticle.salePrice || "0"),
      totalPrice: parseFloat(selectedArticle.salePrice || "0"),
      notes: "",
    };

    setItems([...items, newItem]);
    setSelectedArticle(null);
    setShowArticleSelect(false);
    setSearchTerm("");
  };

  const updateItemQuantity = (itemId: number | string, quantity: number) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ));
  };

  const updateItemPrice = (itemId: number | string, unitPrice: number) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, unitPrice, totalPrice: item.quantity * unitPrice }
        : item
    ));
  };

  const removeItem = (itemId: number | string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotalHT = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalTax = subtotalHT * 0.19; // TVA 19%
    const totalTTC = subtotalHT + totalTax;
    return { subtotalHT, totalTax, totalTTC };
  };

  const saveDelivery = async () => {
    if (!currentDelivery.clientId) {
      toast({
        title: "Client requis",
        description: "Veuillez sélectionner un client",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Articles requis",
        description: "Veuillez ajouter au moins un article",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateTotals();
    const deliveryData = {
      ...currentDelivery,
      ...totals,
      items: items.map(item => ({
        articleId: item.articleId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
        notes: item.notes,
      }))
    };

    if (currentDelivery.id) {
      updateDeliveryMutation.mutate({ id: currentDelivery.id, data: deliveryData });
    } else {
      createDeliveryMutation.mutate(deliveryData);
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return "Client inconnu";
    return client.companyName || `${client.firstName} ${client.lastName}`;
  };

  const getOrderCode = (orderId: number | null) => {
    if (!orderId) return "-";
    const order = orders.find(o => o.id === orderId);
    return order ? order.code : `CMD-${orderId}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Brouillon" },
      pending: { variant: "default" as const, label: "En attente" },
      ready: { variant: "default" as const, label: "Prêt" },
      completed: { variant: "default" as const, label: "Livré" },
      cancelled: { variant: "destructive" as const, label: "Annulé" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { variant: "outline" as const, label: status };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const filteredArticles = articles.filter(article =>
    article.allowSale &&
    article.active &&
    (article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     article.code?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totals = calculateTotals();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Livraisons
          </h1>
          <p className="text-muted-foreground">
            Gestion des livraisons clients
          </p>
        </div>
        <Button onClick={startNewDelivery} data-testid="button-new-delivery">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle livraison
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Liste des livraisons</TabsTrigger>
          {(isEditing || isViewing) && (
            <TabsTrigger value="form">
              {isViewing ? "Détails" : isEditing && currentDelivery?.id ? "Modifier" : "Nouvelle"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Liste des livraisons ({deliveries.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Date prévue</TableHead>
                    <TableHead>Total TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Chargement des livraisons...
                      </TableCell>
                    </TableRow>
                  ) : deliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Aucune livraison trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((delivery) => (
                      <TableRow key={delivery.id} data-testid={`row-delivery-${delivery.id}`}>
                        <TableCell className="font-medium">{delivery.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {getClientName(delivery.clientId || 0)}
                          </div>
                        </TableCell>
                        <TableCell>{getOrderCode(delivery.orderId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(delivery.scheduledDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(delivery.totalTTC || "0").toFixed(2)} DA
                        </TableCell>
                        <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDelivery(delivery)}
                              data-testid={`button-view-delivery-${delivery.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editDelivery(delivery)}
                              disabled={delivery.status === "completed"}
                              data-testid={`button-edit-delivery-${delivery.id}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer cette livraison ?")) {
                                  deleteDeliveryMutation.mutate(delivery.id);
                                }
                              }}
                              disabled={delivery.status === "completed"}
                              data-testid={`button-delete-delivery-${delivery.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          {(isEditing || isViewing) && currentDelivery && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab("list")}
                    data-testid="button-back-to-list"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la liste
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isViewing ? "Détails" : currentDelivery.id ? "Modifier" : "Nouvelle"} livraison
                    </h2>
                    {currentDelivery.code && (
                      <p className="text-muted-foreground">{currentDelivery.code}</p>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button 
                      onClick={saveDelivery}
                      disabled={createDeliveryMutation.isPending || updateDeliveryMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {currentDelivery.id ? "Mettre à jour" : "Créer"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Client *</label>
                      <Select
                        value={currentDelivery.clientId?.toString() || ""}
                        onValueChange={(value) => setCurrentDelivery({
                          ...currentDelivery,
                          clientId: parseInt(value)
                        })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {getClientName(client.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Commande liée</label>
                      <Select
                        value={currentDelivery.orderId?.toString() || ""}
                        onValueChange={(value) => setCurrentDelivery({
                          ...currentDelivery,
                          orderId: value ? parseInt(value) : null
                        })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune commande" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucune commande</SelectItem>
                          {orders
                            .filter(order => !currentDelivery.clientId || order.clientId === currentDelivery.clientId)
                            .map((order) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              {order.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Date prévue</label>
                      <Input
                        type="date"
                        value={currentDelivery.scheduledDate?.split('T')[0] || ""}
                        onChange={(e) => setCurrentDelivery({
                          ...currentDelivery,
                          scheduledDate: e.target.value
                        })}
                        disabled={!isEditing}
                        data-testid="input-scheduled-date"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Statut</label>
                      <Select
                        value={currentDelivery.status || "draft"}
                        onValueChange={(value) => setCurrentDelivery({
                          ...currentDelivery,
                          status: value
                        })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="ready">Prêt</SelectItem>
                          <SelectItem value="completed">Livré</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={currentDelivery.notes || ""}
                        onChange={(e) => setCurrentDelivery({
                          ...currentDelivery,
                          notes: e.target.value
                        })}
                        placeholder="Notes sur la livraison..."
                        disabled={!isEditing}
                        data-testid="textarea-notes"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé financier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sous-total HT</span>
                        <span>{totals.subtotalHT.toFixed(2)} DA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TVA (19%)</span>
                        <span>{totals.totalTax.toFixed(2)} DA</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC</span>
                        <span>{totals.totalTTC.toFixed(2)} DA</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Articles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Articles à livrer ({items.length})</span>
                    {isEditing && (
                      <div className="relative" ref={articleSelectRef}>
                        <Button
                          variant="outline"
                          onClick={() => setShowArticleSelect(!showArticleSelect)}
                          data-testid="button-add-article"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter un article
                        </Button>
                        
                        {showArticleSelect && (
                          <div className="absolute right-0 top-12 z-50 w-96 bg-white border rounded-lg shadow-lg">
                            <div className="p-4 space-y-4">
                              <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Rechercher un article..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                              
                              <div className="max-h-60 overflow-y-auto space-y-1">
                                {filteredArticles.length === 0 ? (
                                  <p className="text-center py-4 text-muted-foreground">
                                    Aucun article trouvé
                                  </p>
                                ) : (
                                  filteredArticles.map((article) => (
                                    <div
                                      key={article.id}
                                      className="p-3 hover:bg-muted cursor-pointer rounded"
                                      onClick={() => setSelectedArticle(article)}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium">{article.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {article.code} • {article.unit}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">
                                            {parseFloat(article.salePrice || "0").toFixed(2)} DA
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                              
                              {selectedArticle && (
                                <div className="border-t pt-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{selectedArticle.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedArticle.code}
                                      </p>
                                    </div>
                                    <Button onClick={addArticleToDelivery}>
                                      Ajouter
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Notes</TableHead>
                        {isEditing && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isEditing ? 6 : 5} className="text-center py-8">
                            Aucun article ajouté
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.article?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.article?.code} • {item.article?.unit}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-20"
                                />
                              ) : (
                                item.quantity
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              ) : (
                                `${item.unitPrice.toFixed(2)} DA`
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {item.totalPrice.toFixed(2)} DA
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  value={item.notes}
                                  onChange={(e) => setItems(items.map(i => 
                                    i.id === item.id ? { ...i, notes: e.target.value } : i
                                  ))}
                                  placeholder="Notes..."
                                  className="w-32"
                                />
                              ) : (
                                item.notes || "-"
                              )}
                            </TableCell>
                            {isEditing && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}