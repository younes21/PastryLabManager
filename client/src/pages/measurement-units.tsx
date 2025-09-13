import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
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
import { usePageTitle } from "@/hooks/usePageTitle";

export default function MeasurementUnitsPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MeasurementCategory | null>(null);
  const [editingUnit, setEditingUnit] = useState<MeasurementUnit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
    factor: 1,
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
      factor: 1,
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

  const filteredUnits = units.filter(unit => {
    const matchesCategory = selectedCategory ? unit.categoryId === selectedCategory : true;
    const matchesSearch = searchTerm 
      ? unit.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const filteredCategories = categories.filter(category =>
    searchTerm 
      ? category.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  usePageTitle(' Unités de Mesure');

  return (
      <div className="p-8 space-y-8" data-testid="page-measurement-units">
        <div className="flex items-center justify-between">
        <div>
         
          <p className="text-lg text-gray-600">
            Configuration des unités pour le laboratoire
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 text-lg h-12"
              data-testid="input-search"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Scale className="h-10 w-10 text-blue-600" />
        </div>
        </div>

        <Tabs defaultValue="categories" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 h-12 w-1/2 m-auto" data-testid="tabs-list">
          <TabsTrigger value="categories" className="text-lg font-medium" data-testid="tab-categories">
            Catégories ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="units" className="text-lg font-medium" data-testid="tab-units">
            Unités ({filteredUnits.length})
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Catégories de Mesure</h2>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetCategoryForm} 
                  className="bg-accent hover:bg-accent-hover" 
                  data-testid="button-add-category"
                >
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
                      value={categoryForm.description ?? ""}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      placeholder="Description de la catégorie"
                      data-testid="textarea-category-description"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category-active"
                      checked={categoryForm.active ?? true}
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

          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
                data-testid={`card-category-${category.id}`}
              >
               <CardContent className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={category.active ? "default" : "secondary"}
                          className="px-2 py-0.5 text-xs font-medium"
                        >
                          {category.active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm font-bold text-blue-600">
                          {units.filter(u => u.categoryId === category.id).length} unités
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4"
                        onClick={() => handleEditCategory(category)}
                        data-testid={`button-edit-category-${category.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h2 className="text-xl font-semibold text-gray-800">Unités de Mesure</h2>
              <Select 
                value={selectedCategory?.toString() || "all"} 
                onValueChange={(value) => {
                  setSelectedCategory(value === "all" ? null : parseInt(value));
                }}
              >
                <SelectTrigger className="w-64 h-12 text-lg" data-testid="select-category-filter">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name} ({units.filter(u => u.categoryId === category.id).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetUnitForm} 
                  className="bg-accent hover:bg-accent-hover" 
                  data-testid="button-add-unit"
                >
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
                      value={unitForm.factor}
                      onChange={(e) => setUnitForm({...unitForm, factor: parseFloat(e.target.value)})}
                      placeholder="1"
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
                      checked={unitForm.active ?? true}
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

          <div className="space-y-4">
            {filteredUnits.map((unit) => {
              const category = categories.find(c => c.id === unit.categoryId);
              return (
                <Card 
                  key={unit.id} 
                  className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
                  data-testid={`card-unit-${unit.id}`}
                >
                  <CardContent className="px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {unit.label}
                          </h3>
                          <span className="text-sm font-bold text-blue-600">
                            ({unit.abbreviation})
                          </span>
                          <span className="text-sm text-gray-500">
                            {category?.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="bg-gray-50 px-3 py-1 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                              Facteur: <span className="font-bold text-green-600">
                                {unit.factor}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={`${getTypeColor(unit.type)} px-2 py-0.5 text-xs font-medium`}
                          >
                            {getTypeName(unit.type)}
                          </Badge>
                          <Badge 
                            variant={unit.active ? "default" : "secondary"}
                            className="px-2 py-0.5 text-xs font-medium"
                          >
                            {unit.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-4"
                          onClick={() => handleEditUnit(unit)}
                          data-testid={`button-edit-unit-${unit.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-4 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => deleteUnitMutation.mutate(unit.id)}
                          data-testid={`button-delete-unit-${unit.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
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