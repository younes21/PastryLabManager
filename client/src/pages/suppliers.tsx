import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Building2, User, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSupplierSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types pour les fournisseurs
type Supplier = {
  id: number;
  code: string;
  type: "particulier" | "societe";
  companyType?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  contactName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  commercialRegister?: string;
  photo?: string;
  active: boolean;
  createdAt: string;
};

const companyTypes = ["EURL", "SARL", "SPA", "SNC", "SCS", "Entreprise individuelle", "Autre"];

// Validation avec schéma étendu
const supplierFormSchema = insertSupplierSchema.extend({
  type: z.enum(["particulier", "societe"], { required_error: "Le type est requis" }),
  companyType: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  contactName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  commercialRegister: z.string().optional(),
  photo: z.string().optional(),
  active: z.boolean().default(true),
}).refine((data) => {
  if (data.type === "particulier") {
    return data.firstName && data.lastName;
  } else {
    return data.companyName;
  }
}, {
  message: "Pour un particulier, nom et prénom sont requis. Pour une société, la raison sociale est requise.",
  path: ["companyName"],
});

// Composant formulaire stable - défini en dehors du composant principal
const StableSupplierForm = memo(({ form, activeTab, setActiveTab, onSubmit, onCancel, submitting }: {
  form: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting: boolean;
}) => {
  // État local stable pour le type de fournisseur
  const [supplierType, setSupplierType] = useState<"particulier" | "societe">(() => {
    const currentType = form.getValues("type");
    return currentType || "societe";
  });

  const handleTypeChange = useCallback((value: "particulier" | "societe") => {
    setSupplierType(value);
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="address">Adresse</TabsTrigger>
            <TabsTrigger value="legal">Légal</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={(value: "particulier" | "societe") => {
                      field.onChange(value);
                      handleTypeChange(value);
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-supplier-type">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="particulier">Particulier</SelectItem>
                        <SelectItem value="societe">Société</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {supplierType === "societe" && (
                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de société</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-type">
                            <SelectValue placeholder="Type de société" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companyTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {supplierType === "particulier" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Prénom" data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom de famille" data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison sociale *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de l'entreprise" data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Fournisseur actif</FormLabel>
                    <FormDescription>
                      Ce fournisseur peut passer des commandes
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="021 XX XX XX" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0661 XX XX XX" data-testid="input-mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="email@exemple.com" data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du contact</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Personne de contact" data-testid="input-contact-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="address" className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Adresse complète" data-testid="textarea-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ville" data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Code postal" data-testid="input-postal-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Pays" data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro fiscal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NIF" data-testid="input-tax-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commercialRegister"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registre de commerce</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="RC" data-testid="input-commercial-register" />
                    </FormControl>
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
                  <FormLabel>Photo/Logo (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://exemple.com/photo.jpg" data-testid="input-photo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting} data-testid="button-submit-supplier">
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
});

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulaire stable avec valeurs par défaut
  const form = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      type: "societe",
      active: true,
      firstName: "",
      lastName: "",
      companyName: "",
      companyType: "",
      phone: "",
      mobile: "",
      email: "",
      contactName: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      taxId: "",
      commercialRegister: "",
      photo: "",
    },
  });

  // Requête pour les fournisseurs
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supplierFormSchema>) => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur lors de la création");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateDialogOpen(false);
      form.reset({
        type: "societe",
        active: true,
        firstName: "",
        lastName: "",
        companyName: "",
        companyType: "",
        phone: "",
        mobile: "",
        email: "",
        contactName: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        taxId: "",
        commercialRegister: "",
        photo: "",
      });
      setActiveTab("general");
      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof supplierFormSchema> }) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur lors de la mise à jour");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsEditDialogOpen(false);
      form.reset({
        type: "societe",
        active: true,
        firstName: "",
        lastName: "",
        companyName: "",
        companyType: "",
        phone: "",
        mobile: "",
        email: "",
        contactName: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        taxId: "",
        commercialRegister: "",
        photo: "",
      });
      setActiveTab("general");
      toast({
        title: "Succès",
        description: "Fournisseur mis à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur lors de la suppression");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Succès",
        description: "Fournisseur supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
  });

  // Handlers stables
  const handleCreate = useCallback((data: z.infer<typeof supplierFormSchema>) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleEdit = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    form.reset({
      type: supplier.type,
      companyType: supplier.companyType || undefined,
      firstName: supplier.firstName || undefined,
      lastName: supplier.lastName || undefined,
      companyName: supplier.companyName || undefined,
      phone: supplier.phone || undefined,
      mobile: supplier.mobile || undefined,
      email: supplier.email || undefined,
      contactName: supplier.contactName || undefined,
      address: supplier.address || undefined,
      city: supplier.city || undefined,
      postalCode: supplier.postalCode || undefined,
      country: supplier.country || undefined,
      taxId: supplier.taxId || undefined,
      commercialRegister: supplier.commercialRegister || undefined,
      photo: supplier.photo || undefined,
      active: supplier.active,
    });
    setActiveTab("general");
    setIsEditDialogOpen(true);
  }, [form]);

  const handleUpdate = useCallback((data: z.infer<typeof supplierFormSchema>) => {
    if (selectedSupplier) {
      updateMutation.mutate({ id: selectedSupplier.id, data });
    }
  }, [selectedSupplier, updateMutation]);

  const handleDelete = useCallback((id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleCancel = useCallback(() => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setActiveTab("general");
    form.reset({
      type: "societe",
      active: true,
      firstName: "",
      lastName: "",
      companyName: "",
      companyType: "",
      phone: "",
      mobile: "",
      email: "",
      contactName: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      taxId: "",
      commercialRegister: "",
      photo: "",
    });
  }, [form]);

  const getSupplierDisplayName = (supplier: Supplier) => {
    if (supplier.type === "particulier") {
      return `${supplier.firstName || ""} ${supplier.lastName || ""}`.trim();
    }
    return supplier.companyName || "Sans nom";
  };

  // Filtrage des fournisseurs
  const filteredSuppliers = (suppliers as Supplier[]).filter((supplier: Supplier) => {
    const matchesSearch = searchTerm === "" || 
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSupplierDisplayName(supplier).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "all" || supplier.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <Layout title="Gestion des Fournisseurs">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Fournisseurs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérez vos fournisseurs, leurs informations et leurs coordonnées
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (open) {
              setActiveTab("general");
              form.reset({
                type: "societe",
                active: true,
                firstName: "",
                lastName: "",
                companyName: "",
                companyType: "",
                phone: "",
                mobile: "",
                email: "",
                contactName: "",
                address: "",
                city: "",
                postalCode: "",
                country: "",
                taxId: "",
                commercialRegister: "",
                photo: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-supplier">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Fournisseur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau Fournisseur</DialogTitle>
                <DialogDescription>
                  Créez un nouveau fournisseur avec toutes ses informations
                </DialogDescription>
              </DialogHeader>
              <StableSupplierForm 
                form={form}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSubmit={handleCreate}
                onCancel={handleCancel}
                submitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par code, nom, raison sociale, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-suppliers"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="particulier">Particuliers</SelectItem>
                  <SelectItem value="societe">Sociétés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des fournisseurs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">Chargement des fournisseurs...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">Aucun fournisseur trouvé</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {supplier.type === "particulier" ? (
                        <User className="h-8 w-8 text-blue-600" />
                      ) : (
                        <Building2 className="h-8 w-8 text-green-600" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{getSupplierDisplayName(supplier)}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="outline">{supplier.code}</Badge>
                          <Badge variant={supplier.active ? "default" : "secondary"}>
                            {supplier.active ? "Actif" : "Inactif"}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {(supplier.phone || supplier.mobile) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{supplier.mobile || supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                      data-testid={`button-edit-supplier-${supplier.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-supplier-${supplier.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de modification */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le Fournisseur</DialogTitle>
              <DialogDescription>
                Modifiez les informations du fournisseur
              </DialogDescription>
            </DialogHeader>
            <StableSupplierForm 
              form={form}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              submitting={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}