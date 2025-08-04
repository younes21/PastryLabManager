import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Package, ChevronRight, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ArticleCategory, InsertArticleCategory } from "@/../../shared/schema";

export default function ArticleCategories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<InsertArticleCategory>({
    designation: "",
    parentId: undefined,
    forSale: false,
    active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/article-categories"],
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertArticleCategory) => {
      const response = await apiRequest("POST", "/api/article-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/article-categories"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Catégorie créée",
        description: "La catégorie d'article a été créée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie d'article.",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertArticleCategory> }) => {
      const response = await apiRequest("PUT", `/api/article-categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/article-categories"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Catégorie modifiée",
        description: "La catégorie d'article a été modifiée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la catégorie d'article.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/article-categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/article-categories"] });
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie d'article a été supprimée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie d'article.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCategoryForm({
      designation: "",
      parentId: undefined,
      forSale: false,
      active: true,
    });
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const handleEdit = (category: ArticleCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      designation: category.designation,
      parentId: category.parentId || undefined,
      forSale: category.forSale,
      active: category.active,
    });
    setDialogOpen(true);
  };

  // Build category path for display
  const buildCategoryPath = (category: ArticleCategory, allCategories: ArticleCategory[]): string => {
    const path: string[] = [];
    let current: ArticleCategory | undefined = category;
    
    while (current) {
      path.unshift(current.designation);
      current = current.parentId ? allCategories.find(c => c.id === current!.parentId) : undefined;
    }
    
    return path.join(" > ");
  };

  // Get available parent categories (excluding self and descendants)
  const getAvailableParents = (excludeId?: number): ArticleCategory[] => {
    if (!excludeId) return categories;
    
    const isDescendant = (categoryId: number, potentialAncestorId: number): boolean => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return false;
      if (category.parentId === potentialAncestorId) return true;
      if (category.parentId) return isDescendant(category.parentId, potentialAncestorId);
      return false;
    };
    
    return categories.filter(c => 
      c.id !== excludeId && !isDescendant(c.id, excludeId)
    );
  };

  // Filter categories based on search
  const filteredCategories = categories.filter((category: ArticleCategory) =>
    searchTerm === "" || 
    category.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buildCategoryPath(category, categories).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-500">Chargement des catégories d'articles...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-8" data-testid="page-article-categories">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Catégories d'Articles
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Gérez les catégories pour vos produits, ingrédients et services
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 h-12 text-lg"
                data-testid="input-search"
              />
            </div>
            <Package className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Liste des Catégories ({filteredCategories.length})
            </h2>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm} 
                className="h-10 px-4 text-base font-medium"
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
                    ? "Modifiez les informations de cette catégorie d'article."
                    : "Créez une nouvelle catégorie d'article."
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="designation">Désignation</Label>
                  <Input
                    id="designation"
                    value={categoryForm.designation}
                    onChange={(e) => setCategoryForm({...categoryForm, designation: e.target.value})}
                    placeholder="Ex: Pâtisseries, Ingrédients de base..."
                    required
                    data-testid="input-designation"
                  />
                </div>
                <div>
                  <Label htmlFor="parent">Catégorie parent (optionnel)</Label>
                  <Select 
                    value={categoryForm.parentId?.toString() || "none"} 
                    onValueChange={(value) => {
                      setCategoryForm({
                        ...categoryForm, 
                        parentId: value === "none" ? undefined : parseInt(value)
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-parent">
                      <SelectValue placeholder="Aucune catégorie parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune catégorie parent</SelectItem>
                      {getAvailableParents(editingCategory?.id).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {buildCategoryPath(category, categories)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="for-sale"
                    checked={categoryForm.forSale}
                    onCheckedChange={(checked) => setCategoryForm({...categoryForm, forSale: checked})}
                    data-testid="switch-for-sale"
                  />
                  <Label htmlFor="for-sale">Catégorie pour la vente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={categoryForm.active}
                    onCheckedChange={(checked) => setCategoryForm({...categoryForm, active: checked})}
                    data-testid="switch-active"
                  />
                  <Label htmlFor="active">Catégorie active</Label>
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
              className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
              data-testid={`card-category-${category.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center space-x-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {category.designation}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                        <span>{buildCategoryPath(category, categories)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {category.forSale && (
                          <Badge 
                            variant="default"
                            className="px-2 py-0.5 text-xs font-medium"
                          >
                            Pour vente
                          </Badge>
                        )}
                        <Badge 
                          variant={category.active ? "default" : "secondary"}
                          className="px-2 py-0.5 text-xs font-medium"
                        >
                          {category.active ? "Active" : "Inactive"}
                        </Badge>
                        {category.parentId && (
                          <div className="flex items-center text-blue-600 text-xs">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            <span>Sous-catégorie</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-4"
                      onClick={() => handleEdit(category)}
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

        {filteredCategories.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune catégorie trouvée</h3>
            <p className="text-gray-500">Aucune catégorie ne correspond à votre recherche "{searchTerm}"</p>
          </div>
        )}

        {filteredCategories.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune catégorie</h3>
            <p className="text-gray-500">Commencez par créer votre première catégorie d'articles</p>
          </div>
        )}
      </div>
    </Layout>
  );
}