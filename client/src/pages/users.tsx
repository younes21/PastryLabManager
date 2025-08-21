import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Trash2 } from "lucide-react";

export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "preparateur",
    active: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest( "/api/users","POST", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès.",
      });
      closeModal();
    },
    onError: (err) => {
      console.log(err)
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest( `/api/users/${id}`,"PUT", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Utilisateur modifié",
        description: "L'utilisateur a été modifié avec succès.",
      });
      closeModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest( `/api/users/${id}`,"DELETE", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const openModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "", // Don't pre-fill password for security
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        active: user.active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "preparateur",
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Erreur",
        description: "Le mot de passe est obligatoire pour un nouvel utilisateur.",
        variant: "destructive",
      });
      return;
    }

    const userData = editingUser && !formData.password 
      ? { ...formData, password: undefined } // Don't include password if not changed
      : formData;

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Admin", variant: "destructive" as const },
      gerant: { label: "Gérant", variant: "default" as const },
      preparateur: { label: "Préparateur", variant: "secondary" as const },
      livreur: { label: "Livreur", variant: "outline" as const },
      client: { label: "Client", variant: "secondary" as const },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.client;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  usePageTitle('Utilisateurs'); 

  if (isLoading) {
    return (
     
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
     
    );
  }

return (
  <div className="px-4 sm:px-6 lg:px-8 pt-8">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
    <Button className="bg-accent hover:bg-accent-hover" onClick={() => openModal()}>
      <i className="fas fa-plus mr-2"></i>
      Nouvel Utilisateur
    </Button>
  </div>

  <Card>
    <CardContent className="p-0">
      {users && users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  {/* Colonne Utilisateur */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-sm font-medium">
                          {getInitials(user.firstName, user.lastName)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Colonne Email */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>

                  {/* Colonne Rôle */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>

                  {/* Colonne Statut */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>

                  {/* Colonne Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openModal(user)}
                        className="text-xs"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 btn-red px-4 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        disabled={deleteUserMutation.isPending}
                      
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                      {/* <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        disabled={deleteUserMutation.isPending}
                        className="text-xs"
                      >
                        <i className="fas fa-trash"></i>
                      </Button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
          <p className="text-lg font-medium text-gray-500 mb-2">Aucun utilisateur</p>
          <p className="text-sm text-gray-400">Cliquez sur "Nouvel Utilisateur" pour commencer</p>
        </div>
      )}
    </CardContent>
  </Card>

  {/* User Modal - reste identique */}
  <Dialog open={isModalOpen} onOpenChange={closeModal}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="username">Nom d'utilisateur *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="password">
            Mot de passe {editingUser ? "(laisser vide pour ne pas changer)" : "*"}
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required={!editingUser}
          />
        </div>
        
        <div>
          <Label htmlFor="role">Rôle *</Label>
          <Select value={formData.role || undefined} onValueChange={(value) => setFormData({...formData, role: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="gerant">Gérant</SelectItem>
              <SelectItem value="preparateur">Préparateur</SelectItem>
              <SelectItem value="livreur">Livreur</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({...formData, active: checked})}
          />
          <Label htmlFor="active">Compte actif</Label>
        </div>
        
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={closeModal}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={createUserMutation.isPending || updateUserMutation.isPending}
          >
            {editingUser ? "Modifier" : "Créer"}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</div>
    
  );
}
