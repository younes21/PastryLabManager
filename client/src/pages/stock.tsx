import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Warehouse, QrCode, Calendar, User, MapPin } from "lucide-react";

interface ProductStock {
  id: number;
  productionId: number;
  recipeId: number;
  orderId: number | null;
  customerName: string;
  quantity: number;
  barcode: string;
  storageLocationId: number;
  productionDate: string;
  expirationDate: string;
  preparerId: number;
  status: string;
}

interface Label {
  id: number;
  productStockId: number;
  barcode: string;
  productName: string;
  customerName: string;
  productionDate: string;
  expirationDate: string;
  preparerName: string;
  quantity: number;
  printed: boolean;
  printedAt: string | null;
}

interface StorageLocation {
  id: number;
  name: string;
  temperature: string;
  capacity: string;
  unit: string;
}

export default function Stock() {
  const [activeTab, setActiveTab] = useState("stock");

  const { data: productStock = [], isLoading: stockLoading } = useQuery<ProductStock[]>({
    queryKey: ["/api/product-stock"],
  });

  const { data: labels = [], isLoading: labelsLoading } = useQuery<Label[]>({
    queryKey: ["/api/labels"],
  });

  const { data: storageLocations = [] } = useQuery<StorageLocation[]>({
    queryKey: ["/api/storage-locations"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "reserved":
        return "bg-yellow-500";
      case "consumed":
        return "bg-red-500";
      case "expired":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const getLocationName = (locationId: number) => {
    const location = storageLocations.find(l => l.id === locationId);
    return location?.name || "Inconnu";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (expirationDate: string) => {
    const days = getDaysUntilExpiration(expirationDate);
    if (days < 0) return { status: "expired", color: "bg-red-500", text: "Expiré" };
    if (days <= 3) return { status: "warning", color: "bg-orange-500", text: `${days}j restant` };
    if (days <= 7) return { status: "caution", color: "bg-yellow-500", text: `${days}j restant` };
    return { status: "good", color: "bg-green-500", text: `${days}j restant` };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            Stock Produits
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Étiquettes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {stockLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : productStock.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun produit en stock</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productStock.map((item) => {
                const expirationInfo = getExpirationStatus(item.expirationDate);
                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.customerName}</CardTitle>
                        <Badge className={`${getStatusColor(item.status)} text-white`}>
                          {item.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span>Quantité: {item.quantity}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <QrCode className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-xs">{item.barcode}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{getLocationName(item.storageLocationId)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Produit: {formatDate(item.productionDate)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Expire: {formatDate(item.expirationDate)}</span>
                        </div>
                        <Badge className={`${expirationInfo.color} text-white text-xs`}>
                          {expirationInfo.text}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="labels" className="space-y-4">
          {labelsLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : labels.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucune étiquette trouvée</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {labels.map((label) => (
                <Card key={label.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{label.productName}</CardTitle>
                      <Badge className={label.printed ? "bg-green-500" : "bg-orange-500"}>
                        {label.printed ? "Imprimée" : "À imprimer"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{label.customerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <QrCode className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-xs">{label.barcode}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span>Quantité: {label.quantity}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Préparateur: {label.preparerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Production: {formatDate(label.productionDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Expiration: {formatDate(label.expirationDate)}</span>
                    </div>
                    
                    {label.printed && label.printedAt && (
                      <div className="text-xs text-gray-500">
                        Imprimée le {formatDate(label.printedAt)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}