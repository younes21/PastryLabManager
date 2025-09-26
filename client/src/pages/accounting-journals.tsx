import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import type { AccountingJournal, InsertAccountingJournal } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

const journalFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  type: z.string().min(1, "Le type est requis"),
  active: z.boolean().default(true),
});

const journalTypes = [
  { value: "ventes", label: "Ventes" },
  { value: "achats", label: "Achats" },
  { value: "banque", label: "Banque" },
  { value: "caisse", label: "Caisse" },
  { value: "operations_diverses", label: "Opérations Diverses" },
];

export default function AccountingJournalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<AccountingJournal | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journals, isLoading } = useQuery({
    queryKey: ["/api/accounting-journals"],
  });

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      type: "",
      active: true,
    },
  });

  const createJournalMutation = useMutation({
    mutationFn: (data: InsertAccountingJournal) => apiRequest("/api/accounting-journals", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-journals"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Succès",
        description: "Journal comptable créé avec succès",
      });
    },
  });

  const updateJournalMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertAccountingJournal> }) =>
      apiRequest(`/api/accounting-journals/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-journals"] });
      setDialogOpen(false);
      setEditingJournal(null);
      form.reset();
      toast({
        title: "Succès",
        description: "Journal comptable modifié avec succès",
      });
    },
  });

  const deleteJournalMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/accounting-journals/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-journals"] });
      toast({
        title: "Succès",
        description: "Journal comptable supprimé avec succès",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof journalFormSchema>) => {
    if (editingJournal) {
      updateJournalMutation.mutate({ id: editingJournal.id, data });
    } else {
      createJournalMutation.mutate(data);
    }
  };

  const openEditDialog = (journal: AccountingJournal) => {
    setEditingJournal(journal);
    form.reset({
      designation: journal.designation,
      description: journal.description || "",
      type: journal.type,
      active: journal.active !== false,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingJournal(null);
    form.reset({
      designation: "",
      description: "",
      type: "",
      active: true,
    });
    setDialogOpen(true);
  };
  usePageTitle('Gestion des Journaux Comptables');
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
          Journaux Comptables
        </h1>
        <Button className="bg-accent hover:bg-accent-hover" onClick={openCreateDialog} data-testid="button-create-journal">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Journal
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingJournal ? "Modifier le journal" : "Nouveau journal comptable"}
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
                          {journalTypes.map((type) => (
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
                    disabled={createJournalMutation.isPending || updateJournalMutation.isPending}
                    data-testid="button-submit"
                  >
                    {editingJournal ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(journals) && journals.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Aucun journal comptable trouvé
          </div>
        ) : (
          Array.isArray(journals) && journals.map((journal: AccountingJournal) => (
            <div
              key={journal.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
              data-testid={`card-journal-${journal.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {journal.designation}
                </h3>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(journal)}
                    data-testid={`button-edit-${journal.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteJournalMutation.mutate(journal.id)}
                    data-testid={`button-delete-${journal.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Code:</span> {journal.code}
                </p>
                {journal.description && (
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Description:</span> {journal.description}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Type:</span> {journalTypes.find(t => t.value === journal.type)?.label || journal.type}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Statut:</span>{" "}
                  <span className={journal.active !== false ? "text-green-600" : "text-red-600"}>
                    {journal.active !== false ? "Actif" : "Inactif"}
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