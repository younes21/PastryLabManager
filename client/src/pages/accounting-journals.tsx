import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
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
import type { AccountingJournal, InsertAccountingJournal } from "@shared/schema";

const journalFormSchema = z.object({
  code: z.string().optional(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export default function AccountingJournalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<AccountingJournal | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journals, isLoading } = useQuery({
    queryKey: ["/api/accounting-journals"],
  });

  const createJournalMutation = useMutation({
    mutationFn: (data: InsertAccountingJournal) => apiRequest("/api/accounting-journals", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting-journals"] });
      setDialogOpen(false);
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

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      designation: "",
      description: "",
      active: true,
    },
  });

  const onSubmit = (values: z.infer<typeof journalFormSchema>) => {
    if (editingJournal) {
      updateJournalMutation.mutate({ id: editingJournal.id, data: values });
    } else {
      createJournalMutation.mutate(values);
    }
  };

  const handleEdit = (journal: AccountingJournal) => {
    setEditingJournal(journal);
    form.reset({
      designation: journal.designation,
      description: journal.description || "",
      active: journal.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce journal comptable ?")) {
      deleteJournalMutation.mutate(id);
    }
  };

  const handleNewJournal = () => {
    setEditingJournal(null);
    form.reset({
      designation: "",
      description: "",
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
          Journaux Comptables
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleNewJournal}
              className="h-12 px-6 text-lg"
              data-testid="button-add-journal"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Journal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingJournal ? "Modifier le Journal" : "Nouveau Journal"}
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
                          placeholder="Journal des Ventes"
                          className="h-12 text-lg"
                          data-testid="input-journal-designation"
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
                          placeholder="Description du journal comptable"
                          className="resize-none"
                          data-testid="input-journal-description"
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
                          data-testid="switch-journal-active"
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
                    data-testid="button-cancel-journal-form"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-lg"
                    disabled={createJournalMutation.isPending || updateJournalMutation.isPending}
                    data-testid="button-submit-journal-form"
                  >
                    {editingJournal ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {journals?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun journal comptable configuré</p>
            <p className="text-sm mt-2">Cliquez sur "Nouveau Journal" pour commencer</p>
          </div>
        ) : (
          journals?.map((journal: AccountingJournal) => (
            <div
              key={journal.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-journal-${journal.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {journal.designation}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {journal.code}
                    </span>
                    {!journal.active && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  {journal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {journal.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(journal)}
                    className="h-10 w-10"
                    data-testid={`button-edit-journal-${journal.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(journal.id)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-journal-${journal.id}`}
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