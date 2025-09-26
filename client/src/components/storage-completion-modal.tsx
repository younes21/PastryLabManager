import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, User, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Production {
  id: number;
  recipeId: number;
  quantity: number;
  status: string;
  preparerId: number;
  scheduledFor: string;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  prepTime: number;
  price: string;
}

interface StorageLocation {
  id: number;
  name: string;
  temperature: string;
  capacity: string;
  unit: string;
}

interface Order {
  id: number;
  customerName: string;
  status: string;
}

interface StorageCompletionModalProps {
  production: Production | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StorageCompletionModal({
  production,
  isOpen,
  onClose
}: StorageCompletionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [storageLocationId, setStorageLocationId] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");

  const { data: recipe } = useQuery<Recipe>({
    queryKey: ["/api/recipes", production?.recipeId],
    enabled: !!production?.recipeId,
  });

  const { data: storageLocations = [] } = useQuery<StorageLocation[]>({
    queryKey: ["/api/storage-locations"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const completeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/productions/${production?.id}/complete-with-storage`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Production terminée",
        description: "La production a été stockée et étiquetée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/productions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/labels"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la finalisation de la production.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStorageLocationId("");
    setExpirationDate("");
    setCustomerName("");
    setOrderId("");
    onClose();
  };

  const handleSubmit = () => {
    if (!storageLocationId || !expirationDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const selectedOrder = orderId ? orders.find(o => o.id === parseInt(orderId)) : null;
    const finalCustomerName = selectedOrder ? selectedOrder.customerName : customerName || "Stock général";

    completeMutation.mutate({
      storageLocationId: parseInt(storageLocationId),
      expirationDate,
      customerName: finalCustomerName,
      orderId: orderId ? parseInt(orderId) : null,
    });
  };

  // Suggest expiration date based on recipe (default 7 days)
  const suggestExpirationDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  };

  if (!production) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Finaliser la Production
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium">{recipe?.name}</h4>
              <p className="text-sm text-gray-600">Quantité: {production.quantity}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage-location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Lieu de stockage *
              </Label>
              <Select value={storageLocationId} onValueChange={setStorageLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un lieu" />
                </SelectTrigger>
                <SelectContent>
                  {storageLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name} ({location.temperature}°C)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date d'expiration *
              </Label>
              <Input
                id="expiration-date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpirationDate(suggestExpirationDate())}
                className="text-xs"
              >
                Suggérer 7 jours
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Commande associée (optionnel)
              </Label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une commande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune commande</SelectItem>
                  {orders
                    .filter(order => order.status !== "delivered")
                    .map((order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        #{order.id} - {order.customerName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {!orderId && (
              <div className="space-y-2">
                <Label htmlFor="customer-name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nom du client (optionnel)
                </Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Laisser vide pour stock général"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={completeMutation.isPending || !storageLocationId || !expirationDate}
                className="flex-1"
              >
                {completeMutation.isPending ? "Finalisation..." : "Finaliser"}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}