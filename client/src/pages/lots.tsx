import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package, Calendar, User, FileText, Search, Filter,
  Plus, Edit, Trash2, Eye, AlertTriangle, CheckCircle,
  Clock, X
} from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Lot {
  id: number;
  articleId: number;
  code: string;
  manufacturingDate: string | null;
  useDate: string | null;
  expirationDate: string | null;
  alertDate: string | null;
  supplierId: number | null;
  notes: string | null;
  createdAt: string;
  // Informations de l'article
  articleName?: string;
  articleCode?: string;
  articleUnit?: string;
  // Informations du fournisseur
  supplierName?: string;
  supplierCode?: string;
}

interface Article {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface Supplier {
  id: number;
  code: string;
  companyName: string;
}

export default function LotsPage() {
  usePageTitle("Gestion des Lots");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [formData, setFormData] = useState({
    articleId: "",
    code: "",
    manufacturingDate: "",
    useDate: "",
    expirationDate: "",
    alertDate: "",
    supplierId: "",
    notes: "",
  });

  // Récupération des données
  const { data: lots = [], isLoading: lotsLoading } = useQuery({
    queryKey: ['lots'],
    queryFn: async () => {
      const response = await apiRequest('/api/lots');
      if (!response.ok) throw new Error('Erreur lors de la récupération des lots');
      return response.json();
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const response = await apiRequest('/api/articles');
      if (!response.ok) throw new Error('Erreur lors de la récupération des articles');
      return response.json();
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await apiRequest('/api/suppliers');
      if (!response.ok) throw new Error('Erreur lors de la récupération des fournisseurs');
      return response.json();
    },
  });

  // Mutations
  const createLotMutation = useMutation({
    mutationFn: async (lotData: any) => {
      const response = await apiRequest('/api/lots', 'POST', lotData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du lot');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: async ({ id, lotData }: { id: number; lotData: any }) => {
      const response = await apiRequest(`/api/lots/${id}`, 'PUT', lotData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du lot');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsEditModalOpen(false);
      setSelectedLot(null);
      resetForm();
    },
  });

  const deleteLotMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/lots/${id}`, 'DELETE');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du lot');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
  });

  // Fonctions utilitaires
  const resetForm = () => {
    setFormData({
      articleId: "",
      code: "",
      manufacturingDate: "",
      useDate: "",
      expirationDate: "",
      alertDate: "",
      supplierId: "",
      notes: "",
    });
  };

  const handleEdit = (lot: Lot) => {
    setSelectedLot(lot);
    setFormData({
      articleId: lot.articleId.toString(),
      code: lot.code,
      manufacturingDate: lot.manufacturingDate || "",
      useDate: lot.useDate || "",
      expirationDate: lot.expirationDate || "",
      alertDate: lot.alertDate || "",
      supplierId: lot.supplierId?.toString() || "",
      notes: lot.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lotData = {
      articleId: parseInt(formData.articleId),
      code: formData.code,
      manufacturingDate: formData.manufacturingDate || null,
      useDate: formData.useDate || null,
      expirationDate: formData.expirationDate || null,
      alertDate: formData.alertDate || null,
      supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
      notes: formData.notes || null,
    };

    if (selectedLot) {
      updateLotMutation.mutate({ id: selectedLot.id, lotData });
    } else {
      createLotMutation.mutate(lotData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
      deleteLotMutation.mutate(id);
    }
  };

  const getExpirationStatus = (expirationDate: string | null, alertDate: string | null) => {
    if (!expirationDate) return { status: 'unknown', label: 'Inconnu', color: 'gray' };

    const now = new Date();
    const expDate = new Date(expirationDate);
    const alertDateObj = alertDate ? new Date(alertDate) : null;

    if (expDate < now) {
      return { status: 'expired', label: 'Expiré', color: 'red' };
    } else if (alertDateObj && alertDateObj <= now) {
      return { status: 'alert', label: 'Alerte', color: 'yellow' };
    } else {
      return { status: 'valid', label: 'Valide', color: 'green' };
    }
  };

  // Filtrage des lots
  const filteredLots = lots.filter((lot: Lot) => {
    const matchesSearch = lot.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.articleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArticle = selectedArticle === "all" || lot.articleId.toString() === selectedArticle;

    return matchesSearch && matchesArticle;
  });

  if (lotsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des lots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Lots</h1>
          <p className="text-gray-600">Gérez les lots de vos articles et ingrédients</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Lot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl ">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package />
                Créer un nouveau lot
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <form onSubmit={handleSubmit} className="space-y-4 ">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="articleId">Article *</Label>
                    <Select value={formData.articleId} onValueChange={(value) => setFormData(prev => ({ ...prev, articleId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un article" />
                      </SelectTrigger>
                      <SelectContent>
                        {articles.map((article: Article) => (
                          <SelectItem key={article.id} value={article.id.toString()}>
                            {article.name} ({article.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code du lot *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Ex: LOT-2024-001"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturingDate">Date de fabrication</Label>
                    <Input
                      id="manufacturingDate"
                      type="date"
                      value={formData.manufacturingDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, manufacturingDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="useDate">Date limite d'utilisation</Label>
                    <Input
                      id="useDate"
                      type="date"
                      value={formData.useDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, useDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Date de péremption</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alertDate">Date d'alerte</Label>
                    <Input
                      id="alertDate"
                      type="date"
                      value={formData.alertDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, alertDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierId">Fournisseur</Label>
                  <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Aucun fournisseur</SelectItem>
                      {suppliers.map((supplier: Supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.companyName} ({supplier.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Informations supplémentaires sur ce lot..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={createLotMutation.isPending || !formData.articleId || !formData.code}
                  >
                    {createLotMutation.isPending ? "Création..." : "Créer le lot"}
                  </Button>
                </div>
              </form>
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par code, article ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Select value={selectedArticle} onValueChange={setSelectedArticle}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par article" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les articles</SelectItem>
                  {articles.map((article: Article) => (
                    <SelectItem key={article.id} value={article.id.toString()}>
                      {article.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des lots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lots ({filteredLots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date de fabrication</TableHead>
                  <TableHead>Date de péremption</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot: Lot) => {
                  const expirationStatus = getExpirationStatus(lot.expirationDate, lot.alertDate);
                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lot.articleName}</div>
                          <div className="text-sm text-gray-500">{lot.articleCode} - {lot.articleUnit}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lot.supplierName ? (
                          <div>
                            <div className="font-medium">{lot.supplierName}</div>
                            <div className="text-sm text-gray-500">{lot.supplierCode}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lot.manufacturingDate ? format(new Date(lot.manufacturingDate), 'dd/MM/yyyy', { locale: fr }) : '-'}
                      </TableCell>
                      <TableCell>
                        {lot.expirationDate ? format(new Date(lot.expirationDate), 'dd/MM/yyyy', { locale: fr }) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expirationStatus.color === 'red' ? 'destructive' : expirationStatus.color === 'yellow' ? 'secondary' : 'default'}>
                          {expirationStatus.status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {expirationStatus.status === 'alert' && <Clock className="w-3 h-3 mr-1" />}
                          {expirationStatus.status === 'valid' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {expirationStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(lot.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(lot)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lot.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Modifier le lot
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-articleId">Article *</Label>
                  <Select value={formData.articleId} onValueChange={(value) => setFormData(prev => ({ ...prev, articleId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un article" />
                    </SelectTrigger>
                    <SelectContent>
                      {articles.map((article: Article) => (
                        <SelectItem key={article.id} value={article.id.toString()}>
                          {article.name} ({article.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Code du lot *</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ex: LOT-2024-001"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-manufacturingDate">Date de fabrication</Label>
                  <Input
                    id="edit-manufacturingDate"
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturingDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-useDate">Date limite d'utilisation</Label>
                  <Input
                    id="edit-useDate"
                    type="date"
                    value={formData.useDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, useDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expirationDate">Date de péremption</Label>
                  <Input
                    id="edit-expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-alertDate">Date d'alerte</Label>
                  <Input
                    id="edit-alertDate"
                    type="date"
                    value={formData.alertDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, alertDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplierId">Fournisseur</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Aucun fournisseur</SelectItem>
                    {suppliers.map((supplier: Supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.companyName} ({supplier.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations supplémentaires sur ce lot..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={updateLotMutation.isPending || !formData.articleId || !formData.code}
                >
                  {updateLotMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
