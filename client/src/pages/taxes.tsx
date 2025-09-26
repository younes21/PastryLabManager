import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tax, InsertTax } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

const taxFormSchema = z.object({
  designation: z.string().min(1, "La désignation est requise"),
  rate: z.string().min(1, "Le taux est requis"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export default function TaxesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: taxes = [], isLoading } = useQuery<Tax[]>({
    queryKey: ["/api/taxes"],
  });

  const createTaxMutation = useMutation({
    mutationFn: (data: InsertTax) => apiRequest("/api/taxes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxes"] });
      setDialogOpen(false);
      toast({
        title: "Succès",
        description: "Taxe créée avec succès",
      });
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTax> }) =>
      apiRequest(`/api/taxes/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxes"] });
      setDialogOpen(false);
      setEditingTax(null);
      toast({
        title: "Succès",
        description: "Taxe modifiée avec succès",
      });
    },
  });

  const deleteTaxMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/taxes/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxes"] });
      toast({
        title: "Succès",
        description: "Taxe supprimée avec succès",
      });
    },
  });

  const form = useForm<z.infer<typeof taxFormSchema>>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      designation: "",
      rate: 0,
      active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof taxFormSchema>) => {
    const taxData = {
      ...values,
      rate: parseFloat(values.rate).toString(), // Convert to decimal string
    };

    if (editingTax) {
      updateTaxMutation.mutate({ id: editingTax.id, data: taxData });
    } else {
      createTaxMutation.mutate(taxData);
    }
  };

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax);
    form.reset({
      designation: tax.designation,
      rate: tax.rate.toString(),
      description: tax.description || "",
      active: tax.active || true,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette taxe ?")) {
      deleteTaxMutation.mutate(id);
    }
  };

  const handleNewTax = () => {
    setEditingTax(null);
    form.reset({
      designation: "",
      rate: "0",
      description: "",
      active: true,
    });
    setDialogOpen(true);
  };
  usePageTitle('Gestion des Taxes');
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
          Gestion des Taxes
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleNewTax}
              className="bg-accent hover:bg-accent-hover"
              data-testid="button-add-tax"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Taxe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTax ? "Modifier la Taxe" : "Nouvelle Taxe"}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Désignation</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nom de la taxe"
                            className="h-12 text-lg"
                            data-testid="input-tax-designation"
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
                        <FormLabel>Taux (%)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            placeholder="19.5"
                            className="h-12 text-lg"
                            data-testid="input-tax-rate"
                          />
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
                        <FormLabel>Description (optionnel)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Description de la taxe..."
                            className="h-12 text-lg"
                            data-testid="input-tax-description"
                            {...field}
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
                            Active
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-tax-active"
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
                      data-testid="button-cancel-tax-form"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 text-lg"
                      disabled={createTaxMutation.isPending || updateTaxMutation.isPending}
                      data-testid="button-submit-tax-form"
                    >
                      {editingTax ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {taxes?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucune taxe configurée</p>
            <p className="text-sm mt-2">Cliquez sur "Nouvelle Taxe" pour commencer</p>
          </div>
        ) : (
          taxes?.map((tax: Tax) => (
            <div
              key={tax.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-tax-${tax.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {tax.designation}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {tax.code}
                    </span>
                    {!tax.active && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-1">
                    {parseFloat(tax.rate).toFixed(2)}%
                  </p>
                  {tax.description && (
                    <p className="text-sm text-gray-500 mt-1">{tax.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tax)}
                    className="h-10 w-10"
                    data-testid={`button-edit-tax-${tax.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tax.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-tax-${tax.id}`}
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