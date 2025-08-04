import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Calculator } from "lucide-react";
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

const accountFormSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  type: z.enum(["actif", "passif", "charge", "produit"]),
  active: z.boolean().default(true),
});

export default function AccountingAccountsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounting-accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: InsertAccountingAccount) => apiRequest("/api/accounting-accounts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-accounts"] });
      setDialogOpen(false);
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

  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: "",
      designation: "",
      description: "",
      type: "actif",
      active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof accountFormSchema>) => {
    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, data: values });
    } else {
      createAccountMutation.mutate(values);
    }
  };

  const handleEdit = (account: AccountingAccount) => {
    setEditingAccount(account);
    form.reset({
      code: account.code,
      designation: account.designation,
      description: account.description || "",
      type: account.type as "actif" | "passif" | "charge" | "produit",
      active: account.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce compte comptable ?")) {
      deleteAccountMutation.mutate(id);
    }
  };

  const handleNewAccount = () => {
    setEditingAccount(null);
    form.reset({
      code: "",
      designation: "",
      description: "",
      type: "actif",
      active: true,
    });
    setDialogOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "actif": return "bg-green-100 text-green-800";
      case "passif": return "bg-blue-100 text-blue-800";
      case "charge": return "bg-red-100 text-red-800";
      case "produit": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Comptes Comptables
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleNewAccount}
              className="h-12 px-6 text-lg"
              data-testid="button-add-account"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Compte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Modifier le Compte" : "Nouveau Compte"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="411000"
                          className="h-12 text-lg"
                          data-testid="input-account-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Désignation</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Clients"
                          className="h-12 text-lg"
                          data-testid="input-account-designation"
                        />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg" data-testid="select-account-type">
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="actif">Actif</SelectItem>
                          <SelectItem value="passif">Passif</SelectItem>
                          <SelectItem value="charge">Charge</SelectItem>
                          <SelectItem value="produit">Produit</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Textarea 
                          {...field} 
                          placeholder="Description du compte comptable"
                          className="resize-none"
                          data-testid="input-account-description"
                        />
                      </FormControl>
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
                        <FormLabel className="text-base">
                          Actif
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-account-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1 h-12 text-lg"
                    data-testid="button-cancel-account-form"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-lg"
                    disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                    data-testid="button-submit-account-form"
                  >
                    {editingAccount ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {accounts?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun compte comptable configuré</p>
            <p className="text-sm mt-2">Cliquez sur "Nouveau Compte" pour commencer</p>
          </div>
        ) : (
          accounts?.map((account: AccountingAccount) => (
            <div
              key={account.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-account-${account.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calculator className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {account.designation}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {account.code}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getTypeColor(account.type)}`}>
                      {account.type}
                    </span>
                    {!account.active && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  {account.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {account.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(account)}
                    className="h-10 w-10"
                    data-testid={`button-edit-account-${account.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-account-${account.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}