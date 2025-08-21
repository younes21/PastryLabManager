import { Layout } from "@/components/layout";
import { ProductionModal } from "@/components/production-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Dashboard() {
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["/api/orders/recent"],
  });

  const { data: lowStockIngredients } = useQuery({
    queryKey: ["/api/ingredients/low-stock"],
  });

  const { data: productions } = useQuery({
    queryKey: ["/api/productions"],
  });

  const startProductionMutation = useMutation({
    mutationFn: async (productionId: number) => {
      const response = await apiRequest("POST", `/api/productions/${productionId}/start`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/productions"] });
      toast({
        title: "Production démarrée",
        description: "La production a été démarrée avec succès.",
      });
    },
  });

  const completeProductionMutation = useMutation({
    mutationFn: async (productionId: number) => {
      const response = await apiRequest("POST", `/api/productions/${productionId}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/productions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Production terminée",
        description: "La production a été terminée et le stock a été mis à jour.",
      });
    },
  });

  const deleteProductionMutation = useMutation({
    mutationFn: async (productionId: number) => {
      await apiRequest("DELETE", `/api/productions/${productionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/productions"] });
      toast({
        title: "Production supprimée",
        description: "La production a été supprimée du planning.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Programmé", variant: "secondary" as const },
      in_progress: { label: "En cours", variant: "default" as const },
      completed: { label: "Terminé", variant: "secondary" as const },
      cancelled: { label: "Annulé", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

usePageTitle('Tableau de bord');
 return (<>
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Stock Faible</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.lowStockCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-clock text-2xl text-amber-500"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Commandes Actives</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.activeOrdersCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-industry text-2xl text-blue-500"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Production Aujourd'hui</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.todayProductionCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-euro-sign text-2xl text-green-500"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">CA du Jour</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.dailyRevenue || 0}DA
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Commandes Récentes</h3>
              <div className="flow-root">
                {recentOrders && recentOrders.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recentOrders.slice(0, 5).map((order: any) => (
                      <li key={order.id} className="py-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <Badge variant={
                              order.status === "delivered" ? "default" :
                              order.status === "preparation" ? "secondary" :
                              order.status === "in_delivery" ? "outline" : "secondary"
                            }>
                              {order.status === "delivered" ? "Livré" :
                               order.status === "preparation" ? "En préparation" :
                               order.status === "in_delivery" ? "En livraison" :
                               order.status === "ready" ? "Prêt" : "En attente"}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {order.customerName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Commande #{order.id}
                            </p>
                          </div>
                          <div className="inline-flex items-center text-base font-semibold text-gray-900">
                            {order.totalAmount}DA
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune commande récente</p>
                )}
                <div className="mt-4">
                  <Button variant="link" className="p-0 h-auto">
                    Voir toutes les commandes →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Alertes Stock</h3>
              <div className="flow-root">
                {lowStockIngredients && lowStockIngredients.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {lowStockIngredients.map((ingredient: any) => (
                      <li key={ingredient.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-2 w-2 bg-red-400 rounded-full"></div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {ingredient.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {ingredient.currentStock} {ingredient.unit} restant
                              </p>
                            </div>
                          </div>
                          <Button variant="link" size="sm">
                            Réapprovisionner
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune alerte de stock</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Schedule */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Planning de Production</h3>
                <Button onClick={() => setIsProductionModalOpen(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Nouvelle Production
                </Button>
              </div>
              
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préparateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productions && productions.length > 0 ? (
                      productions.map((production: any) => (
                        <tr key={production.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(production.scheduledTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {production.recipe?.name || "Recette supprimée"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {production.quantity} unités
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {production.preparer ? 
                              `${production.preparer.firstName} ${production.preparer.lastName}` : 
                              "Non assigné"
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(production.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {production.status === "scheduled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startProductionMutation.mutate(production.id)}
                                disabled={startProductionMutation.isPending}
                              >
                                Démarrer
                              </Button>
                            )}
                            {production.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => completeProductionMutation.mutate(production.id)}
                                disabled={completeProductionMutation.isPending}
                              >
                                Terminer
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteProductionMutation.mutate(production.id)}
                              disabled={deleteProductionMutation.isPending}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Aucune production programmée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProductionModal 
        isOpen={isProductionModalOpen} 
        onClose={() => setIsProductionModalOpen(false)} 
      />
    </>
  );
}
