import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
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

const stationFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  type: z.enum(["four", "mixeur", "refrigerateur", "congelateur", "plan_travail", "autre"]),
  location: z.string().optional(),
  status: z.enum(["fonctionnel", "maintenance", "panne", "hors_service"]).default("fonctionnel"),
  active: z.boolean().default(true),
});

export default function WorkStationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<WorkStation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stations, isLoading } = useQuery({
    queryKey: ["/api/work-stations"],
  });

  const createStationMutation = useMutation({
    mutationFn: (data: InsertWorkStation) => apiRequest("/api/work-stations", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      setDialogOpen(false);
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

  const form = useForm<z.infer<typeof stationFormSchema>>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      type: "plan_travail",
      location: "",
      status: "fonctionnel",
      active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof stationFormSchema>) => {
    if (editingStation) {
      updateStationMutation.mutate({ id: editingStation.id, data: values });
    } else {
      createStationMutation.mutate(values);
    }
  };

  const handleEdit = (station: WorkStation) => {
    setEditingStation(station);
    form.reset({
      designation: station.designation,
      description: station.description || "",
      type: station.type as "four" | "mixeur" | "refrigerateur" | "congelateur" | "plan_travail" | "autre",
      location: station.location || "",
      status: station.status as "fonctionnel" | "maintenance" | "panne" | "hors_service",
      active: station.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce poste de travail ?")) {
      deleteStationMutation.mutate(id);
    }
  };

  const handleNewStation = () => {
    setEditingStation(null);
    form.reset({
      designation: "",
      description: "",
      type: "plan_travail",
      location: "",
      status: "fonctionnel",
      active: true,
    });
    setDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      four: "Four",
      mixeur: "Mixeur",
      refrigerateur: "Réfrigérateur",
      congelateur: "Congélateur",
      plan_travail: "Plan de Travail",
      autre: "Autre",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fonctionnel": return "bg-green-100 text-green-800";
      case "maintenance": return "bg-yellow-100 text-yellow-800";
      case "panne": return "bg-orange-100 text-orange-800";
      case "hors_service": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      fonctionnel: "Fonctionnel",
      maintenance: "Maintenance",
      panne: "En Panne",
      hors_service: "Hors Service",
    };
    return labels[status as keyof typeof labels] || status;
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
          Postes de Travail
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleNewStation}
              className="h-12 px-6 text-lg"
              data-testid="button-add-station"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Poste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStation ? "Modifier le Poste" : "Nouveau Poste"}
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
                          placeholder="Four Principal"
                          className="h-12 text-lg"
                          data-testid="input-station-designation"
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
                          <SelectTrigger className="h-12 text-lg" data-testid="select-station-type">
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="four">Four</SelectItem>
                          <SelectItem value="mixeur">Mixeur</SelectItem>
                          <SelectItem value="refrigerateur">Réfrigérateur</SelectItem>
                          <SelectItem value="congelateur">Congélateur</SelectItem>
                          <SelectItem value="plan_travail">Plan de Travail</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emplacement</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Zone Production A"
                          className="h-12 text-lg"
                          data-testid="input-station-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg" data-testid="select-station-status">
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fonctionnel">Fonctionnel</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="panne">En Panne</SelectItem>
                          <SelectItem value="hors_service">Hors Service</SelectItem>
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
                          placeholder="Description du poste de travail"
                          className="resize-none"
                          data-testid="input-station-description"
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
                          data-testid="switch-station-active"
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
                    data-testid="button-cancel-station-form"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-lg"
                    disabled={createStationMutation.isPending || updateStationMutation.isPending}
                    data-testid="button-submit-station-form"
                  >
                    {editingStation ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {stations?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun poste de travail configuré</p>
            <p className="text-sm mt-2">Cliquez sur "Nouveau Poste" pour commencer</p>
          </div>
        ) : (
          stations?.map((station: WorkStation) => (
            <div
              key={station.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-station-${station.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {station.designation}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {station.code}
                    </span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {getTypeLabel(station.type)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(station.status)}`}>
                      {getStatusLabel(station.status)}
                    </span>
                    {!station.active && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {station.location && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Emplacement: {station.location}
                      </p>
                    )}
                    {station.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {station.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(station)}
                    className="h-10 w-10"
                    data-testid={`button-edit-station-${station.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(station.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-station-${station.id}`}
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