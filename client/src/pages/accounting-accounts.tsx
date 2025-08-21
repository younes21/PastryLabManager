import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AccountingAccount, InsertAccountingAccount } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

const accountFormSchema = z.object({
  designation: z.string().min(1, "La désignation est requise"),
  number: z.string().min(1, "Le code est requis"),
  description: z.string().optional(),
  type: z.string().min(1, "Le type est requis"),
  nature: z.string().min(1, "La nature est requise"),
  active: z.boolean().default(true),
});

const accountTypes = [
  { value: "actif", label: "Actif" },
  { value: "passif", label: "Passif" },
  { value: "charge", label: "Charge" },
  { value: "produit", label: "Produit" },
];

const accountNatures = [
  { value: "debit", label: "Débit" },
  { value: "credit", label: "Crédit" },
];

export default function AccountingAccountsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<AccountingAccount[]>({
    queryKey: ["/api/accounting-accounts"],
  });

  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      designation: "",
      number: "",
      description: "",
      type: "",
      nature: "",
      active: true,
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: InsertAccountingAccount) => apiRequest("/api/accounting-accounts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-accounts"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Succès",
        description: "Compte comptable créé avec succès",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertAccountingAccount> }) =>
      apiRequest(`/api/accounting-accounts/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-accounts"] });
      setDialogOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({
        title: "Succès",
        description: "Compte comptable modifié avec succès",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/accounting-accounts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-accounts"] });
      toast({
        title: "Succès",
        description: "Compte comptable supprimé avec succès",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof accountFormSchema>) => {
    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, data });
    } else {
      createAccountMutation.mutate(data);
    }
  };

  const openEditDialog = (account: AccountingAccount) => {
    setEditingAccount(account);
    form.reset({
      designation: account.designation,
      description: account.description || "",
      type: account.type,
      nature: account.nature,
      active: account.active !== false,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAccount(null);
    form.reset({
      designation: "",
      description: "",
      type: "",
      nature: "",
      active: true,
    });
    setDialogOpen(true);
  };

  usePageTitle('Gestion des Comptes Comptables');

  if (isLoading) {
    return (
      
        <div className="p-6">
          <div className="text-center">Chargement...</div>
        </div>
     
    );
  }


 return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Comptes Comptables
          </h1>
          <Button className="bg-accent hover:bg-accent-hover" onClick={openCreateDialog} data-testid="button-create-account">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Compte
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Modifier le compte" : "Nouveau compte comptable"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Désignation</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-designation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code comptable</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ex: 512001" data-testid="input-code" />
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
                        <Textarea {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accountTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="nature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nature</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-nature">
                            <SelectValue placeholder="Sélectionner une nature" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accountNatures.map((nature) => (
                            <SelectItem key={nature.value} value={nature.value}>
                              {nature.label}
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
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Actif</FormLabel>
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

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                    data-testid="button-submit"
                  >
                    {editingAccount ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(accounts) && accounts.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Aucun compte comptable trouvé
            </div>
          ) : (
            Array.isArray(accounts) && accounts.map((account: AccountingAccount) => (
              <div
                key={account.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                data-testid={`card-account-${account.id}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {account.designation}
                  </h3>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(account)}
                      data-testid={`button-edit-${account.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAccountMutation.mutate(account.id)}
                      data-testid={`button-delete-${account.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Code:</span> {account.number}
                  </p>
                  {account.description && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Description:</span> {account.description}
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Type:</span> {accountTypes.find(t => t.value === account.type)?.label || account.type}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Nature:</span> {accountNatures.find(n => n.value === account.nature)?.label || account.nature}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Statut:</span>{" "}
                    <span className={account.active !== false ? "text-green-600" : "text-red-600"}>
                      {account.active !== false ? "Actif" : "Inactif"}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    
  );
}