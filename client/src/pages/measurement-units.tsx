import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MeasurementCategory, MeasurementUnit, InsertMeasurementCategory, InsertMeasurementUnit } from "@/../../shared/schema";

export default function MeasurementUnitsPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MeasurementCategory | null>(null);
  const [editingUnit, setEditingUnit] = useState<MeasurementUnit | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Category form state
  const [categoryForm, setCategoryForm] = useState<InsertMeasurementCategory>({
    name: "",
    description: "",
    active: true
  });

  // Unit form state
  const [unitForm, setUnitForm] = useState<InsertMeasurementUnit>({
    categoryId: 0,
    label: "",
    abbreviation: "",
    type: "reference",
    factor: "1.000000",
    active: true
  });

  // Queries
  const { data: categories = [] } = useQuery<MeasurementCategory[]>({
    queryKey: ["/api/measurement-categories"],
  });

  const { data: units = [] } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units"],
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: InsertMeasurementCategory) => apiRequest("/api/measurement-categories", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-categories"] });
      setCategoryDialogOpen(false);
      resetCategoryForm();
      toast({ title: "Catégorie créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création de la catégorie", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMeasurementCategory> }) =>
      apiRequest(`/api/measurement-categories/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-categories"] });
      setCategoryDialogOpen(false);
      resetCategoryForm();
      toast({ title: "Catégorie modifiée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification de la catégorie", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/measurement-categories/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-categories"] });
      toast({ title: "Catégorie supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression de la catégorie", variant: "destructive" });
    }
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: InsertMeasurementUnit) => apiRequest("/api/measurement-units", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-units"] });
      setUnitDialogOpen(false);
      resetUnitForm();
      toast({ title: "Unité créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création de l'unité", variant: "destructive" });
    }
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMeasurementUnit> }) =>
      apiRequest(`/api/measurement-units/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-units"] });
      setUnitDialogOpen(false);
      resetUnitForm();
      toast({ title: "Unité modifiée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification de l'unité", variant: "destructive" });
    }
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/measurement-units/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-units"] });
      toast({ title: "Unité supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression de l'unité", variant: "destructive" });
    }
  });

  // Helper functions
  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", active: true });
    setEditingCategory(null);
  };

  const resetUnitForm = () => {
    setUnitForm({
      categoryId: 0,
      label: "",
      abbreviation: "",
      type: "reference",
      factor: "1.000000",
      active: true
    });
    setEditingUnit(null);
  };

  const handleEditCategory = (category: MeasurementCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      active: category.active ?? true
    });
    setCategoryDialogOpen(true);
  };

  const handleEditUnit = (unit: MeasurementUnit) => {
    setEditingUnit(unit);
    setUnitForm({
      categoryId: unit.categoryId!,
      label: unit.label,
      abbreviation: unit.abbreviation,
      type: unit.type,
      factor: unit.factor,
      active: unit.active ?? true
    });
    setUnitDialogOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUnit) {
      updateUnitMutation.mutate({ id: editingUnit.id, data: unitForm });
    } else {
      createUnitMutation.mutate(unitForm);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "reference": return "bg-blue-100 text-blue-800";
      case "larger": return "bg-green-100 text-green-800";
      case "smaller": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "reference": return "Référence";
      case "larger": return "Plus grande";
      case "smaller": return "Plus petite";
      default: return type;
    }
  };

  const filteredUnits = selectedCategory
    ? units.filter(unit => unit.categoryId === selectedCategory)
    : units;

  return (
    <div className="space-y-6" data-testid="page-measurement-units">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
            Gestion des Unités de Mesure
          </h1>
          <p className="text-gray-600">
            Gérez les catégories et unités de mesure pour votre laboratoire
          </p>
        </div>
        <Scale className="h-8 w-8 text-blue-600" />
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="categories" data-testid="tab-categories">Catégories</TabsTrigger>
          <TabsTrigger value="units" data-testid="tab-units">Unités</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Catégories de Mesure</h2>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetCategoryForm} data-testid="button-add-category">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Catégorie
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-category">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Modifier la Catégorie" : "Nouvelle Catégorie"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory 
                      ? "Modifiez les informations de cette catégorie de mesure."
                      : "Créez une nouvelle catégorie de mesure."
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Nom de la catégorie</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      placeholder="Ex: Poids, Volume, Quantité..."
                      required
                      data-testid="input-category-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      placeholder="Description de la catégorie"
                      data-testid="textarea-category-description"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category-active"
                      checked={categoryForm.active}
                      onCheckedChange={(checked) => setCategoryForm({...categoryForm, active: checked})}
                      data-testid="switch-category-active"
                    />
                    <Label htmlFor="category-active">Catégorie active</Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit" data-testid="button-save-category">
                      {editingCategory ? "Modifier" : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} data-testid={`card-category-${category.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        data-testid={`button-edit-category-${category.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={category.active ? "default" : "secondary"}>
                      {category.active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {units.filter(u => u.categoryId === category.id).length} unités
                    </span>
                  </div>
                </CardHeader>
                {category.description && (
                  <CardContent>
                    <CardDescription>{category.description}</CardDescription>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">Unités de Mesure</h2>
              <Select value={selectedCategory?.toString() || "all"} onValueChange={(value) => {
                setSelectedCategory(value === "all" ? null : parseInt(value));
              }}>
                <SelectTrigger className="w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetUnitForm} data-testid="button-add-unit">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Unité
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-unit">
                <DialogHeader>
                  <DialogTitle>
                    {editingUnit ? "Modifier l'Unité" : "Nouvelle Unité"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUnit 
                      ? "Modifiez les informations de cette unité de mesure."
                      : "Créez une nouvelle unité de mesure."
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUnitSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="unit-category">Catégorie</Label>
                    <Select
                      value={unitForm.categoryId?.toString() || undefined}
                      onValueChange={(value) => setUnitForm({...unitForm, categoryId: parseInt(value)})}
                    >
                      <SelectTrigger data-testid="select-unit-category">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit-label">Libellé</Label>
                      <Input
                        id="unit-label"
                        value={unitForm.label}
                        onChange={(e) => setUnitForm({...unitForm, label: e.target.value})}
                        placeholder="Ex: Kilogramme"
                        required
                        data-testid="input-unit-label"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit-abbreviation">Abréviation</Label>
                      <Input
                        id="unit-abbreviation"
                        value={unitForm.abbreviation}
                        onChange={(e) => setUnitForm({...unitForm, abbreviation: e.target.value})}
                        placeholder="Ex: kg"
                        required
                        data-testid="input-unit-abbreviation"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="unit-type">Type</Label>
                    <Select
                      value={unitForm.type}
                      onValueChange={(value) => setUnitForm({...unitForm, type: value as "reference" | "larger" | "smaller"})}
                    >
                      <SelectTrigger data-testid="select-unit-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reference">Référence</SelectItem>
                        <SelectItem value="larger">Plus grande</SelectItem>
                        <SelectItem value="smaller">Plus petite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit-factor">Facteur de conversion</Label>
                    <Input
                      id="unit-factor"
                      type="number"
                      step="0.000001"
                      value={unitForm.factor}
                      onChange={(e) => setUnitForm({...unitForm, factor: e.target.value})}
                      placeholder="1.000000"
                      required
                      data-testid="input-unit-factor"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Facteur de conversion vers l'unité de référence
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="unit-active"
                      checked={unitForm.active}
                      onCheckedChange={(checked) => setUnitForm({...unitForm, active: checked})}
                      data-testid="switch-unit-active"
                    />
                    <Label htmlFor="unit-active">Unité active</Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit" data-testid="button-save-unit">
                      {editingUnit ? "Modifier" : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((unit) => {
              const category = categories.find(c => c.id === unit.categoryId);
              return (
                <Card key={unit.id} data-testid={`card-unit-${unit.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {unit.label} ({unit.abbreviation})
                        </CardTitle>
                        <p className="text-sm text-gray-600">{category?.name}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUnit(unit)}
                          data-testid={`button-edit-unit-${unit.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUnitMutation.mutate(unit.id)}
                          data-testid={`button-delete-unit-${unit.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getTypeColor(unit.type)}>
                          {getTypeName(unit.type)}
                        </Badge>
                        <Badge variant={unit.active ? "default" : "secondary"}>
                          {unit.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Facteur: {parseFloat(unit.factor).toFixed(6)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}