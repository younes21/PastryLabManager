import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, Phone, Mail, MapPin, FileText, Building2, User as UserIcon } from "lucide-react";
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
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

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

  // Fetch price lists for tariff selection
  const { data: priceLists } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  // Fetch users for account linking
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
    mutationFn: (data: InsertClient) => apiRequest(`/api/clients/${client?.id}`, "PUT", data),
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
    
    // Si tarif particulier activé, vider l'offre tarifaire
    if (!data.tarifParticulier) {
      data.priceListId = undefined;
    }
    
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const wilayaOptions = [
    "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
    "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
    "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
    "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
    "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
    "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
    "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arréridj", "35 - Boumerdès",
    "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
    "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
    "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - El M'Ghair", "50 - El Meniaa",
    "51 - Ouled Djellal", "52 - Bordj Badji Mokhtar", "53 - Béni Abbès", "54 - Timimoun",
    "55 - Touggourt", "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="contact">Contact & Adresse</TabsTrigger>
            <TabsTrigger value="legal">Informations Légales</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de client *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client-type">
                          <SelectValue placeholder="Sélectionner le type" />
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
            </div>

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
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="021XXXXXX" data-testid="input-telephone" />
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
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Adresse complète" data-testid="textarea-adresse" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ville"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Ville" data-testid="input-ville" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codePostal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="16000" data-testid="input-code-postal" />
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
                          <SelectValue placeholder="Sélectionner une wilaya" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wilayaOptions.map((wilaya) => (
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
                    <FormLabel>RC (Registre de Commerce)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Numéro RC" data-testid="input-rc" />
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
                    <FormLabel>NA (Numéro d'Agrément)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Numéro NA" data-testid="input-na" />
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
                    <FormLabel>MF (Matricule Fiscal)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Matricule fiscal" data-testid="input-mf" />
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
                    <FormLabel>NIS (Numéro d'Identification Statistique)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Numéro NIS" data-testid="input-nis" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Client actif</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Le client peut passer des commandes et être facturé
                      </p>
                    </div>
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

            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="tarifParticulier"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tarif particulier</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Utiliser la tarification pour particuliers
                      </p>
                    </div>
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

            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="https://..." data-testid="input-photo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isPending} data-testid="button-submit">
            {isPending ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ClientDetails({ client }: { client: Client }) {
  const { data: priceLists } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const priceList = priceLists?.find(pl => pl.id === client.priceListId);
  const linkedUser = users?.find(u => u.id === client.userId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Code</p>
              <p className="font-mono text-sm">{client.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <Badge variant={client.type === "societe" ? "default" : "secondary"}>
                {client.type === "societe" ? "Société" : "Particulier"}
              </Badge>
            </div>
            {client.raisonSociale && (
              <div>
                <p className="text-sm font-medium text-gray-500">Raison sociale</p>
                <p>{client.raisonSociale}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Nom complet</p>
              <p className="font-medium">{client.nom} {client.prenom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Statut</p>
              <Badge variant={client.active ? "default" : "destructive"}>
                {client.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.telephone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{client.telephone}</span>
              </div>
            )}
            {client.mobile && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{client.mobile} (Mobile)</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{client.email}</span>
              </div>
            )}
            {client.contactName && (
              <div>
                <p className="text-sm font-medium text-gray-500">Contact</p>
                <p>{client.contactName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.adresse && (
              <div>
                <p className="text-sm font-medium text-gray-500">Adresse</p>
                <p>{client.adresse}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {client.ville && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Ville</p>
                  <p>{client.ville}</p>
                </div>
              )}
              {client.codePostal && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Code postal</p>
                  <p>{client.codePostal}</p>
                </div>
              )}
            </div>
            {client.wilaya && (
              <div>
                <p className="text-sm font-medium text-gray-500">Wilaya</p>
                <p>{client.wilaya}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informations légales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.rc && (
              <div>
                <p className="text-sm font-medium text-gray-500">RC</p>
                <p className="font-mono text-sm">{client.rc}</p>
              </div>
            )}
            {client.na && (
              <div>
                <p className="text-sm font-medium text-gray-500">NA</p>
                <p className="font-mono text-sm">{client.na}</p>
              </div>
            )}
            {client.mf && (
              <div>
                <p className="text-sm font-medium text-gray-500">MF</p>
                <p className="font-mono text-sm">{client.mf}</p>
              </div>
            )}
            {client.nis && (
              <div>
                <p className="text-sm font-medium text-gray-500">NIS</p>
                <p className="font-mono text-sm">{client.nis}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Tarification</p>
              <Badge variant={client.tarifParticulier ? "default" : "secondary"}>
                {client.tarifParticulier ? "Tarif particulier" : "Tarif professionnel"}
              </Badge>
            </div>
            {priceList && (
              <div>
                <p className="text-sm font-medium text-gray-500">Offre tarifaire</p>
                <p>{priceList.designation}</p>
              </div>
            )}
            {linkedUser && (
              <div>
                <p className="text-sm font-medium text-gray-500">Compte utilisateur</p>
                <p>{linkedUser.username} ({linkedUser.firstName} {linkedUser.lastName})</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.nom} ?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedClient(undefined);
  };
  usePageTitle('Gestion des Clients'); 
  if (isLoading) {
    return (
     
        <div className="p-6">Chargement...</div>
    
    );
  }

  return (
 
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos clients particuliers et professionnels
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-hover"  onClick={() => { setSelectedClient(undefined); setViewMode("edit"); }} data-testid="button-add-client">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewMode === "view" 
                  ? `Détails du client ${selectedClient?.nom}` 
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
            {viewMode === "view" && selectedClient ? (
              <ClientDetails client={selectedClient} />
            ) : (
              <ClientForm client={selectedClient} onSuccess={handleDialogClose} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients ({clients?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tarif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.nom} {client.prenom}</p>
                      <p className="text-sm text-gray-500">{client.code}</p>
                      {client.type === "societe" && client.raisonSociale && (
                        <p className="text-sm text-blue-600">{client.raisonSociale}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.active ? "default" : "destructive"}>
                      {client.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.telephone || client.mobile || "-"}</TableCell>
                  <TableCell>{client.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={client.tarifParticulier ? "secondary" : "default"}>
                      {client.tarifParticulier ? "Particulier" : "Professionnel"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(client)}
                        data-testid={`button-view-${client.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        data-testid={`button-edit-${client.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client)}
                        data-testid={`button-delete-${client.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!clients?.length && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client trouvé. Commencez par ajouter votre premier client.
            </div>
          )}
        </CardContent>
      </Card>
      </div>
   
  );
}