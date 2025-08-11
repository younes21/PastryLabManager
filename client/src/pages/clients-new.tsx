import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Edit, Trash2, Plus, User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, type Client, type InsertClient, type PriceList, type User as UserType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";

const algerianWilayas = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arreridj", "35 - Boumerdès",
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane"
];

function ClientForm({ client, onSuccess }: { client?: Client; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEditing = !!client;
  
  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      type: client?.type || "particulier",
      companyType: client?.companyType || "",
      firstName: client?.firstName || "",
      lastName: client?.lastName || "",
      companyName: client?.companyName || "",
      phone: client?.phone || "",
      mobile: client?.mobile || "",
      email: client?.email || "",
      contactName: client?.contactName || "",
      address: client?.address || "",
      city: client?.city || "",
      postalCode: client?.postalCode || "",
      wilaya: client?.wilaya || "",
      rc: client?.rc || "",
      na: client?.na || "",
      mf: client?.mf || "",
      nis: client?.nis || "",
      active: client?.active ?? true,
      tarifParticulier: client?.tarifParticulier ?? true,
      priceListId: client?.priceListId || undefined,
      photo: client?.photo || "",
      userId: client?.userId || undefined,
    },
  });

  const watchType = form.watch("type");
  const watchTarifParticulier = form.watch("tarifParticulier");

  const { data: priceLists } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("/api/clients", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client créé avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest(`/api/clients/${client!.id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client modifié avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertClient) => {
    // Pour les sociétés, vider les champs nom/prénom non utilisés
    if (data.type === "societe") {
      data.firstName = "";
      data.lastName = "";
    } else {
      // Pour les particuliers, vider les champs société
      data.companyType = "";
      data.companyName = "";
    }
    
    // Si tarif particulier désactivé, vider l'offre tarifaire
    if (!data.tarifParticulier) {
      data.priceListId = undefined;
    }
    
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
            <TabsTrigger value="contact">Contact & Adresse</TabsTrigger>
            <TabsTrigger value="legal">Légal</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de client *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="particulier">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Particulier
                        </div>
                      </SelectItem>
                      <SelectItem value="societe">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Société
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === "societe" && (
              <FormField
                control={form.control}
                name="companyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'entreprise *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-company-type">
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eurl">EURL - Entreprise Unipersonnelle à Responsabilité Limitée</SelectItem>
                        <SelectItem value="sarl">SARL - Société à Responsabilité Limitée</SelectItem>
                        <SelectItem value="spa">SPA - Société Par Actions</SelectItem>
                        <SelectItem value="snc">SNC - Société en Nom Collectif</SelectItem>
                        <SelectItem value="scs">SCS - Société en Commandite Simple</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchType === "particulier" ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom du client" data-testid="input-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Prénom du client" data-testid="input-firstname" />
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
                    <FormLabel>Nom de l'entreprise *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de l'entreprise" data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="021XXXXXX" data-testid="input-phone" />
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
                      <Input {...field} value={field.value || ""} placeholder="0XXXXXXXXX" data-testid="input-mobile" />
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
                    <Input {...field} value={field.value || ""} type="email" placeholder="client@example.com" data-testid="input-email" />
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
                    <Input {...field} value={field.value || ""} placeholder="Personne à contacter" data-testid="input-contact-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Adresse complète" data-testid="input-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Ville" data-testid="input-city" />
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
                      <Input {...field} value={field.value || ""} placeholder="16000" data-testid="input-postal-code" />
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
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wilaya">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {algerianWilayas.map((wilaya) => (
                          <SelectItem key={wilaya} value={wilaya}>
                            {wilaya}
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

          <TabsContent value="legal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registre de Commerce (RC)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="XX/XX-XXXXXXX" data-testid="input-rc" />
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
                      <Input {...field} value={field.value || ""} placeholder="Numéro d'agrément" data-testid="input-na" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matricule Fiscale (MF)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="XXXXXXXXXXXX" data-testid="input-mf" />
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
                      <Input {...field} value={field.value || ""} placeholder="XXXXXXXXXXXX" data-testid="input-nis" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Client actif</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le client peut passer des commandes
                </p>
              </div>
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Tarif particulier</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Utiliser la tarification pour particuliers
                </p>
              </div>
              <FormField
                control={form.control}
                name="tarifParticulier"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-tarif-particulier"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {watchTarifParticulier && (
              <FormField
                control={form.control}
                name="priceListId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offre tarifaire *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-price-list">
                          <SelectValue placeholder="Sélectionner une offre tarifaire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune offre spécifique</SelectItem>
                        {priceLists?.map((priceList) => (
                          <SelectItem key={priceList.id} value={priceList.id.toString()}>
                            {priceList.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compte utilisateur lié</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-user">
                        <SelectValue placeholder="Lier à un compte utilisateur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucun compte lié</SelectItem>
                      {users?.filter(user => user.role === "client").map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username} ({user.firstName} {user.lastName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Enregistrement..."
              : isEditing
              ? "Modifier"
              : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const { toast } = useToast();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: priceLists } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/clients/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setViewMode("edit");
    setIsDialogOpen(true);
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setViewMode("view");
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    const displayName = client.type === "societe" 
      ? client.companyName || "Nom d'entreprise non défini"
      : `${client.lastName || ""} ${client.firstName || ""}`.trim() || "Nom non défini";
    if (confirm(`Êtes-vous sûr de vouloir supprimer le client ${displayName} ?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedClient(undefined);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion des Clients">
      <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Clients</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent-hover" onClick={() => setSelectedClient(undefined)} data-testid="button-add">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {viewMode === "view" 
                    ? `Détails du client` 
                    : selectedClient 
                      ? "Modifier le client" 
                      : "Nouveau client"
                  }
                </DialogTitle>
                <DialogDescription>
                  {viewMode === "view" 
                    ? "Consultation des informations détaillées du client" 
                    : selectedClient 
                      ? "Modification des informations du client existant" 
                      : "Création d'un nouveau client dans le système"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <ClientForm client={selectedClient} onSuccess={handleDialogClose} />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {clients && clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const displayName = client.type === "societe" 
                    ? client.companyName || "Nom d'entreprise non défini"
                    : `${client.lastName || ""} ${client.firstName || ""}`.trim() || "Nom non défini";
                  
                  const priceListName = client.priceListId 
                    ? priceLists?.find(pl => pl.id === client.priceListId)?.designation || "Offre inconnue"
                    : "-";
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {client.type === "particulier" ? (
                            <User className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Building className="w-4 h-4 text-green-500" />
                          )}
                          {displayName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.type === "particulier" ? "default" : "secondary"}>
                          {client.type === "particulier" ? "Particulier" : "Société"}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.phone || client.mobile || "-"}</TableCell>
                      <TableCell>{client.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={client.active ? "default" : "destructive"}>
                          {client.active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {priceListName}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(client)}
                            data-testid={`button-view-${client.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            data-testid={`button-edit-${client.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client)}
                            data-testid={`button-delete-${client.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client trouvé. Commencez par ajouter votre premier client.
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}