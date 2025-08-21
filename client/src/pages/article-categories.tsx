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
import { Plus, Edit, Trash2, Package, ChevronRight, Search, ChevronDown, FolderOpen, Folder } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ArticleCategory, InsertArticleCategory } from "@/../../shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

interface TreeNodeProps {
  category: ArticleCategory;
  children: ArticleCategory[];
  level: number;
  onEdit: (category: ArticleCategory) => void;
  onDelete: (id: number) => void;
  onAddSubcategory: (parentCategory: ArticleCategory) => void;
  expandedNodes: Set<number>;
  toggleNode: (id: number) => void;
  searchTerm: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  children,
  level,
  onEdit,
  onDelete,
  onAddSubcategory,
  expandedNodes,
  toggleNode,
  searchTerm
}) => {
  const isExpanded = expandedNodes.has(category.id);
  const hasChildren = children.length > 0;
  const indent = level * 24;
  // Fetch all categories
  const { data: categories = [], isLoading } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories"],
  });
  // Vérifier si cette catégorie ou ses enfants correspondent à la recherche
  const matchesSearch = (cat: ArticleCategory, term: string): boolean => {
    if (!term) return true;
    return cat.designation.toLowerCase().includes(term.toLowerCase());
  };

  const hasMatchingDescendant = (cat: ArticleCategory, allCategories: ArticleCategory[], term: string): boolean => {
    const directChildren = allCategories.filter(c => c.parentId === cat.id);
    return directChildren.some(child => 
      matchesSearch(child, term) || hasMatchingDescendant(child, allCategories, term)
    );
  };

  const shouldShow = matchesSearch(category, searchTerm) || hasMatchingDescendant(category, categories, searchTerm);

  if (!shouldShow) return null;

  return (
    <div className="w-full">
      <Card className={`mb-2 hover:shadow-md transition-shadow border-l-4 ${category.active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1" style={{ paddingLeft: `${indent}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 mr-2"
                  onClick={() => toggleNode(category.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-8 mr-2 flex justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
              )}
              
              <div className="flex items-center mr-3">
                {hasChildren ? (
                  isExpanded ? <FolderOpen className="h-5 w-5 text-blue-500" /> : <Folder className="h-5 w-5 text-blue-600" />
                ) : (
                  <Package className="h-5 w-5 text-gray-500" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {category.designation}
                </h3>
                <div className="flex items-center space-x-2">
                  {category.forSale && (
                    <Badge variant="default" className="px-2 py-0.5 text-xs font-medium">
                      Pour vente
                    </Badge>
                  )}
                  <Badge 
                    variant={category.active ? "default" : "secondary"}
                    className="px-2 py-0.5 text-xs font-medium"
                  >
                    {category.active ? "Active" : "Inactive"}
                  </Badge>
                  {hasChildren && (
                    <Badge variant="outline" className="px-2 py-0.5 text-xs">
                      {children.length} sous-catégorie{children.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => onAddSubcategory(category)}
                title="Ajouter une sous-catégorie"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4"
                onClick={() => onEdit(category)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 text-red-600 border-red-200 hover:bg-red-100 btn-red"
                onClick={() => onDelete(category.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enfants */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {children.map((childCategory) => {
            const grandChildren = categories.filter(c => c.parentId === childCategory.id);
            return (
              <TreeNode
                key={childCategory.id}
                category={childCategory}
                children={grandChildren}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSubcategory={onAddSubcategory}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                searchTerm={searchTerm}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function ArticleCategories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);
  const [parentForNewCategory, setParentForNewCategory] = useState<ArticleCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<InsertArticleCategory>({
    designation: "",
    parentId: undefined,
    forSale: false,
    active: true,
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([]));

  // Fetch all categories
  const { data: categories = [], isLoading } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories"],
  });

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = categories.filter(c => categories.some(child => child.parentId === c.id)).map(c => c.id);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertArticleCategory) => {
      return await apiRequest("/api/article-categories", "POST", data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/article-categories"] });
      setDialogOpen(false);
      resetForm();
      
      // Si une sous-catégorie a été créée, ouvrir automatiquement le parent
      if (variables.parentId) {
        setExpandedNodes(prev => new Set([...prev, variables.parentId!]));
      }
      
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
      return await apiRequest(`/api/article-categories/${id}`, "PUT", data);
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
      return await apiRequest(`/api/article-categories/${id}`, "DELETE");
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
    setParentForNewCategory(null);
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
    setParentForNewCategory(null);
    setCategoryForm({
      designation: category.designation,
      parentId: category.parentId || undefined,
      forSale: category.forSale,
      active: category.active,
    });
    setDialogOpen(true);
  };

  const handleAddSubcategory = (parentCategory: ArticleCategory) => {
    setEditingCategory(null);
    setParentForNewCategory(parentCategory);
    setCategoryForm({
      designation: "",
      parentId: parentCategory.id,
      forSale: parentCategory.forSale, // Hérite des propriétés du parent par défaut
      active: true,
    });
    setDialogOpen(true);
  };

  const handleAddNewCategory = () => {
    setEditingCategory(null);
    setParentForNewCategory(null);
    setCategoryForm({
      designation: "",
      parentId: undefined,
      forSale: false,
      active: true,
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

  // Obtenir les catégories racines
  const rootCategories = categories.filter(c => !c.parentId);

  usePageTitle("Catégories d'Articles");

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Chargement des catégories d'articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          
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
            />
          </div>
          <Package className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Liste des Catégories ({categories.length})
          </h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={expandAll}
              className="text-blue-600 hover:text-blue-700"
            >
              Tout développer
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={collapseAll}
              className="text-blue-600 hover:text-blue-700"
            >
              Tout réduire
            </Button>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAddNewCategory} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory 
                  ? "Modifier la Catégorie" 
                  : parentForNewCategory 
                    ? `Nouvelle Sous-catégorie de "${parentForNewCategory.designation}"`
                    : "Nouvelle Catégorie"
                }
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? "Modifiez les informations de cette catégorie d'article."
                  : parentForNewCategory
                    ? `Créez une nouvelle sous-catégorie pour "${parentForNewCategory.designation}".`
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
                />
              </div>
              {!parentForNewCategory && (
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
                    <SelectTrigger>
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
              )}
              {parentForNewCategory && (
                <div>
                  <Label>Catégorie parent</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <span className="text-sm font-medium">
                      {buildCategoryPath(parentForNewCategory, categories)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="for-sale"
                  checked={categoryForm.forSale}
                  onCheckedChange={(checked) => setCategoryForm({...categoryForm, forSale: checked})}
                />
                <Label htmlFor="for-sale">Catégorie pour la vente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={categoryForm.active}
                  onCheckedChange={(checked) => setCategoryForm({...categoryForm, active: checked})}
                />
                <Label htmlFor="active">Catégorie active</Label>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingCategory ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {rootCategories.map((rootCategory) => {
          const children = categories.filter(c => c.parentId === rootCategory.id);
          return (
            <TreeNode
              key={rootCategory.id}
              category={rootCategory}
              children={children}
              level={0}
              onEdit={handleEdit}
              onDelete={(id) => deleteCategoryMutation.mutate(id)}
              onAddSubcategory={handleAddSubcategory}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              searchTerm={searchTerm}
            />
          );
        })}
      </div>

      {rootCategories.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune catégorie</h3>
          <p className="text-gray-500">Commencez par créer votre première catégorie d'articles</p>
        </div>
      )}
    </div>
  );
}