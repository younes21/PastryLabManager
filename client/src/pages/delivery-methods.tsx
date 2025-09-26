import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { usePageTitle } from "@/hooks/usePageTitle";

const deliveryMethodFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  price: z.string().min(0, "Le coût doit être positif"),
  estimatedDuration: z.string().optional(),
  active: z.boolean().default(true),
});

export default function DeliveryMethodsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveryMethods, isLoading } = useQuery({
    queryKey: ["/api/delivery-methods"],
  });

  const form = useForm<z.infer<typeof deliveryMethodFormSchema>>({
    resolver: zodResolver(deliveryMethodFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      price: "0",
      estimatedDuration: "",
      active: true,
    },
  });

  const createMethodMutation = useMutation({
    mutationFn: (data: InsertDeliveryMethod) => apiRequest("/api/delivery-methods", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-methods"] });
      setDialogOpen(false);
      form.reset();
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
      form.reset();
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

  const onSubmit = (data: z.infer<typeof deliveryMethodFormSchema>) => {
    const formattedData = {
      ...data,
      price: data.price,
    };

    if (editingMethod) {
      updateMethodMutation.mutate({ id: editingMethod.id, data: formattedData });
    } else {
      createMethodMutation.mutate(formattedData);
    }
  };

  const openEditDialog = (method: DeliveryMethod) => {
    setEditingMethod(method);
    form.reset({
      designation: method.designation,
      description: method.description || "",
      price: method.price || "0",
      active: method.active !== false,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingMethod(null);
    form.reset({
      designation: "",
      description: "",
      price: "0",
      estimatedDuration: "",
      active: true,
    });
    setDialogOpen(true);
  };
  usePageTitle('Gestion des Méthodes de Livraison');
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
          Méthodes de Livraison
        </h1>
        <Button className="bg-accent hover:bg-accent-hover" onClick={openCreateDialog} data-testid="button-create-delivery-method">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Méthode
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Modifier la méthode" : "Nouvelle méthode de livraison"}
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
                        <Input {...field} data-testid="input-designation" />
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coût (DA)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" data-testid="input-price" />
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
                    disabled={createMethodMutation.isPending || updateMethodMutation.isPending}
                    data-testid="button-submit"
                  >
                    {editingMethod ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(deliveryMethods) && deliveryMethods.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Aucune méthode de livraison trouvée
          </div>
        ) : (
          Array.isArray(deliveryMethods) && deliveryMethods.map((method: DeliveryMethod) => (
            <div
              key={method.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
              data-testid={`card-delivery-method-${method.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {method.designation}
                </h3>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(method)}
                    data-testid={`button-edit-${method.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMethodMutation.mutate(method.id)}
                    data-testid={`button-delete-${method.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Code:</span> {method.code}
                </p>
                {method.description && (
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Description:</span> {method.description}
                  </p>
                )}
                {method.price && (
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Coût:</span> {method.price} DA
                  </p>
                )}

                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Statut:</span>{" "}
                  <span className={method.active !== false ? "text-green-600" : "text-red-600"}>
                    {method.active !== false ? "Actif" : "Inactif"}
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