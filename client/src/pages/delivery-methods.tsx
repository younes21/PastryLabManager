import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryMethod, InsertDeliveryMethod } from "@shared/schema";

const deliveryMethodFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  cost: z.number().min(0, "Le coût doit être positif"),
  duration: z.string().optional(),
  active: z.boolean().default(true),
});

export default function DeliveryMethodsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: methods, isLoading } = useQuery({
    queryKey: ["/api/delivery-methods"],
  });

  const createMethodMutation = useMutation({
    mutationFn: (data: InsertDeliveryMethod) => apiRequest("/api/delivery-methods", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-methods"] });
      setDialogOpen(false);
      toast({
        title: "Succès",
        description: "Méthode de livraison créée avec succès",
      });
    },
  });

  const updateMethodMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertDeliveryMethod> }) =>
      apiRequest(`/api/delivery-methods/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-methods"] });
      setDialogOpen(false);
      setEditingMethod(null);
      toast({
        title: "Succès",
        description: "Méthode de livraison modifiée avec succès",
      });
    },
  });

  const deleteMethodMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/delivery-methods/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-methods"] });
      toast({
        title: "Succès",
        description: "Méthode de livraison supprimée avec succès",
      });
    },
  });

  const form = useForm<z.infer<typeof deliveryMethodFormSchema>>({
    resolver: zodResolver(deliveryMethodFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      cost: 0,
      duration: "",
      active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof deliveryMethodFormSchema>) => {
    if (editingMethod) {
      updateMethodMutation.mutate({ id: editingMethod.id, data: values });
    } else {
      createMethodMutation.mutate(values);
    }
  };

  const handleEdit = (method: DeliveryMethod) => {
    setEditingMethod(method);
    form.reset({
      designation: method.designation,
      description: method.description || "",
      cost: method.cost,
      duration: method.duration || "",
      active: method.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette méthode de livraison ?")) {
      deleteMethodMutation.mutate(id);
    }
  };

  const handleNewMethod = () => {
    setEditingMethod(null);
    form.reset({
      designation: "",
      description: "",
      cost: 0,
      duration: "",
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
          Méthodes de Livraison
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleNewMethod}
              className="h-12 px-6 text-lg"
              data-testid="button-add-delivery-method"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Méthode
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? "Modifier la Méthode" : "Nouvelle Méthode"}
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
                        <Input 
                          {...field} 
                          placeholder="Express 24h"
                          className="h-12 text-lg"
                          data-testid="input-method-designation"
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Description détaillée de la méthode de livraison"
                          className="resize-none"
                          data-testid="input-method-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coût (DA)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="h-12 text-lg"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-method-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="24h, 2-3 jours"
                          className="h-12 text-lg"
                          data-testid="input-method-duration"
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
                          data-testid="switch-method-active"
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
                    data-testid="button-cancel-method-form"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-lg"
                    disabled={createMethodMutation.isPending || updateMethodMutation.isPending}
                    data-testid="button-submit-method-form"
                  >
                    {editingMethod ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {methods?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucune méthode de livraison configurée</p>
            <p className="text-sm mt-2">Cliquez sur "Nouvelle Méthode" pour commencer</p>
          </div>
        ) : (
          methods?.map((method: DeliveryMethod) => (
            <div
              key={method.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-method-${method.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {method.designation}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {method.code}
                    </span>
                    {!method.active && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {method.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {method.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-green-600">
                      {method.cost.toFixed(2)} DA
                    </span>
                    {method.duration && (
                      <span className="text-gray-500">
                        Durée: {method.duration}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(method)}
                    className="h-10 w-10"
                    data-testid={`button-edit-method-${method.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-method-${method.id}`}
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