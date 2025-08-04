import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout";
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
import type { StorageZone, InsertStorageZone } from "@shared/schema";

const storageZoneFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  temperature: z.string().optional(),
  capacity: z.string().optional(),
  active: z.boolean().default(true),
});

export default function StorageZonesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<StorageZone | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: storageZones, isLoading } = useQuery({
    queryKey: ["/api/storage-zones"],
  });

  const form = useForm<z.infer<typeof storageZoneFormSchema>>({
    resolver: zodResolver(storageZoneFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      temperature: "",
      capacity: "",
      active: true,
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: (data: InsertStorageZone) => apiRequest("/api/storage-zones", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage-zones"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Succès",
        description: "Zone de stockage créée avec succès",
      });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertStorageZone> }) =>
      apiRequest(`/api/storage-zones/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage-zones"] });
      setDialogOpen(false);
      setEditingZone(null);
      form.reset();
      toast({
        title: "Succès",
        description: "Zone de stockage modifiée avec succès",
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/storage-zones/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage-zones"] });
      toast({
        title: "Succès",
        description: "Zone de stockage supprimée avec succès",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof storageZoneFormSchema>) => {
    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  const openEditDialog = (zone: StorageZone) => {
    setEditingZone(zone);
    form.reset({
      designation: zone.designation,
      description: zone.description || "",
      temperature: zone.temperature || "",
      capacity: zone.capacity || "",
      active: zone.active !== false,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingZone(null);
    form.reset({
      designation: "",
      description: "",
      temperature: "",
      capacity: "",
      active: true,
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Layout title="Gestion des Zones de Stockage">
        <div className="p-6">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion des Zones de Stockage">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Zones de Stockage
          </h1>
          <Button onClick={openCreateDialog} data-testid="button-create-zone">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Zone
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Modifier la zone" : "Nouvelle zone de stockage"}
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
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Température (°C)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 4°C" data-testid="input-temperature" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacité</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 100 kg" data-testid="input-capacity" />
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
                    disabled={createZoneMutation.isPending || updateZoneMutation.isPending}
                    data-testid="button-submit"
                  >
                    {editingZone ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(storageZones) && storageZones.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Aucune zone de stockage trouvée
            </div>
          ) : (
            Array.isArray(storageZones) && storageZones.map((zone: StorageZone) => (
              <div
                key={zone.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                data-testid={`card-zone-${zone.id}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {zone.designation}
                  </h3>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(zone)}
                      data-testid={`button-edit-${zone.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteZoneMutation.mutate(zone.id)}
                      data-testid={`button-delete-${zone.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Code:</span> {zone.code}
                  </p>
                  {zone.description && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Description:</span> {zone.description}
                    </p>
                  )}
                  {zone.temperature && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Température:</span> {zone.temperature}
                    </p>
                  )}
                  {zone.capacity && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Capacité:</span> {zone.capacity}
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Statut:</span>{" "}
                    <span className={zone.active !== false ? "text-green-600" : "text-red-600"}>
                      {zone.active !== false ? "Actif" : "Inactif"}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}