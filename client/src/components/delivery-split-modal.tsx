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
  isViewing:boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: number | null;
  articleName: string;
  requestedQuantity: number;
  existingSplits?: SplitItem[];
  onSplitValidated: (splits: SplitItem[]) => void;
}

export function DeliverySplitModal({
  isViewing,
  open,
  onOpenChange,
  articleId,
  articleName,
  requestedQuantity,
  existingSplits,
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
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: false,
  });

  // Obtenir les lots distincts
  const getDistinctLots = () => {
    if (!availabilityData?.availability) return [];
    const lots = new Map();
    availabilityData.availability.forEach(item => {
      if (item.lotId !== null && item.lotId !== undefined) {
        lots.set(item.lotId, {
          id: item.lotId,
          code: item.lotCode,
          expirationDate: item.lotExpirationDate
        });
      }
    });
    return Array.from(lots.values());
  };

  // Obtenir les zones distinctes
  const getDistinctZones = () => {
    if (!availabilityData?.availability) return [];
    const zones = new Map();
    availabilityData.availability.forEach(item => {
      if (item.storageZoneId !== null && item.storageZoneId !== undefined) {
        zones.set(item.storageZoneId, {
          id: item.storageZoneId,
          code: item.storageZoneCode,
          designation: item.storageZoneDesignation
        });
      }
    });
    return Array.from(zones.values());
  };

  // Initialiser les splits au chargement des données
  useEffect(() => {
    if (availabilityData && availabilityData.availability && availabilityData.availability.length > 0) {
      // Si des splits existants sont fournis, les utiliser
      if (existingSplits && existingSplits.length > 0) {
        setSplits(existingSplits);
      } else if (availabilityData.summary.canDirectDelivery) {
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
        // Cas complexe : initialiser avec un split vide pour permettre la sélection
        setSplits([{ lotId: null, fromStorageZoneId: null, quantity: 0 }]);
      }
    }
  }, [availabilityData, requestedQuantity, existingSplits]);

  // Valider les splits multiples
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
          newErrors.push(`La sélection d'un lot est obligatoire pour l'article ${articleName} (ligne ${index + 1})`);
        }
        if (availabilityData.summary.requiresZoneSelection && split.fromStorageZoneId === null) {
          newErrors.push(`La sélection d'une zone de stockage est obligatoire pour l'article ${articleName} (ligne ${index + 1})`);
        }
      }

      if (split.quantity <= 0) {
        newErrors.push(`La quantité doit être supérieure à 0 pour la ligne ${index + 1}`);
      }

      // Vérifier la disponibilité pour cette combinaison
      if (split.lotId !== null && split.fromStorageZoneId !== null) {
        const availability = availabilityData?.availability.find(item =>
          item.lotId === split.lotId && item.storageZoneId === split.fromStorageZoneId
        );

        if (!availability) {
          newErrors.push(`Cette combinaison lot/zone n'est pas disponible en stock (ligne ${index + 1})`);
        } else if (split.quantity > availability.availableQuantity) {
          newErrors.push(`Quantité insuffisante en stock pour cette combinaison (disponible: ${availability.availableQuantity}, ligne ${index + 1})`);
        }
      }
    });

    // Vérifier les doublons de combinaisons
    const combinations = new Set();
    splits.forEach((split, index) => {
      if (split.lotId !== null && split.fromStorageZoneId !== null) {
        const key = `${split.lotId}-${split.fromStorageZoneId}`;
        if (combinations.has(key)) {
          newErrors.push(`La combinaison lot/zone est utilisée plusieurs fois (ligne ${index + 1})`);
        }
        combinations.add(key);
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

  // Calculer les quantités pour l'affichage
  const totalSplitQuantity = splits.reduce((sum, split) => sum + split.quantity, 0);
  const remainingQuantity = requestedQuantity - totalSplitQuantity;

  if (!articleId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[100vh]  overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="w-5 h-5" />
            Répartition : {articleName}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : availabilityData ? (
            <div className="space-y-2">
              {/* Résumé compact */}
              <div className="flex flex-wrap justify-between items-center bg-slate-100  rounded px-4 py-2 text-lg font-bold">
                <div><span className="font-semibold text-blue-600">Stock:</span> {availabilityData.summary.totalStock}</div>
                <div><span className="font-semibold text-orange-600">Réservé:</span> {availabilityData.summary.totalReserved}</div>
                <div><span className="font-semibold text-green-600">Dispo:</span> {availabilityData.summary.totalAvailable}</div>
                <div><span className="font-semibold text-purple-600">Demandé:</span> {requestedQuantity}</div>
              </div>
              {/* Indicateurs de contraintes */}
              <div className="flex flex-wrap gap-2">
                {availabilityData.summary.requiresLotSelection && (
                  <div className="p-1  w-full rounded-lg border flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-4 w-4" />
                    <b>Lot obligatoire :</b> {availabilityData.article.isPerishable ? "Produit Périssable" : "existe Plusieurs lots"}
                  </div>
                )}
                {availabilityData.summary.requiresZoneSelection && (
                  <div className="p-1  w-full rounded-lg border flex items-center gap-2 text-orange-800">
                    <MapPin className="h-4 w-4" />
                    <b>Zone obligatoire :</b> Plusieurs zones
                  </div>
                )}
                {availabilityData.summary.canDirectDelivery && (
                  <div className="p-1  w-full rounded-lg border flex items-center gap-2 text-orange-800">
                    <CheckCircle className="h-3 w-3" />
                    <b>Livraison directe</b>

                  </div>
                )}
              </div>
              {/* Détail de la disponibilité par lot/zone */}
              <br />
              <fieldset className="border border-gray-300 rounded-md p-2">
                <legend className="px-2 text-gray-600 text-lg font-bold">Répartition par lot / zone :</legend>

                <Table className="text-md  ">
                  <TableHeader>
                    <TableRow className="h-7">
                      <TableHead>Lot</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Réservé</TableHead>
                      <TableHead className="text-right">Dispo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availabilityData.availability.map((item, index) => (
                      <TableRow key={index} className="h-7">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {item.lotCode || "Aucun lot"}
                            {item.lotExpirationDate && (
                              <Badge variant="outline" className="text-[11px] px-1 py-0.5">
                                DLC: {new Date(item.lotExpirationDate).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.storageZoneDesignation}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.stockQuantity}</TableCell>
                        <TableCell className="text-right">{item.reservedQuantity}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{item.availableQuantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </fieldset>
              <br />
              {/* Formulaire de répartition multiple */}
              <fieldset className="border border-gray-300 rounded-md p-4">
                <legend className="px-2 text-green-900 text-lg font-bold">Sélectionner la répartition:</legend>
                <div className="space-y-4">
                  {/* Bouton pour ajouter une ligne */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isViewing}
                    onClick={addSplit}
                    className="w-full h-10 text-md bg-blue-50 hover:bg-accent-hover hover:text-white border-blue-300"
                  >
                    <Plus className="w-4 h-4 " />  Ajouter une ligne
                  </Button>

                  {/* Lignes de répartition */}
                  {splits.map((split, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end ">

                      <div className="col-span-4">
                        <Label className="text-xs text-gray-600 mb-1 block">Lot:</Label>
                        <Select
                          value={split.lotId?.toString() || "none"}
                          onValueChange={(value) => updateSplit(index, "lotId", value === "none" ? null : parseInt(value))}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Sélectionner un lot" />
                          </SelectTrigger>
                          <SelectContent >
                            <SelectItem value="none">Aucun lot</SelectItem>
                            {getDistinctLots().map(lot => (
                              <SelectItem key={lot.id} value={lot.id.toString()}>
                                <div className="flex items-center gap-2 ">
                                  <Package className="w-3 h-3" />
                                  <span>{lot.designation || lot.code || `Lot ${lot.id}`}</span>
                                 
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-4">
                        <Label className="text-xs text-gray-600 mb-1 block">Zone:</Label>
                        <Select
                          value={split.fromStorageZoneId?.toString() || "none"}
                          onValueChange={(value) => updateSplit(index, "fromStorageZoneId", value === "none" ? null : parseInt(value))}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Sélectionner une zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDistinctZones().map(zone => (
                              <SelectItem key={zone.id} value={zone.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  <span>{zone.designation}</span>

                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600 mb-1 block">Quantité:</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={split.quantity}
                          onChange={(e) => updateSplit(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="h-9 text-sm font-bold text-center"
                          placeholder="0"
                        />
                      </div>

                      <div className="col-span-1 flex ">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSplit(index)}
                          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                          title="Supprimer cette ligne"
                          disabled={splits.length === 1|| isViewing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Résumé de la répartition */}
                  <div className="flex items-center justify-between p-3 px-4 font-semibold bg-slate-100 rounded text-lg">
                    <div>
                      <span className="text-gray-600">Demandé:</span> <span className="font-bold">{requestedQuantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Réparti:</span> <span className={`font-bold ${Math.abs(totalSplitQuantity - requestedQuantity) < 0.001 ? "text-green-600" : "text-orange-600"}`}>{totalSplitQuantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reste:</span> <span className={`font-bold ${remainingQuantity === 0 ? "text-green-600" : "text-orange-600"}`}>{remainingQuantity}</span>
                    </div>
                  </div>

                  {/* Messages d'erreur */}
                  {errors.length > 0 && (
                    <div className="space-y-1">
                      {errors.map((error, index) => (
                        <div key={index} className="p-2 border border-red-600 rounded-lg flex items-center gap-2 text-red-800 font-bold bg-red-50">
                          <AlertTriangle className="h-3 w-3" />
                          <AlertDescription>{error}</AlertDescription>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </fieldset>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-lg">
              Impossible de charger les informations de disponibilité
            </div>
          )}
          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 text-lg">Annuler</Button>
            <Button
              onClick={handleValidate}
              disabled={isViewing ||!availabilityData || splits.length === 0 || Math.abs(totalSplitQuantity - requestedQuantity) > 0.001}
              className="h-9 px-4 text-lg"
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
