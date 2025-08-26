// Test de création d'une livraison
const testDeliveryCreation = async () => {
  try {
    const deliveryData = {
      type: "delivery",
      status: "draft",
      clientId: 1, // Remplacer par un ID de client valide
      orderId: 1, // Remplacer par un ID de commande valide
      scheduledDate: new Date().toISOString(),
      notes: "Test de livraison",
      currency: "DZD",
      items: [
        {
          articleId: 1, // Remplacer par un ID d'article valide
          quantity: "5",
          notes: "Test article"
        }
      ]
    };

    console.log("Données de livraison à envoyer:", deliveryData);

    const response = await fetch('/api/inventory-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Livraison créée avec succès:", result);
    } else {
      const error = await response.text();
      console.error("Erreur lors de la création:", error);
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
};

// Exécuter le test
testDeliveryCreation();
