import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Building2, User, Phone, Mail, MapPin, FileText, Camera } from "lucide-react";
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
  wilaya?: string;
  rc?: string;
  na?: string;
  mf?: string;
  nis?: string;
  photo?: string;
  active: boolean;
  createdAt: string;
};

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
  wilaya: z.string().optional(),
  rc: z.string().optional(),
  na: z.string().optional(),
  mf: z.string().optional(),
  nis: z.string().optional(),
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

// Options pour les wilayas algériennes (principales)
const wilayaOptions = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
  "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
  "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane"
];

const companyTypes = ["EURL", "SARL", "SPA", "SNC", "SCS", "Entreprise individuelle", "Autre"];

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      type: "societe",
      active: true,
    },
  });

  // Récupération des fournisseurs
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof supplierFormSchema>) => 
      apiRequest("/api/suppliers", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Fournisseur créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof supplierFormSchema>> }) =>
      apiRequest(`/api/suppliers/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      form.reset();
      toast({ title: "Fournisseur modifié avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/suppliers/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Fournisseur supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  // Filtrage des fournisseurs
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "all" || supplier.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleCreate = (data: z.infer<typeof supplierFormSchema>) => {
    createMutation.mutate(data);
  };

  const handleEdit = (supplier: Supplier) => {
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
      wilaya: supplier.wilaya || undefined,
      rc: supplier.rc || undefined,
      na: supplier.na || undefined,
      mf: supplier.mf || undefined,
      nis: supplier.nis || undefined,
      photo: supplier.photo || undefined,
      active: supplier.active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: z.infer<typeof supplierFormSchema>) => {
    if (selectedSupplier) {
      updateMutation.mutate({ id: selectedSupplier.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      deleteMutation.mutate(id);
    }
  };

  const getSupplierDisplayName = (supplier: Supplier) => {
    if (supplier.type === "particulier") {
      return `${supplier.firstName || ""} ${supplier.lastName || ""}`.trim();
    }
    return supplier.companyName || "Sans nom";
  };

  const SupplierForm = ({ onSubmit, isLoading: submitting }: { 
    onSubmit: (data: z.infer<typeof supplierFormSchema>) => void;
    isLoading: boolean;
  }) => {
    const [activeTab, setActiveTab] = useState("general");
    
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

              {form.watch("type") === "societe" && (
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

            {form.watch("type") === "particulier" ? (
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
                      Les fournisseurs inactifs n'apparaissent pas dans les listes de sélection
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      data-testid="checkbox-active"
                    />
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
                      <Input {...field} placeholder="16000" data-testid="input-postal-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wilaya"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wilaya</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wilaya">
                          <SelectValue placeholder="Sélectionnez une wilaya" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wilayaOptions.map((wilaya) => (
                          <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                name="rc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registre de Commerce (RC)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="RC XXXXXXX" data-testid="input-rc" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="na"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro d'Agrément (NA)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NA XXXXXXX" data-testid="input-na" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matricule Fiscale (MF)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MF XXXXXXX" data-testid="input-mf" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro d'Identification Statistique (NIS)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NIS XXXXXXX" data-testid="input-nis" />
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
          <Button type="button" variant="outline" onClick={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            form.reset();
          }}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting} data-testid="button-submit-supplier">
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              <SupplierForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun fournisseur trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterType !== "all" 
                  ? "Modifiez vos critères de recherche ou créez un nouveau fournisseur."
                  : "Commencez par créer votre premier fournisseur."
                }
              </p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow" data-testid={`card-supplier-${supplier.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {supplier.type === "societe" ? (
                        <Building2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-green-600" />
                      )}
                      <Badge variant={supplier.active ? "default" : "secondary"}>
                        {supplier.code}
                      </Badge>
                    </div>
                    <Badge variant={supplier.active ? "default" : "destructive"}>
                      {supplier.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {getSupplierDisplayName(supplier)}
                  </CardTitle>
                  {supplier.companyType && (
                    <CardDescription>{supplier.companyType}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.contactName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      {supplier.contactName}
                    </div>
                  )}
                  
                  {(supplier.phone || supplier.mobile) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      {supplier.phone || supplier.mobile}
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      {supplier.email}
                    </div>
                  )}
                  
                  {(supplier.city || supplier.wilaya) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      {[supplier.city, supplier.wilaya].filter(Boolean).join(", ")}
                    </div>
                  )}

                  {(supplier.rc || supplier.mf) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="h-4 w-4" />
                      {supplier.rc || supplier.mf}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
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
            <SupplierForm onSubmit={handleUpdate} isLoading={updateMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}