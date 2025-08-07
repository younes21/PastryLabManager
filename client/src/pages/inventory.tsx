import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

export default function Inventory() {
  const { data: ingredients, isLoading: ingredientsLoading } = useQuery({
    queryKey: ["/api/ingredients"],
  });

  const { data: storageLocations, isLoading: storageLoading } = useQuery({
    queryKey: ["/api/storage-locations"],
  });

  const getStockLevel = (current: string, min: string, max: string) => {
    const currentStock = parseFloat(current || "0");
    const minStock = parseFloat(min || "0");
    const maxStock = parseFloat(max || "100");
    
    if (currentStock <= minStock) return "low";
    if (currentStock <= maxStock * 0.3) return "medium";
    return "high";
  };

  const getStockPercentage = (current: string, max: string) => {
    const currentStock = parseFloat(current || "0");
    const maxStock = parseFloat(max || "100");
    return Math.min((currentStock / maxStock) * 100, 100);
  };

  if (ingredientsLoading || storageLoading) {
    return (
      <Layout title="Gestion de Stock">
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion de Stock">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        {/* Storage Locations Overview */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emplacements de Stockage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storageLocations?.map((location: any) => (
              <Card key={location.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    {location.name}
                    <Badge variant={parseFloat(location.temperature) < 0 ? "secondary" : "outline"}>
                      {location.temperature}°C
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Capacité: {location.capacity} {location.unit}</p>
                    <p className="mt-1">
                      Statut: <span className="text-green-600">Opérationnel</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ingredients Inventory */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventaire des Ingrédients</h3>
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingrédient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Actuel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Niveau
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emplacement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coût/Unité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valeur Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ingredients?.map((ingredient: any) => {
                      const stockLevel = getStockLevel(
                        ingredient.currentStock,
                        ingredient.minStock,
                        ingredient.maxStock
                      );
                      const stockPercentage = getStockPercentage(
                        ingredient.currentStock,
                        ingredient.maxStock
                      );
                      const stockValue = parseFloat(ingredient.currentStock || "0") * parseFloat(ingredient.costPerUnit || "0");
                      const storageLocation = storageLocations?.find((loc: any) => loc.id === ingredient.storageLocationId);

                      return (
                        <tr key={ingredient.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {ingredient.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Min: {ingredient.minStock} {ingredient.unit} | Max: {ingredient.maxStock} {ingredient.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ingredient.currentStock} {ingredient.unit}
                            </div>
                            <div className="w-20 mt-1">
                              <Progress 
                                value={stockPercentage} 
                                className={`h-2 ${
                                  stockLevel === "low" ? "bg-red-100" :
                                  stockLevel === "medium" ? "bg-yellow-100" : "bg-green-100"
                                }`}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={
                                stockLevel === "low" ? "destructive" :
                                stockLevel === "medium" ? "secondary" : "default"
                              }
                            >
                              {stockLevel === "low" ? "Faible" :
                               stockLevel === "medium" ? "Moyen" : "Bon"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {storageLocation?.name || "Non défini"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ingredient.costPerUnit}DA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stockValue.toFixed(2)}DA
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
