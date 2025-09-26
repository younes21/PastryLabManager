import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Edit, Euro, DollarSign } from "lucide-react";
import type { PriceList, InsertPriceList, PriceRule, InsertPriceRule, Article, ArticleCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PriceRuleForm } from "@/components/price-rule-form";
import { Layout } from "@/components/layout";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function PriceListsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPriceListId, setSelectedPriceListId] = useState<number | null>(null);
  const [isNewPriceListDialogOpen, setIsNewPriceListDialogOpen] = useState(false);
  const [isNewRuleDialogOpen, setIsNewRuleDialogOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);

  // Fetch price lists
  const { data: priceLists = [], isLoading: priceListsLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  // Fetch articles and categories for rules
  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: categories = [] } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories"],
  });

  // Fetch price rules for selected price list
  const { data: priceRules = [], isLoading: rulesLoading } = useQuery<PriceRule[]>({
    queryKey: [`/api/price-rules/by-list/${selectedPriceListId}`],
    enabled: !!selectedPriceListId,
  });

  // Price List mutations
  const createPriceListMutation = useMutation({
    mutationFn: (data: InsertPriceList) => apiRequest("/api/price-lists", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setIsNewPriceListDialogOpen(false);
      toast({ description: "Liste de prix créée avec succès" });
    },
    onError: () => toast({ description: "Erreur lors de la création", variant: "destructive" }),
  });

  const updatePriceListMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertPriceList> }) =>
      apiRequest(`/api/price-lists/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setEditingPriceList(null);
      toast({ description: "Liste de prix modifiée avec succès" });
    },
    onError: () => toast({ description: "Erreur lors de la modification", variant: "destructive" }),
  });

  const deletePriceListMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/price-lists/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      if (selectedPriceListId === selectedPriceListId) {
        setSelectedPriceListId(null);
      }
      toast({ description: "Liste de prix supprimée avec succès" });
    },
    onError: () => toast({ description: "Erreur lors de la suppression", variant: "destructive" }),
  });

  // Price Rule mutations
  const createRuleMutation = useMutation({
    mutationFn: (data: InsertPriceRule) => apiRequest("/api/price-rules", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/price-rules/by-list/${selectedPriceListId}`] });
      setIsNewRuleDialogOpen(false);
      toast({ description: "Règle de prix créée avec succès" });
    },
    onError: () => toast({ description: "Erreur lors de la création", variant: "destructive" }),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertPriceRule> }) =>
      apiRequest(`/api/price-rules/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/price-rules/by-list/${selectedPriceListId}`] });
      setEditingRule(null);
      toast({ description: "Règle de prix modifiée avec succès" });
    },
    onError: () => toast({ description: "Erreur lors de la modification", variant: "destructive" }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/price-rules/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/price-rules/by-list/${selectedPriceListId}`] });
      toast({ description: "Règle de prix supprimée avec succès" });
    },
    onError: () => toast({ description: "Erreur lors de la suppression", variant: "destructive" }),
  });

  const handlePriceListSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: InsertPriceList = {
      designation: formData.get("designation") as string,
      description: formData.get("description") as string,
      active: formData.get("active") === "on",
    };

    if (editingPriceList) {
      updatePriceListMutation.mutate({ id: editingPriceList.id, data });
    } else {
      createPriceListMutation.mutate(data);
    }
  };



  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "EUR": return <Euro className="w-4 h-4" />;
      case "USD": return <DollarSign className="w-4 h-4" />;
      default: return <span className="w-4 h-4 text-center font-bold text-xs">{currency}</span>;
    }
  };
  usePageTitle('Listes de Prix');
  if (priceListsLoading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <p >  <span className="hidden md:block ">Creer des prix personnalisé pour vos clients fidèles </span> </p>
        <Dialog open={isNewPriceListDialogOpen} onOpenChange={setIsNewPriceListDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-hover" data-testid="button-new-price-list">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Liste
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle Liste de Prix</DialogTitle>
              <DialogDescription>
                Créer une nouvelle liste de prix avec ses paramètres
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <form onSubmit={handlePriceListSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Désignation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    required
                    data-testid="input-designation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Monnaie</Label>
                  <Select name="currency" defaultValue="DA">
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DA">DA (Dinar Algérien)</SelectItem>
                      {/* <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="active" name="active" defaultChecked />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewPriceListDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" data-testid="button-submit-price-list">
                    Créer
                  </Button>
                </div>
              </form>
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="lists" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="lists" className="h-10">Listes de Prix</TabsTrigger>
          <TabsTrigger value="rules" className="h-10" disabled={!selectedPriceListId}>
            Règles {selectedPriceListId && `(${priceLists.find(p => p.id === selectedPriceListId)?.designation})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lists" className="space-y-4">
          <div className="grid gap-4">
            {priceLists.map((priceList: PriceList) => (
              <Card
                key={priceList.id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedPriceListId === priceList.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                onClick={() => setSelectedPriceListId(priceList.id)}
                data-testid={`card-price-list-${priceList.id}`}
              >
                <CardHeader className="p-4 pb-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{priceList.designation}</CardTitle>
                      <div className="flex items-center space-x-1">
                        {priceList.description}

                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={priceList.active ? "default" : "secondary"}>
                        {priceList.active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPriceList(priceList);
                        }}
                        data-testid={`button-edit-price-list-${priceList.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePriceListMutation.mutate(priceList.id);
                        }}
                        data-testid={`button-delete-price-list-${priceList.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-gray-600">
                    Créée le {new Date(priceList.createdAt!).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {selectedPriceListId && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Règles - {priceLists.find(p => p.id === selectedPriceListId)?.designation}
                </h2>
                <Dialog open={isNewRuleDialogOpen} onOpenChange={setIsNewRuleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-rule">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle Règle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogBody>
                      <PriceRuleForm
                        priceListId={selectedPriceListId}
                        articles={articles}
                        categories={categories}
                        onSubmit={(data) => createRuleMutation.mutate(data)}
                        onCancel={() => setIsNewRuleDialogOpen(false)}
                        isLoading={createRuleMutation.isPending}
                      /></DialogBody>
                  </DialogContent>
                </Dialog>
              </div>

              {rulesLoading ? (
                <div>Chargement des règles...</div>
              ) : (
                <div className="grid gap-4">
                  {priceRules.map((rule: PriceRule) => (
                    <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {rule.applyTo === 'product' ? 'Produit' : 'Catégorie'}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              Type: {rule.priceType}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={rule.active ? "default" : "secondary"}>
                              {rule.active ? "Active" : "Inactive"}
                            </Badge>
                            <Dialog open={editingRule?.id === rule.id} onOpenChange={(open) => !open && setEditingRule(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingRule(rule)}
                                  data-testid={`button-edit-rule-${rule.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogBody>
                                  <PriceRuleForm
                                    priceListId={selectedPriceListId}
                                    articles={articles}
                                    categories={categories}
                                    editingRule={rule}
                                    onSubmit={(data) => updateRuleMutation.mutate({ id: rule.id, data })}
                                    onCancel={() => setEditingRule(null)}
                                    isLoading={updateRuleMutation.isPending}
                                  />
                                </DialogBody>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRuleMutation.mutate(rule.id)}
                              data-testid={`button-delete-rule-${rule.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Quantité min:</span> {rule.minQuantity}
                          </div>
                          {rule.fixedPrice && (
                            <div>
                              <span className="font-medium">Prix fixe:</span> {rule.fixedPrice}
                            </div>
                          )}
                          {rule.discountPercent && (
                            <div>
                              <span className="font-medium">Remise:</span> {rule.discountPercent}%
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Price List Dialog */}
      <Dialog open={!!editingPriceList} onOpenChange={(open) => !open && setEditingPriceList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Liste de Prix</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {editingPriceList && (
              <form onSubmit={handlePriceListSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Désignation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    defaultValue={editingPriceList.designation}
                    required
                    data-testid="input-edit-designation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Monnaie</Label>
                  <Select name="currency" defaultValue={editingPriceList.currency}>
                    <SelectTrigger data-testid="select-edit-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DA">DA (Dinar Algérien)</SelectItem>

                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="active" name="active" defaultChecked={editingPriceList.active} />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingPriceList(null)}>
                    Annuler
                  </Button>
                  <Button type="submit" data-testid="button-update-price-list">
                    Modifier
                  </Button>
                </div>
              </form>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>

  );
}