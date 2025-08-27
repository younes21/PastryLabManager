import React, { useState } from "react";
import { X, Save, Calendar, Package, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface AddLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any;
  onLotAdded: (lot: any) => void;
  suppliers: any[];
}

export const AddLotModal: React.FC<AddLotModalProps> = ({
  isOpen,
  onClose,
  article,
  onLotAdded,
  suppliers,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    manufacturingDate: "",
    useDate: "",
    expirationDate: "",
    alertDate: "",
    supplierId: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const lotData = {
        articleId: article.id,
        code: formData.code,
        manufacturingDate: formData.manufacturingDate || null,
        useDate: formData.useDate || null,
        expirationDate: formData.expirationDate || null,
        alertDate: formData.alertDate || null,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        notes: formData.notes || null,
      };

      const response = await apiRequest("/api/lots", "POST", lotData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création du lot");
      }

      const newLot = await response.json();
      onLotAdded(newLot);
      onClose();
      
      // Reset form
      setFormData({
        code: "",
        manufacturingDate: "",
        useDate: "",
        expirationDate: "",
        alertDate: "",
        supplierId: "",
        notes: "",
      });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Ajouter un lot</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Article info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700">
              {article?.name}
            </div>
            <div className="text-xs text-gray-500">
              {article?.code} - {article?.unit}
            </div>
          </div>

          {/* Code du lot */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">
              Code du lot *
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="Ex: LOT-2024-001"
              required
              className="text-sm"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manufacturingDate" className="text-sm font-medium">
                Date de fabrication
              </Label>
              <Input
                id="manufacturingDate"
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => handleInputChange("manufacturingDate", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="useDate" className="text-sm font-medium">
                Date limite d'utilisation
              </Label>
              <Input
                id="useDate"
                type="date"
                value={formData.useDate}
                onChange={(e) => handleInputChange("useDate", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="text-sm font-medium">
                Date de péremption
              </Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange("expirationDate", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertDate" className="text-sm font-medium">
                Date d'alerte
              </Label>
              <Input
                id="alertDate"
                type="date"
                value={formData.alertDate}
                onChange={(e) => handleInputChange("alertDate", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-sm font-medium">
              Fournisseur
            </Label>
            <Select
              value={formData.supplierId || "none"}
              onValueChange={(value) => handleInputChange("supplierId", value === "none" ? "" : value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun fournisseur</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Informations supplémentaires sur ce lot..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !formData.code.trim()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Création...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Créer le lot
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
