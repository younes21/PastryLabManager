import { useState } from "react";
import { Layout } from "@/components/layout";
import { ProductionModal } from "@/components/production-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Production() {
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productions, isLoading } = useQuery({
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
      completed: { label: "Terminé", variant: "outline" as const },
      cancelled: { label: "Annulé", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <Layout title="Production">
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Production">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Planning de Production</h1>
          <Button onClick={() => setIsProductionModalOpen(true)}>
            <i className="fas fa-plus mr-2"></i>
            Nouvelle Production
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Préparateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productions && productions.length > 0 ? (
                    productions.map((production: any) => (
                      <tr key={production.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {new Date(production.scheduledTime).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-gray-500">
                              {formatTime(production.scheduledTime)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {production.recipe?.name || "Recette supprimée"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {production.recipe?.preparationTime && `${production.recipe.preparationTime} min`}
                          </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {production.startTime && (
                            <div>
                              <div>Début: {formatTime(production.startTime)}</div>
                              {production.endTime && (
                                <div>Fin: {formatTime(production.endTime)}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {production.status === "scheduled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startProductionMutation.mutate(production.id)}
                                disabled={startProductionMutation.isPending}
                              >
                                <i className="fas fa-play mr-1"></i>
                                Démarrer
                              </Button>
                            )}
                            {production.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => completeProductionMutation.mutate(production.id)}
                                disabled={completeProductionMutation.isPending}
                              >
                                <i className="fas fa-check mr-1"></i>
                                Terminer
                              </Button>
                            )}
                            {(production.status === "scheduled" || production.status === "cancelled") && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteProductionMutation.mutate(production.id)}
                                disabled={deleteProductionMutation.isPending}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <i className="fas fa-industry text-4xl text-gray-300 mb-4"></i>
                          <p className="text-lg font-medium mb-2">Aucune production programmée</p>
                          <p className="text-sm">Cliquez sur "Nouvelle Production" pour commencer</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <ProductionModal 
          isOpen={isProductionModalOpen} 
          onClose={() => setIsProductionModalOpen(false)} 
        />
      </div>
    </Layout>
  );
}
