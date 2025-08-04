import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Package, DollarSign, Search, Filter, MoreHorizontal, ChefHat } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { z } from "zod";
import { 
  Article,
  InsertArticle,
  insertArticleSchema,
  ArticleCategory,
  StorageZone,
  type Recipe 
} from "@shared/schema";
import { RecipeDisplay } from "@/components/recipe-display";

// Schéma de validation pour les produits avec tous les champs
const productSchema = insertArticleSchema.extend({
  type: z.literal("product"),
  costPerUnit: z.string().optional(),
  currentStock: z.string().optional(),
  minStock: z.string().optional(),
  maxStock: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function Products() {
  console.log("🔥 PRODUCTS PAGE - Début de rendu");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Article | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Récupération des articles de type "product"
  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    select: (data) => {
      console.log("🔥 PRODUCTS - Articles récupérés:", data);
      const products = data.filter(article => article.type === "product");
      console.log("🔥 PRODUCTS - Produits filtrés:", products);
      return products;
    }
  });

  // Filtrage des produits selon le terme de recherche
  const filteredProducts = articles.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  console.log("🔥 PRODUCTS - Produits affichés:", filteredProducts);

  const handleCreateProduct = () => {
    console.log("🔥 PRODUCTS - Création d'un nouveau produit");
    setSelectedProduct(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Article) => {
    console.log("🔥 PRODUCTS - Édition du produit:", product);
    setSelectedProduct(product);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement des produits...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Produits</h1>
          <p className="text-muted-foreground">Gérez vos produits finis et leurs recettes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateProduct} data-testid="button-create-product">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Modifier le Produit" : "Nouveau Produit"}
              </DialogTitle>
            </DialogHeader>
            <ProductForm product={selectedProduct} onSuccess={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des produits */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "Aucun produit trouvé" : "Aucun produit enregistré"}
                      </p>
                      {!searchTerm && (
                        <Button onClick={handleCreateProduct} variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Créer le premier produit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-mono text-sm">
                      {product.code || `PRD-${product.id.toString().padStart(6, '0')}`}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.categoryId ? "Catégorie définie" : "Non catégorisé"}
                    </TableCell>
                    <TableCell>
                      {product.salePrice ? `${product.salePrice} DA` : "Non défini"}
                    </TableCell>
                    <TableCell>
                      {product.managedInStock ? (
                        <span className="text-sm">
                          {product.currentStock || "0"} {product.unit || "unités"}
                        </span>
                      ) : (
                        <Badge variant="secondary">Non géré</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`menu-product-${product.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ChefHat className="mr-2 h-4 w-4" />
                            Gérer recette
                          </DropdownMenuItem>
                          <DeleteProductDialog productId={product.id} productName={product.name} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductForm({ product, onSuccess }: { product?: Article | null; onSuccess: () => void }) {
  console.log("🔥 PRODUCT FORM - Produit reçu:", product);
  
  const { toast } = useToast();
  const isEditing = !!product;
  
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: "product" as const,
      name: product?.name || "",
      description: product?.description || "",
      unit: product?.unit || "pièce",
      managedInStock: Boolean(product?.managedInStock ?? true),
      storageLocationId: product?.storageLocationId || undefined,
      categoryId: product?.categoryId || undefined,
      allowSale: Boolean(product?.allowSale ?? true),
      saleCategoryId: product?.saleCategoryId || undefined,
      saleUnit: product?.saleUnit || "pièce",
      salePrice: product?.salePrice ? product.salePrice.toString() : "",
      taxId: product?.taxId || undefined,
      costPerUnit: product?.costPerUnit ? product.costPerUnit.toString() : "",
      currentStock: product?.currentStock ? product.currentStock.toString() : "",
      minStock: product?.minStock ? product.minStock.toString() : "",
      maxStock: product?.maxStock ? product.maxStock.toString() : "",
      preparationTime: product?.preparationTime || undefined,
      difficulty: product?.difficulty || "easy",
      servings: product?.servings || undefined,
      active: Boolean(product?.active ?? true),
      photo: product?.photo || "",
    },
  });

  const { data: categories } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories"],
  });

  const { data: storageZones } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"],
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => {
      console.log("🔥 CREATE PRODUCT - Données envoyées:", data);
      return apiRequest("/api/articles", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Produit créé avec succès" });
      onSuccess();
    },
    onError: (error) => {
      console.error("❌ CREATE PRODUCT - Erreur:", error);
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductForm) => {
      console.log("🔥 UPDATE PRODUCT - Données envoyées:", data);
      return apiRequest(`/api/articles/${product!.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Produit modifié avec succès" });
      onSuccess();
    },
    onError: (error) => {
      console.error("❌ UPDATE PRODUCT - Erreur:", error);
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductForm) => {
    console.log("🔥 PRODUCT FORM - Soumission des données:", data);
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="stock">Stock & Gestion</TabsTrigger>
            <TabsTrigger value="vente">Vente & Prix</TabsTrigger>
            <TabsTrigger value="recipe">Recette</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Désignation *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom du produit" data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Description détaillée du produit" data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune catégorie</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="preparationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temps de préparation (min)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="30" 
                        data-testid="input-preparation-time" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulté</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "easy"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-difficulty">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Facile</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="hard">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de portions</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="8" 
                        data-testid="input-servings" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Produit actif</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le produit est disponible dans le système
                </p>
              </div>
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Gérer en stock</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Suivre les quantités en stock
                </p>
              </div>
              <FormField
                control={form.control}
                name="managedInStock"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        data-testid="switch-managed-in-stock"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de gestion</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Ex: pièce, kg, litre" data-testid="input-unit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storageLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone de stockage</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-storage-location">
                          <SelectValue placeholder="Sélectionner une zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune zone</SelectItem>
                        {storageZones?.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="currentStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock actuel</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-current-stock" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock minimum</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-min-stock" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock maximum</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-max-stock" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="costPerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix Moyen Pondéré (PMP)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-cost-per-unit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="vente" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Autoriser la vente</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le produit peut être vendu
                </p>
              </div>
              <FormField
                control={form.control}
                name="allowSale"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        data-testid="switch-allow-sale"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="saleUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de vente</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Ex: pièce, portion" data-testid="input-sale-unit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saleCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie de vente</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-sale-category">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune catégorie</SelectItem>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de vente (DA)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="0.00" data-testid="input-sale-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-tax">
                          <SelectValue placeholder="Sélectionner une TVA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune TVA</SelectItem>
                        <SelectItem value="1">TVA 19%</SelectItem>
                        <SelectItem value="2">TVA 9%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="URL de la photo" data-testid="input-photo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="recipe" className="space-y-4">
            {isEditing && product ? (
              <RecipeDisplay articleId={product.id} />
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <p>La gestion des recettes est disponible après la création du produit</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit"
          >
            {createMutation.isPending || updateMutation.isPending 
              ? "Enregistrement..." 
              : isEditing 
                ? "Modifier" 
                : "Créer"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}

function DeleteProductDialog({ productId, productName }: { productId: number; productName: string }) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => {
      console.log("🔥 DELETE PRODUCT - Suppression du produit ID:", productId);
      return apiRequest(`/api/articles/${productId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Produit supprimé avec succès" });
    },
    onError: (error) => {
      console.error("❌ DELETE PRODUCT - Erreur:", error);
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le produit "{productName}" ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}