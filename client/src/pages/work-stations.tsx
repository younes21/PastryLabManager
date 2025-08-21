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
import type { WorkStation, InsertWorkStation } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

const workStationFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  type: z.string().min(1, "Le type est requis"),
  capacity: z.string().optional(),
  active: z.boolean().default(true),
});

const stationTypes = [
  { value: "four", label: "Four" },
  { value: "mixeur", label: "Mixeur" },
  { value: "batteur", label: "Batteur" },
  { value: "frigo", label: "Réfrigérateur" },
  { value: "congelateur", label: "Congélateur" },
  { value: "plan_de_travail", label: "Plan de Travail" },
  { value: "balance", label: "Balance" },
  { value: "autre", label: "Autre" },
];

export default function WorkStationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<WorkStation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workStations, isLoading } = useQuery({
    queryKey: ["/api/work-stations"],
  });

  const form = useForm<z.infer<typeof workStationFormSchema>>({
    resolver: zodResolver(workStationFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      type: "",
      capacity: "",
      active: true,
    },
  });

  const createStationMutation = useMutation({
    mutationFn: (data: InsertWorkStation) => apiRequest("/api/work-stations", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Succès",
        description: "Poste de travail créé avec succès",
      });
    },
  });

  const updateStationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertWorkStation> }) =>
      apiRequest(`/api/work-stations/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      setDialogOpen(false);
      setEditingStation(null);
      form.reset();
      toast({
        title: "Succès",
        description: "Poste de travail modifié avec succès",
      });
    },
  });

  const deleteStationMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/work-stations/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      toast({
        title: "Succès",
        description: "Poste de travail supprimé avec succès",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof workStationFormSchema>) => {
    if (editingStation) {
      updateStationMutation.mutate({ id: editingStation.id, data });
    } else {
      createStationMutation.mutate(data);
    }
  };

  const openEditDialog = (station: WorkStation) => {
    setEditingStation(station);
    form.reset({
      designation: station.designation,
      description: station.description || "",
      type: station.type,
      capacity: station.capacity || "",
      active: station.active !== false,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStation(null);
    form.reset({
      designation: "",
      description: "",
      type: "",
      capacity: "",
      active: true,
    });
    setDialogOpen(true);
  };

  usePageTitle('Gestion des Postes de Travail');

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
            Postes de Travail
          </h1>
          <Button className="bg-accent hover:bg-accent-hover"  onClick={openCreateDialog} data-testid="button-create-station">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Poste
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStation ? "Modifier le poste" : "Nouveau poste de travail"}
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
                          {stationTypes.map((type) => (
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacité</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 20L, 50kg..." data-testid="input-capacity" />
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
                    disabled={createStationMutation.isPending || updateStationMutation.isPending}
                    data-testid="button-submit"
                  >
                    {editingStation ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(workStations) && workStations.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Aucun poste de travail trouvé
            </div>
          ) : (
            Array.isArray(workStations) && workStations.map((station: WorkStation) => (
              <div
                key={station.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                data-testid={`card-station-${station.id}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {station.designation}
                  </h3>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(station)}
                      data-testid={`button-edit-${station.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteStationMutation.mutate(station.id)}
                      data-testid={`button-delete-${station.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Code:</span> {station.code}
                  </p>
                  {station.description && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Description:</span> {station.description}
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Type:</span> {stationTypes.find(t => t.value === station.type)?.label || station.type}
                  </p>
                  {station.capacity && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Capacité:</span> {station.capacity}
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Statut:</span>{" "}
                    <span className={station.active !== false ? "text-green-600" : "text-red-600"}>
                      {station.active !== false ? "Actif" : "Inactif"}
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