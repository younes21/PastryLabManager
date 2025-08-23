import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Pencil, Trash2, Package, DollarSign, Search, Filter, MoreHorizontal, ChefHat, Clock, Shield, Warehouse } from "lucide-react";
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
  MeasurementUnit,
  type Recipe,
  InsertRecipe
} from "@shared/schema";
import { RecipeDisplay } from "@/components/recipe-display";
import { Layout } from "@/components/layout";
import { RecipeForm } from "@/components/recipe-form";
import { usePageTitle } from "@/hooks/usePageTitle";

// Schéma de validation pour les produits
const productSchema = insertArticleSchema.extend({
  type: z.literal("product"),
  minStock: z.string().optional(),
  maxStock: z.string().optional(),
  isPerishable: z.boolean().optional(),
  shelfLife: z.string().optional(),
  storageConditions: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function Products() {
  console.log("🔥 PRODUCTS PAGE - Début de rendu");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Article | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recipeDialogProduct, setRecipeDialogProduct] = useState<Article | null>(null);

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

  // Récupération des zones de stockage
  const { data: storageZones = [] } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"]
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
  usePageTitle('Gestion des produits'); 
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
  <>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          
          <p className="text-muted-foreground">Gérez vos produits finis et leurs recettes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-hover"  onClick={handleCreateProduct} data-testid="button-create-product">
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
                <TableHead>Photo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Conservation</TableHead>
                <TableHead>D.L.C</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Zone stockage</TableHead>
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
                filteredProducts.map((product) => {
                  // Récupérer les données des zones de stockage
                  const storageZone = storageZones?.find((zone: StorageZone) => zone.id === product.storageZoneId);
                  
                  return (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-medium">
                      {product.photo ?(<img
                         src={product.photo}
                         alt={product.name}
                         className="w-[7rem] h-[5rem] object-cover rounded-t-lg"
                       />) : (<Package className="w-16 h-16 text-orange-400" />)}
                     </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.isPerishable ? (
                        <Badge variant="destructive" className="bg-orange-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Périssable
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Shield className="w-3 h-3 mr-1" />
                          Non périssable
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.isPerishable && product.shelfLife ? (
                        <span className="text-sm font-medium">
                          {product.shelfLife} jours
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.isPerishable && product.storageConditions ? (
                        <span className="text-sm font-medium">
                          {product.storageConditions}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {product.salePrice || product.price ? `${product.salePrice || product.price} DA` : "Non défini"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {storageZone ? (
                        <Badge variant="outline">
                          <Warehouse className="w-3 h-3 mr-1" />
                          {storageZone.designation}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Non assignée</span>
                      )}
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
                          <DropdownMenuItem onClick={() => setRecipeDialogProduct(product)}>
                            <ChefHat className="mr-2 h-4 w-4" />
                            Gérer recette
                          </DropdownMenuItem>
                          <DeleteProductDialog productId={product.id} productName={product.name} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    {recipeDialogProduct && (
      <Dialog open={!!recipeDialogProduct} onOpenChange={() => setRecipeDialogProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gérer la recette pour {recipeDialogProduct.name}</DialogTitle>
          </DialogHeader>
          {/* On charge la recette existante pour ce produit */}
          <RecipeDialogRecipeLoader articleId={recipeDialogProduct.id} onCancel={() => setRecipeDialogProduct(null)} />
        </DialogContent>
      </Dialog>
    )}
    </>
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
      storageZoneId: product?.storageZoneId || undefined,
      categoryId: product?.categoryId || undefined,
      allowSale: Boolean(product?.allowSale ?? true),
      saleCategoryId: product?.saleCategoryId || undefined,
      saleUnit: product?.saleUnit || "pièce",
      salePrice: product?.salePrice ? product.salePrice.toString() : "",
      taxId: product?.taxId || undefined,
      minStock: product?.minStock ? product.minStock.toString() : "",
      maxStock: product?.maxStock ? product.maxStock.toString() : "",
      isPerishable: Boolean(product?.isPerishable ?? false),
      shelfLife: product?.shelfLife ? product.shelfLife.toString() : "0",
      storageConditions: product?.storageConditions || "",
      active: Boolean(product?.active ?? true),
      photo: product?.photo || "",
    },
  });

  const { data: categories } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories/produit"],
  });

  const { data: storageZones } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"],
  });

  const { data: measurementUnits } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units"],
  });

  const { data: taxes } = useQuery({
    queryKey: ["/api/taxes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => {
      console.log("🔥 CREATE PRODUCT - Données envoyées:", data);
      return apiRequest("/api/articles", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Produit créé avec succès",variant:'success' });
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
      toast({ title: "Produit modifié avec succès",variant:'success' });
      onSuccess();
    },
    onError: (error) => {
      console.error("❌ UPDATE PRODUCT - Erreur:", error);
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const onSubmit = (formData: ProductForm) => {
    console.log("🔥 PRODUCT FORM - Soumission des données:", formData);
    
    // Conversion des types pour l'API - en gardant les strings car le schéma les attend comme ça
    const transformedData = {
      ...formData,
      shelfLife: formData.shelfLife || undefined,
      salePrice: formData.salePrice || null,
      minStock: formData.minStock || "0.00",
      maxStock: formData.maxStock || "0.00",
    };
    
    console.log("🔥 PRODUCT FORM - Données transformées:", transformedData);
    
    if (isEditing) {
      updateMutation.mutate(transformedData);
    } else {
      createMutation.mutate(transformedData);
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
                    <FormLabel>Unité de mesure</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue placeholder="Sélectionner une unité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune unité</SelectItem>
                        {measurementUnits?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.abbreviation}>
                            {unit.label} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storageZoneId"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock minimum</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="1" placeholder="0.00" data-testid="input-min-stock" />
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
                      <Input {...field} type="number" step="1" placeholder="0.00" data-testid="input-max-stock" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section Conservation */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Conservation</h3>
              
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Produit périssable</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Le produit nécessite une gestion de conservation
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="isPerishable"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-perishable"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("isPerishable") && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shelfLife"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>D.L.C (jours)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="30" data-testid="input-shelf-life" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storageConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conditions de conservation</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="froid -18°" data-testid="input-storage-conditions" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
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
                    <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sale-unit">
                          <SelectValue placeholder="Sélectionner une unité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune unité</SelectItem>
                        {measurementUnits?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.label}>
                            {unit.label} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input {...field} value={field.value || ""} type="number" step="1" placeholder="0.00" data-testid="input-sale-price" />
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
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-tax">
                          <SelectValue placeholder="Sélectionner une TVA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                                    <SelectItem value="none">Aucune TVA</SelectItem>
                                    {(taxes as any[])?.map((tax: any) => (
                                      <SelectItem key={tax.id} value={tax.id.toString()}>
                                        {tax.designation} ({tax.rate}%)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

function RecipeDialogRecipeLoader({ articleId, onCancel }: { articleId: number; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: recipe, isLoading } = useQuery({
    queryKey: ["/api/articles", articleId, "recipe"],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${articleId}/recipe`);
      if (res.status === 404) return null;
      return res.json();
    }
  });

  // Fonction pour créer la recette
  const handleSubmit = async (data: InsertRecipe) => {
    try {
      const response = await apiRequest("/api/recipes", "POST", data);
      const responseData = await response.json();
      if (responseData && responseData.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
        toast({ title: "Recette créée avec succès" });
        onCancel();
        return responseData;
      }
    } catch (error) {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center">Chargement de la recette...</div>;
  return <RecipeForm articleId={articleId} recipe={recipe || undefined} onCancel={onCancel} onSubmit={handleSubmit} />;
}