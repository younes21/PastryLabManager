import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Recipe } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const recipeSchema = z.object({
  articleId: z.number(),
  designation: z.string().min(1, "Le nom de la recette est requis"),
  description: z.string().optional(),
  quantity: z.string().min(1, "La quantité est requise"),
  unit: z.string().min(1, "L'unité est requise"),
  isSubRecipe: z.boolean().default(false),
});

type RecipeForm = z.infer<typeof recipeSchema>;

export function RecipeDisplay({ articleId }: { articleId: number }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: recipe, isLoading, error } = useQuery<Recipe | null>({
    queryKey: ["/api/articles", articleId, "recipe"],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}/recipe`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }
        return response.json();
      } catch (err) {
        console.error("Erreur lors du chargement de la recette:", err);
        return null;
      }
    },
  });

  const createRecipeMutation = useMutation({
    mutationFn: (data: RecipeForm) => {
      console.log("🔥 CREATE RECIPE - Données envoyées:", data);
      return apiRequest("/api/recipes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId, "recipe"] });
      toast({ title: "Recette créée avec succès" });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("❌ CREATE RECIPE - Erreur:", error);
      toast({ title: "Erreur lors de la création de la recette", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement de la recette...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Erreur lors du chargement de la recette
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recipe) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recette</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-recipe">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une recette
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une recette</DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <RecipeForm
                    articleId={articleId}
                    onSuccess={() => setIsDialogOpen(false)}
                    mutation={createRecipeMutation}
                  /></DialogBody>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 text-muted-foreground">
            <p>Aucune recette associée à ce produit</p>
            <p className="text-sm mt-2">Créez une recette pour définir la composition et la préparation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{recipe.designation}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Quantité:</strong> {recipe.quantity} {recipe.unit}
            </span>
          </div>
          {recipe.isSubRecipe && (
            <Badge variant="secondary">Sous-recette</Badge>
          )}
        </div>

        {recipe.description && (
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Ingrédients</h4>
          <div className="text-sm text-muted-foreground">
            À implémenter : Liste des ingrédients de la recette
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Étapes de préparation</h4>
          <div className="text-sm text-muted-foreground">
            À implémenter : Étapes détaillées de préparation
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecipeForm({
  articleId,
  onSuccess,
  mutation
}: {
  articleId: number;
  onSuccess: () => void;
  mutation: any;
}) {
  const form = useForm<RecipeForm>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      articleId,
      designation: "",
      description: "",
      quantity: "",
      unit: "",
      isSubRecipe: false,
    },
  });

  const onSubmit = (data: RecipeForm) => {
    console.log("🔥 RECIPE FORM - Soumission des données:", data);
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la recette *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Pâte à croissant" data-testid="input-recipe-name" />
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
                <Textarea {...field} placeholder="Description de la recette" data-testid="input-recipe-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="1" placeholder="Ex: 8" data-testid="input-recipe-quantity" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unité *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: pièces, portions" data-testid="input-recipe-unit" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-submit-recipe"
          >
            {mutation.isPending ? "Création..." : "Créer la recette"}
          </Button>
        </div>
      </form>
    </Form>
  );
}