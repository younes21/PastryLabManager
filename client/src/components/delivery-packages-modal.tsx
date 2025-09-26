import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, Trash2, Edit3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DeliveryPackagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: any;
  onSuccess?: () => void;
}

interface PackageData {
  name: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
}

export function DeliveryPackagesModal({ open, onOpenChange, delivery, onSuccess }: DeliveryPackagesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageData, setPackageData] = useState<PackageData>({
    name: "",
    weight: undefined,
    dimensions: "",
    notes: "",
  });

  // Récupérer les colis de la livraison
  const { data: packages = [], refetch } = useQuery({
    queryKey: ["/api/deliveries", delivery?.id, "packages"],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/${delivery?.id}/packages`);
      return response.json();
    },
    enabled: !!delivery?.id && open,
  });

  // Mutation pour créer un colis
  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageData) => {
      return await apiRequest(`/api/deliveries/${delivery.id}/packages`, "POST", data);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Colis créé",
        description: "Le colis a été créé avec succès",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le colis",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour un colis
  const updatePackageMutation = useMutation({
    mutationFn: async ({ packageId, data }: { packageId: number, data: PackageData }) => {
      return await apiRequest(`/api/deliveries/${delivery.id}/packages/${packageId}`, "PUT", data);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Colis mis à jour",
        description: "Le colis a été mis à jour avec succès",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le colis",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPackageData({
      name: "",
      weight: undefined,
      dimensions: "",
      notes: "",
    });
    setIsCreating(false);
    setEditingPackage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!packageData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du colis est requis",
        variant: "destructive",
      });
      return;
    }

    if (editingPackage) {
      updatePackageMutation.mutate({
        packageId: editingPackage.id,
        data: packageData,
      });
    } else {
      createPackageMutation.mutate(packageData);
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setPackageData({
      name: pkg.name || "",
      weight: pkg.weight ? parseFloat(pkg.weight) : undefined,
      dimensions: pkg.dimensions || "",
      notes: pkg.notes || "",
    });
    setIsCreating(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestion des colis - Livraison #{delivery?.code}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            {/* Formulaire de création/édition */}
            {isCreating && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-4">
                  {editingPackage ? "Modifier le colis" : "Nouveau colis"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom du colis *</Label>
                      <Input
                        id="name"
                        value={packageData.name}
                        onChange={(e) => setPackageData({ ...packageData, name: e.target.value })}
                        placeholder="Ex: Colis principal"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Poids (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={packageData.weight || ""}
                        onChange={(e) => setPackageData({ ...packageData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={packageData.dimensions}
                      onChange={(e) => setPackageData({ ...packageData, dimensions: e.target.value })}
                      placeholder="Ex: 30x20x15 cm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={packageData.notes}
                      onChange={(e) => setPackageData({ ...packageData, notes: e.target.value })}
                      placeholder="Notes sur le colis..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                    >
                      {editingPackage ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Bouton pour créer un nouveau colis */}
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un colis
              </Button>
            )}

            {/* Liste des colis */}
            <div>
              <h3 className="font-medium mb-3">Colis de la livraison ({packages.length})</h3>
              {packages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun colis créé pour cette livraison</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Poids</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg: any) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>{pkg.weight ? `${pkg.weight} kg` : "-"}</TableCell>
                        <TableCell>{pkg.dimensions || "-"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {pkg.status || "En préparation"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(pkg)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
