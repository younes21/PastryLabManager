import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody
} from "@/components/ui/dialog";
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
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Package,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArticleAvailability {
  lotId: number | null;
  lotCode: string | null;
  lotExpirationDate: string | null;
  storageZoneId: number;
  storageZoneCode: string;
  storageZoneDesignation: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isPerishable: boolean;
  requiresLotSelection: boolean;
  requiresZoneSelection: boolean;
}

interface ArticleAvailabilityResponse {
  article: {
    id: number;
    name: string;
    code: string;
    isPerishable: boolean;
    type: string;
  };
  availability: ArticleAvailability[];
  summary: {
    totalStock: number;
    totalReserved: number;
    totalAvailable: number;
    requiresLotSelection: boolean;
    requiresZoneSelection: boolean;
    canDirectDelivery: boolean;
  };
}

interface SplitItem {
  lotId: number | null;
  fromStorageZoneId: number | null;
  quantity: number;
}

interface DeliverySplitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: number | null;
  articleName: string;
  requestedQuantity: number;
  onSplitValidated: (splits: SplitItem[]) => void;
}

export function DeliverySplitModal({
  open,
  onOpenChange,
  articleId,
  articleName,
  requestedQuantity,
  onSplitValidated
}: DeliverySplitModalProps) {
  const { toast } = useToast();
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Récupérer les informations de disponibilité de l'article
  const { data: availabilityData, isLoading } = useQuery<ArticleAvailabilityResponse>({
    queryKey: ["article-availability", articleId],
    queryFn: async () => {
      if (!articleId) throw new Error("No article ID");
      const response = await fetch(`/api/articles/${articleId}/availability`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return response.json();
    },
    enabled: !!articleId && open,
  });

  // Initialiser les splits au chargement des données
  useEffect(() => {
    if (availabilityData && availabilityData.availability && availabilityData.availability.length > 0) {
      if (availabilityData.summary.canDirectDelivery) {
        // Cas simple : un seul lot et une seule zone, pas périssable
        const firstAvailability = availabilityData.availability[0];
        if (firstAvailability) {
          setSplits([{
            lotId: firstAvailability.lotId,
            fromStorageZoneId: firstAvailability.storageZoneId,
            quantity: Math.min(requestedQuantity, firstAvailability.availableQuantity)
          }]);
        }
      } else {
        // Cas complexe : initialiser avec des splits vides
        setSplits([]);
      }
    }
  }, [availabilityData, requestedQuantity]);

  // Valider les splits
  const validateSplits = (): boolean => {
    const newErrors: string[] = [];

    // Vérifier que la somme des quantités est correcte
    const totalSplitQuantity = splits.reduce((sum, split) => sum + split.quantity, 0);
    if (Math.abs(totalSplitQuantity - requestedQuantity) > 0.001) {
      newErrors.push(`La somme des quantités réparties (${totalSplitQuantity}) doit être égale à la quantité demandée (${requestedQuantity})`);
    }

    // Vérifier que chaque split a les informations requises
    splits.forEach((split, index) => {
      if (availabilityData) {
        if (availabilityData.summary.requiresLotSelection && split.lotId === null) {
          newErrors.push(`La sélection d'un lot est obligatoire pour l'article ${articleName}`);
        }
        if (availabilityData.summary.requiresZoneSelection && split.fromStorageZoneId === null) {
          newErrors.push(`La sélection d'une zone de stockage est obligatoire pour l'article ${articleName}`);
        }
      }

      if (split.quantity <= 0) {
        newErrors.push(`La quantité doit être supérieure à 0 pour la ligne ${index + 1}`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Ajouter un nouveau split
  const addSplit = () => {
    setSplits(prevSplits => [...prevSplits, { lotId: null, fromStorageZoneId: null, quantity: 0 }]);
  };

  // Supprimer un split
  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  // Mettre à jour un split
  const updateSplit = (index: number, field: keyof SplitItem, value: any) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  // Valider et fermer le modal
  const handleValidate = () => {
    if (validateSplits()) {
      onSplitValidated(splits);
      onOpenChange(false);
      setSplits([]);
      setErrors([]);
    }
  };

  // Calculer la quantité totale répartie
  const totalSplitQuantity = splits.reduce((sum, split) => sum + split.quantity, 0);
  const remainingQuantity = requestedQuantity - totalSplitQuantity;

  if (!articleId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Répartition de l'article : {articleName}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : availabilityData ? (
            <div className="space-y-6">
              {/* Résumé de la disponibilité */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Disponibilité de l'article</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {availabilityData.summary.totalStock}
                      </div>
                      <div className="text-sm text-gray-600">Stock total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {availabilityData.summary.totalReserved}
                      </div>
                      <div className="text-sm text-gray-600">Réservé</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {availabilityData.summary.totalAvailable}
                      </div>
                      <div className="text-sm text-gray-600">Disponible</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {requestedQuantity}
                      </div>
                      <div className="text-sm text-gray-600">Demandé</div>
                    </div>
                  </div>

                  {/* Indicateurs de contraintes */}
                  <div className="mt-4 space-y-2">
                    {availabilityData.summary.requiresLotSelection && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Sélection de lot obligatoire :</strong>
                          {availabilityData.article.isPerishable
                            ? " Article périssable"
                            : " Article disponible dans plusieurs lots"
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    {availabilityData.summary.requiresZoneSelection && (
                      <Alert>
                        <MapPin className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Sélection de zone obligatoire :</strong>
                          Article disponible dans plusieurs zones de stockage
                        </AlertDescription>
                      </Alert>
                    )}

                    {availabilityData.summary.canDirectDelivery && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Livraison directe possible :</strong>
                          Article dans un seul lot et une seule zone, non périssable
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Détail de la disponibilité par lot/zone */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Disponibilité détaillée</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Réservé</TableHead>
                        <TableHead className="text-right">Disponible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availabilityData.availability.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              {item.lotCode || "Aucun lot"}
                              {item.lotExpirationDate && (
                                <Badge variant="outline" className="text-xs">
                                  DLC: {new Date(item.lotExpirationDate).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {item.storageZoneDesignation}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.stockQuantity}</TableCell>
                          <TableCell className="text-right">{item.reservedQuantity}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {item.availableQuantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Formulaire de répartition */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition des quantités</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Lignes de répartition */}
                    {splits.map((split, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                        <div className="col-span-3">
                          <Label htmlFor={`lot-${index}`}>Lot</Label>
                          <Select
                            value={split.lotId?.toString() || "none"}
                            onValueChange={(value) => updateSplit(index, "lotId", value === "none" ? null : parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un lot" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucun lot</SelectItem>
                              {availabilityData?.availability
                                ?.filter((item): item is typeof item & { lotId: number } => item.lotId !== null && item.lotId !== undefined)
                                .map(item => (
                                  <SelectItem key={item.lotId} value={item.lotId.toString()}>
                                    {item.lotCode || `Lot ${item.lotId}`}
                                    {item.lotExpirationDate && ` (DLC: ${new Date(item.lotExpirationDate).toLocaleDateString()})`}
                                  </SelectItem>
                                )) || []}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-3">
                          <Label htmlFor={`zone-${index}`}>Zone</Label>
                          <Select
                            value={split.fromStorageZoneId?.toString() || "none"}
                            onValueChange={(value) => updateSplit(index, "fromStorageZoneId", value === "none" ? null : parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une zone" />
                            </SelectTrigger>
                            <SelectContent>
                              {availabilityData?.availability
                                ?.filter((item): item is typeof item & { storageZoneId: number } => item.storageZoneId !== null && item.storageZoneId !== undefined)
                                .map(item => (
                                  <SelectItem key={item.storageZoneId} value={item.storageZoneId.toString()}>
                                    {item.storageZoneDesignation}
                                  </SelectItem>
                                )) || []}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-3">
                          <Label htmlFor={`quantity-${index}`}>Quantité</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={split.quantity}
                            onChange={(e) => updateSplit(index, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>

                        <div className="col-span-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSplit(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Bouton d'ajout */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSplit}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une ligne de répartition
                    </Button>

                    {/* Résumé de la répartition */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Quantité demandée</div>
                        <div className="text-lg font-semibold">{requestedQuantity}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Quantité répartie</div>
                        <div className={`text-lg font-semibold ${Math.abs(totalSplitQuantity - requestedQuantity) < 0.001
                            ? "text-green-600"
                            : "text-red-600"
                          }`}>
                          {totalSplitQuantity}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Reste à répartir</div>
                        <div className={`text-lg font-semibold ${remainingQuantity === 0 ? "text-green-600" : "text-orange-600"
                          }`}>
                          {remainingQuantity}
                        </div>
                      </div>
                    </div>

                    {/* Messages d'erreur */}
                    {errors.length > 0 && (
                      <div className="space-y-2">
                        {errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Impossible de charger les informations de disponibilité
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleValidate}
              disabled={!availabilityData || splits.length === 0 || Math.abs(totalSplitQuantity - requestedQuantity) > 0.001}
            >
              Valider la répartition
            </Button>
          </DialogFooter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
