import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Warehouse } from "lucide-react";
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
import type { StorageZone, InsertStorageZone, StorageLocation } from "@shared/schema";

const zoneFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  storageLocationId: z.number().min(1, "L'emplacement est requis"),
  capacity: z.number().min(0, "La capacité doit être positive"),
  currentStock: z.number().min(0, "Le stock doit être positif").default(0),
  active: z.boolean().default(true),
});

export default function StorageZonesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<StorageZone | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: zones, isLoading } = useQuery({
    queryKey: ["/api/storage-zones"],
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/storage-locations"],
  });

  const createZoneMutation = useMutation({
    mutationFn: (data: InsertStorageZone) => apiRequest("/api/storage-zones", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage-zones"] });
      setDialogOpen(false);
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

  const form = useForm<z.infer<typeof zoneFormSchema>>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      storageLocationId: 0,
      capacity: 0,
      currentStock: 0,
      active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof zoneFormSchema>) => {
    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data: values });
    } else {
      createZoneMutation.mutate(values);
    }
  };

  const handleEdit = (zone: StorageZone) => {
    setEditingZone(zone);
    form.reset({
      designation: zone.designation,
      description: zone.description || "",
      storageLocationId: zone.storageLocationId,
      capacity: zone.capacity,
      currentStock: zone.currentStock,
      active: zone.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette zone de stockage ?")) {
      deleteZoneMutation.mutate(id);
    }
  };

  const handleNewZone = () => {
    setEditingZone(null);
    form.reset({
      designation: "",
      description: "",
      storageLocationId: 0,
      capacity: 0,
      currentStock: 0,
      active: true,
    });
    setDialogOpen(true);
  };

  const getLocationName = (locationId: number) => {
    const location = locations?.find((loc: StorageLocation) => loc.id === locationId);
    return location?.name || "Emplacement inconnu";
  };

  const getCapacityColor = (current: number, capacity: number) => {
    const percentage = capacity > 0 ? (current / capacity) * 100 : 0;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-orange-600";
    return "text-green-600";
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
          Zones de Stockage
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleNewZone}
              className="h-12 px-6 text-lg"
              data-testid="button-add-zone"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Modifier la Zone" : "Nouvelle Zone"}
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
                          placeholder="Zone A1"
                          className="h-12 text-lg"
                          data-testid="input-zone-designation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emplacement</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg" data-testid="select-zone-location">
                            <SelectValue placeholder="Sélectionner un emplacement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations?.map((location: StorageLocation) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name}
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacité</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="100"
                          className="h-12 text-lg"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-zone-capacity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Actuel</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-12 text-lg"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-zone-stock"
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
                          placeholder="Description de la zone"
                          className="resize-none"
                          data-testid="input-zone-description"
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
                          data-testid="switch-zone-active"
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
                    data-testid="button-cancel-zone-form"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-lg"
                    disabled={createZoneMutation.isPending || updateZoneMutation.isPending}
                    data-testid="button-submit-zone-form"
                  >
                    {editingZone ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {zones?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucune zone de stockage configurée</p>
            <p className="text-sm mt-2">Cliquez sur "Nouvelle Zone" pour commencer</p>
          </div>
        ) : (
          zones?.map((zone: StorageZone) => (
            <div
              key={zone.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-zone-${zone.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Warehouse className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {zone.designation}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {zone.code}
                    </span>
                    {!zone.active && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Emplacement: {getLocationName(zone.storageLocationId)}
                  </p>
                  {zone.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {zone.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${getCapacityColor(zone.currentStock, zone.capacity)}`}>
                      Stock: {zone.currentStock} / {zone.capacity}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ 
                          width: zone.capacity > 0 ? `${Math.min((zone.currentStock / zone.capacity) * 100, 100)}%` : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(zone)}
                    className="h-10 w-10"
                    data-testid={`button-edit-zone-${zone.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(zone.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-zone-${zone.id}`}
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