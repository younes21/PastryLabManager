import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

interface ProductionStatus {
  orderId: number;
  etat: string;
  ajustements: string[];
}

export function useProductionStatusCalculation(orders: Order[]) {
  return useQuery({
    queryKey: ["production-status-calculation", orders.map(o => o.id)],
    queryFn: async (): Promise<ProductionStatus[]> => {
      // Utiliser la route optimisée qui fait tout le calcul côté serveur
      const response = await fetch('/api/orders/production-status-batch');
      if (!response.ok) {
        throw new Error("Erreur lors du calcul du statut de production");
      }
      return response.json();
    },
    enabled: orders.length > 0,
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
