import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Currency, InsertCurrency } from "@shared/schema";

const currencyFormSchema = z.object({
  code: z.string().min(3, "Le code doit contenir au moins 3 caractères").max(3, "Le code doit contenir exactement 3 caractères"),
  designation: z.string().min(1, "La désignation est requise"),
  symbol: z.string().min(1, "Le symbole est requis"),
  rate: z.number().min(0.001, "Le taux doit être supérieur à 0"),
  isBase: z.boolean().default(false),
  active: z.boolean().default(true),
});

export default function CurrenciesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currencies, isLoading } = useQuery({
    queryKey: ["/api/currencies"],
  });

  const createCurrencyMutation = useMutation({
    mutationFn: (data: InsertCurrency) => apiRequest("/api/currencies", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setDialogOpen(false);
      toast({
        title: "Succès",
        description: "Devise créée avec succès",
      });
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertCurrency> }) =>
      apiRequest(`/api/currencies/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setDialogOpen(false);
      setEditingCurrency(null);
      toast({
        title: "Succès",
        description: "Devise modifiée avec succès",
      });
    },
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/currencies/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Succès",
        description: "Devise supprimée avec succès",
      });
    },
  });

  const form = useForm<z.infer<typeof currencyFormSchema>>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: {
      code: "",
      designation: "",
      symbol: "",
      rate: 1,
      isBase: false,
      active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof currencyFormSchema>) => {
    if (editingCurrency) {
      updateCurrencyMutation.mutate({ id: editingCurrency.id, data: values });
    } else {
      createCurrencyMutation.mutate(values);
    }
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    form.reset({
      code: currency.code,
      designation: currency.designation,
      symbol: currency.symbol,
      rate: currency.rate,
      isBase: currency.isBase,
      active: currency.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette devise ?")) {
      deleteCurrencyMutation.mutate(id);
    }
  };

  const handleNewCurrency = () => {
    setEditingCurrency(null);
    form.reset({
      code: "",
      designation: "",
      symbol: "",
      rate: 1,
      isBase: false,
      active: true,
    });
    setDialogOpen(true);
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
          Gestion des Devises
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleNewCurrency}
              className="h-12 px-6 text-lg"
              data-testid="button-add-currency"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Devise
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCurrency ? "Modifier la Devise" : "Nouvelle Devise"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code (ISO)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="EUR"
                          maxLength={3}
                          className="h-12 text-lg uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          data-testid="input-currency-code"
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
                          placeholder="Euro"
                          className="h-12 text-lg"
                          data-testid="input-currency-designation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbole</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="€"
                          className="h-12 text-lg"
                          data-testid="input-currency-symbol"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de Change</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          placeholder="1.0000"
                          className="h-12 text-lg"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          data-testid="input-currency-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isBase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Devise de Base
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-currency-base"
                        />
                      </FormControl>
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
                          Active
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-currency-active"
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
                    data-testid="button-cancel-currency-form"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-lg"
                    disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}
                    data-testid="button-submit-currency-form"
                  >
                    {editingCurrency ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {currencies?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucune devise configurée</p>
            <p className="text-sm mt-2">Cliquez sur "Nouvelle Devise" pour commencer</p>
          </div>
        ) : (
          currencies?.map((currency: Currency) => (
            <div
              key={currency.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-currency-${currency.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currency.designation} ({currency.code})
                    </h3>
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {currency.symbol}
                    </span>
                    {currency.isBase && (
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    )}
                    {!currency.active && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Taux: {currency.rate.toFixed(4)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(currency)}
                    className="h-10 w-10"
                    data-testid={`button-edit-currency-${currency.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(currency.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-currency-${currency.id}`}
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