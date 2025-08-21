import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, AlertTriangle, Settings, Users, Package } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const testEmailSchema = z.object({
  to: z.string().email("Email invalide"),
  subject: z.string().min(1, "Le sujet est requis"),
  message: z.string().min(1, "Le message est requis"),
});

const systemNotificationSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  message: z.string().min(1, "Le message est requis"),
  type: z.enum(["info", "warning", "error", "success"]),
  roles: z.array(z.string()).optional(),
});

export default function EmailConfigPage() {
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const { toast } = useToast();

  const testEmailForm = useForm<z.infer<typeof testEmailSchema>>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      to: "",
      subject: "Test de configuration email",
      message: "Ceci est un email de test pour vérifier la configuration du serveur de messagerie.",
    },
  });

  const notificationForm = useForm<z.infer<typeof systemNotificationSchema>>({
    resolver: zodResolver(systemNotificationSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      roles: ["admin", "gerant"],
    },
  });

  // Test de configuration
  const testConfigMutation = useMutation({
    mutationFn: () => apiRequest("/api/email/test", "POST"),
    onSuccess: (data: any) => {
      setEmailStatus(data);
      toast({
        title: data.success ? "Configuration valide" : "Erreur de configuration",
        description: data.success ? "Le serveur email est configuré correctement" : data.error,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  // Statut de la queue
  const checkQueueMutation = useMutation({
    mutationFn: () => apiRequest("/api/email/queue/status", "GET"),
    onSuccess: (data: any) => {
      setQueueStatus(data);
    },
  });

  // Envoi d'email de test
  const sendTestEmailMutation = useMutation({
    mutationFn: (data: z.infer<typeof testEmailSchema>) => 
      apiRequest("/api/email/send-test", "POST", data),
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Email envoyé" : "Échec d'envoi",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      if (data.success) {
        testEmailForm.reset();
      }
    },
  });

  // Alerte stock faible
  const sendLowStockAlertMutation = useMutation({
    mutationFn: () => apiRequest("/api/email/notify/low-stock", "POST"),
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Alerte envoyée" : "Échec d'envoi",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  // Notification système
  const sendSystemNotificationMutation = useMutation({
    mutationFn: (data: z.infer<typeof systemNotificationSchema>) => 
      apiRequest("/api/email/notify/system", "POST", data),
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Notification envoyée" : "Échec d'envoi",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      if (data.success) {
        notificationForm.reset();
      }
    },
  });

  const roles = [
    { value: "admin", label: "Administrateurs" },
    { value: "gerant", label: "Gérants" },
    { value: "preparateur", label: "Préparateurs" },
    { value: "client", label: "Clients" },
    { value: "livreur", label: "Livreurs" },
  ];

usePageTitle('Configuration Email'); 
return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configuration Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestion du serveur de messagerie et envoi de notifications
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => testConfigMutation.mutate()}
              disabled={testConfigMutation.isPending}
              variant="outline"
              data-testid="button-test-config"
            >
              <Settings className="mr-2 h-4 w-4" />
              Tester la configuration
            </Button>
            <Button 
              onClick={() => checkQueueMutation.mutate()}
              disabled={checkQueueMutation.isPending}
              variant="outline"
              data-testid="button-check-queue"
            >
              <Mail className="mr-2 h-4 w-4" />
              Statut de la queue
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statut de configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Statut de Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emailStatus ? (
                <div className="space-y-2">
                  <Badge variant={emailStatus.success ? "default" : "destructive"}>
                    {emailStatus.success ? "Configuré" : "Erreur"}
                  </Badge>
                  {emailStatus.error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {emailStatus.error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Cliquez sur "Tester la configuration" pour vérifier</p>
              )}
            </CardContent>
          </Card>

          {/* Statut de la queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Queue d'Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queueStatus ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <Badge variant="outline">{queueStatus.total}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>En attente:</span>
                    <Badge variant="default">{queueStatus.pending}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Échecs:</span>
                    <Badge variant="destructive">{queueStatus.failed}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Statut non vérifié</p>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => sendLowStockAlertMutation.mutate()}
                disabled={sendLowStockAlertMutation.isPending}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="button-low-stock-alert"
              >
                <Package className="mr-2 h-4 w-4" />
                Alerte Stock Faible
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="test" className="space-y-4">
          <TabsList>
            <TabsTrigger value="test">Email de Test</TabsTrigger>
            <TabsTrigger value="notification">Notification Système</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Envoyer un Email de Test</CardTitle>
                <CardDescription>
                  Testez l'envoi d'emails avec un message personnalisé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...testEmailForm}>
                  <form onSubmit={testEmailForm.handleSubmit((data) => sendTestEmailMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={testEmailForm.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destinataire</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="email@exemple.com" data-testid="input-email-to" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testEmailForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sujet</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-email-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testEmailForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} data-testid="textarea-email-message" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={sendTestEmailMutation.isPending}
                      data-testid="button-send-test-email"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendTestEmailMutation.isPending ? "Envoi..." : "Envoyer"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notification">
            <Card>
              <CardHeader>
                <CardTitle>Notification Système</CardTitle>
                <CardDescription>
                  Envoyer une notification à tous les utilisateurs ou à des rôles spécifiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit((data) => sendSystemNotificationMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Titre de la notification" data-testid="input-notification-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} placeholder="Contenu de la notification" data-testid="textarea-notification-message" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-notification-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="info">Information</SelectItem>
                              <SelectItem value="warning">Avertissement</SelectItem>
                              <SelectItem value="error">Erreur</SelectItem>
                              <SelectItem value="success">Succès</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>Destinataires (Rôles)</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role) => (
                          <Badge key={role.value} variant="outline">
                            <Users className="mr-1 h-3 w-3" />
                            {role.label}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">
                        Par défaut: Administrateurs et Gérants
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={sendSystemNotificationMutation.isPending}
                      data-testid="button-send-notification"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendSystemNotificationMutation.isPending ? "Envoi..." : "Envoyer la Notification"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Variables d'Environnement Email</CardTitle>
                <CardDescription>
                  Configuration requise pour le serveur de messagerie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Configuration SMTP</h4>
                      <div className="text-sm space-y-1 font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <div>EMAIL_PROVIDER=smtp</div>
                        <div>SMTP_HOST=smtp.gmail.com</div>
                        <div>SMTP_PORT=587</div>
                        <div>SMTP_SECURE=false</div>
                        <div>SMTP_USER=votre@email.com</div>
                        <div>SMTP_PASS=motdepasse</div>
                        <div>EMAIL_FROM_NAME=Pâtisserie</div>
                        <div>EMAIL_FROM_ADDRESS=noreply@patisserie.com</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Configuration SendGrid</h4>
                      <div className="text-sm space-y-1 font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <div>EMAIL_PROVIDER=sendgrid</div>
                        <div>SENDGRID_API_KEY=SG.xxxxxxxxxx</div>
                        <div>EMAIL_FROM_NAME=Pâtisserie</div>
                        <div>EMAIL_FROM_ADDRESS=noreply@patisserie.com</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      <AlertTriangle className="inline mr-2 h-4 w-4" />
                      Configuration Requise
                    </h4>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Pour utiliser le système d'email, vous devez configurer les variables d'environnement appropriées 
                      selon votre fournisseur de messagerie (SMTP, SendGrid, etc.).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}