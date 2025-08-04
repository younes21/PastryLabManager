import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Article, ArticleCategory, PriceRule } from "@shared/schema";

interface PriceRuleFormProps {
  priceListId: number;
  articles: Article[];
  categories: ArticleCategory[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  editingRule?: PriceRule | null;
  isLoading?: boolean;
}

export function PriceRuleForm({
  priceListId,
  articles,
  categories,
  onSubmit,
  onCancel,
  editingRule,
  isLoading = false
}: PriceRuleFormProps) {
  const [formData, setFormData] = useState({
    applyTo: editingRule?.applyTo || "article",
    articleId: editingRule?.articleId?.toString() || "",
    categoryId: editingRule?.categoryId?.toString() || "",
    priceType: editingRule?.priceType || "fixed",
    fixedPrice: editingRule?.fixedPrice || "",
    discountPercent: editingRule?.discountPercent || "",
    formulaExpression: editingRule?.formulaExpression || "",
    minQuantity: editingRule?.minQuantity || "1",
    validFrom: editingRule?.validFrom ? editingRule.validFrom.split('T')[0] : "",
    validTo: editingRule?.validTo ? editingRule.validTo.split('T')[0] : "",
    active: editingRule ? editingRule.active : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      priceListId,
      applyTo: formData.applyTo,
      articleId: formData.applyTo === "article" && formData.articleId ? parseInt(formData.articleId) : undefined,
      categoryId: formData.applyTo === "category" && formData.categoryId ? parseInt(formData.categoryId) : undefined,
      priceType: formData.priceType,
      fixedPrice: formData.priceType === "fixed" && formData.fixedPrice ? formData.fixedPrice : undefined,
      discountPercent: formData.priceType === "discount" && formData.discountPercent ? formData.discountPercent : undefined,
      formulaExpression: formData.priceType === "formula" && formData.formulaExpression ? formData.formulaExpression : undefined,
      minQuantity: formData.minQuantity,
      validFrom: formData.validFrom ? formData.validFrom + "T00:00:00.000Z" : undefined,
      validTo: formData.validTo ? formData.validTo + "T23:59:59.999Z" : undefined,
      active: formData.active,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter categories that are for sale
  const salesCategories = categories.filter(cat => cat.forSale);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {editingRule ? "Modifier la règle de prix" : "Nouvelle règle de prix"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Appliquer à */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Appliquer à</Label>
            <RadioGroup
              value={formData.applyTo}
              onValueChange={(value) => handleInputChange("applyTo", value)}
              className="flex flex-row space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="article" id="apply-article" />
                <Label htmlFor="apply-article">Article</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="category" id="apply-category" />
                <Label htmlFor="apply-category">Catégorie</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sélection Article ou Catégorie */}
          <div className="space-y-3">
            {formData.applyTo === "article" ? (
              <div>
                <Label htmlFor="articleId" className="text-base font-medium">
                  Choisir l'article
                </Label>
                <Select 
                  value={formData.articleId} 
                  onValueChange={(value) => handleInputChange("articleId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un article" />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.map((article) => (
                      <SelectItem key={article.id} value={article.id.toString()}>
                        [{article.type}] {article.name} - {article.price}€/{article.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="categoryId" className="text-base font-medium">
                  Choisir la catégorie
                </Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => handleInputChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Type de prix */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Type de prix</Label>
            <RadioGroup
              value={formData.priceType}
              onValueChange={(value) => handleInputChange("priceType", value)}
              className="flex flex-row space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="price-fixed" />
                <Label htmlFor="price-fixed">Prix fixe</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="discount" id="price-discount" />
                <Label htmlFor="price-discount">Remise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formula" id="price-formula" />
                <Label htmlFor="price-formula">Formule</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Valeurs selon le type de prix */}
          <div className="space-y-4">
            {formData.priceType === "fixed" && (
              <div>
                <Label htmlFor="fixedPrice" className="text-base font-medium">
                  Valeur prix fixe (€)
                </Label>
                <Input
                  id="fixedPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.fixedPrice}
                  onChange={(e) => handleInputChange("fixedPrice", e.target.value)}
                  data-testid="input-fixed-price"
                />
              </div>
            )}

            {formData.priceType === "discount" && (
              <div>
                <Label htmlFor="discountPercent" className="text-base font-medium">
                  Pourcentage de remise (%)
                </Label>
                <Input
                  id="discountPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  value={formData.discountPercent}
                  onChange={(e) => handleInputChange("discountPercent", e.target.value)}
                  data-testid="input-discount-percent"
                />
              </div>
            )}

            {formData.priceType === "formula" && (
              <div>
                <Label htmlFor="formulaExpression" className="text-base font-medium">
                  Expression de formule
                </Label>
                <Textarea
                  id="formulaExpression"
                  placeholder="Ex: prix_base * 1.2 + 5"
                  value={formData.formulaExpression}
                  onChange={(e) => handleInputChange("formulaExpression", e.target.value)}
                  data-testid="input-formula-expression"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Variables disponibles: prix_base, cout_unitaire, quantite
                </p>
              </div>
            )}
          </div>

          {/* Quantité minimale */}
          <div>
            <Label htmlFor="minQuantity" className="text-base font-medium">
              Quantité minimale pour appliquer la règle
            </Label>
            <Input
              id="minQuantity"
              type="number"
              step="0.001"
              min="0"
              placeholder="1"
              value={formData.minQuantity}
              onChange={(e) => handleInputChange("minQuantity", e.target.value)}
              data-testid="input-min-quantity"
            />
          </div>

          {/* Période de validité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom" className="text-base font-medium">
                Valide à partir du
              </Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleInputChange("validFrom", e.target.value)}
                data-testid="input-valid-from"
              />
            </div>
            <div>
              <Label htmlFor="validTo" className="text-base font-medium">
                Valide jusqu'au
              </Label>
              <Input
                id="validTo"
                type="date"
                value={formData.validTo}
                onChange={(e) => handleInputChange("validTo", e.target.value)}
                data-testid="input-valid-to"
              />
            </div>
          </div>

          {/* Règle active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleInputChange("active", checked)}
              data-testid="checkbox-active"
            />
            <Label htmlFor="active" className="text-base font-medium">
              Règle active
            </Label>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Sauvegarde..." : editingRule ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}