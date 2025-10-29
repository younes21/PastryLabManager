import React, { useState } from 'react';
import { Package, MapPin, Phone, Camera, CheckCircle, XCircle, Clock, Navigation, User, Settings, History, Map, CreditCard, Bell, Search, RefreshCw, ChevronRight, Home } from 'lucide-react';

const DeliveryApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  
  // Données mockées
  const deliveryStats = {
    total: 12,
    delivered: 7,
    inProgress: 3,
    pending: 2
  };

  const [deliveries, setDeliveries] = useState([
    {
      id: 1,
      orderNumber: 'CMD-2024-001',
      customer: 'Mohammed Benali',
      phone: '+213 555 123 456',
      address: '15 Rue Didouche Mourad, Alger Centre',
      time: '09:00 - 10:00',
      status: 'delivered',
      items: ['Ordinateur portable HP', 'Souris sans fil'],
      amount: 45000,
      proof: null
    },
    {
      id: 2,
      orderNumber: 'CMD-2024-002',
      customer: 'Fatima Meziane',
      phone: '+213 555 234 567',
      address: '42 Avenue de l\'Indépendance, Oran',
      time: '10:30 - 11:30',
      status: 'inProgress',
      items: ['Téléviseur Samsung 43"', 'Support mural'],
      amount: 78000,
      proof: null
    },
    {
      id: 3,
      orderNumber: 'CMD-2024-003',
      customer: 'Karim Tadjer',
      phone: '+213 555 345 678',
      address: '8 Boulevard Zirout Youcef, Constantine',
      time: '12:00 - 13:00',
      status: 'pending',
      items: ['Machine à laver LG 7kg'],
      amount: 52000,
      proof: null
    },
    {
      id: 4,
      orderNumber: 'CMD-2024-004',
      customer: 'Amina Boudiaf',
      phone: '+213 555 456 789',
      address: '23 Rue Larbi Ben M\'hidi, Annaba',
      time: '14:00 - 15:00',
      status: 'pending',
      items: ['Réfrigérateur Condor', 'Garantie étendue'],
      amount: 95000,
      proof: null
    },
    {
      id: 5,
      orderNumber: 'CMD-2024-005',
      customer: 'Yacine Hamdi',
      phone: '+213 555 567 890',
      address: '67 Avenue Pasteur, Blida',
      time: '15:30 - 16:30',
      status: 'inProgress',
      items: ['Climatiseur Split 12000 BTU'],
      amount: 68000,
      proof: null
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'inProgress': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      case 'inProgress': return <RefreshCw className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'delivered': return 'Livrée';
      case 'inProgress': return 'En cours';
      case 'pending': return 'En attente';
      default: return 'En attente';
    }
  };

  const updateDeliveryStatus = (id, newStatus) => {
    setDeliveries(deliveries.map(d => 
      d.id === id ? { ...d, status: newStatus } : d
    ));
  };

  // Écran 1 - Accueil
  const HomeScreen = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Ahmed Benali</h2>
            {/* <p className="text-blue-100 text-sm">Livreur #LV-2024-042</p> */}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span>Mardi 28 Oct 2025 - 14:30</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">Nouvelle mission ajoutée</p>
            <p className="text-sm text-yellow-700">1 livraison urgente à 16h00</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <h3 className="font-bold text-gray-800 mb-3 text-lg">Résumé du jour</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-1">{deliveryStats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{deliveryStats.delivered}</span>
            </div>
            <div className="text-sm text-gray-600">Livrées</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-6 h-6 text-orange-600" />
              <span className="text-3xl font-bold text-orange-600">{deliveryStats.inProgress}</span>
            </div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-6 h-6 text-gray-600" />
              <span className="text-3xl font-bold text-gray-600">{deliveryStats.pending}</span>
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-4 pb-20">
        <h3 className="font-bold text-gray-800 mb-3 text-lg">Actions rapides</h3>
        <div className="space-y-2">
          <button 
            onClick={() => setCurrentScreen('list')}
            className="w-full bg-blue-500 text-white p-4 rounded-xl flex items-center justify-between shadow-lg active:scale-95 transition"
          >
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6" />
              <span className="font-semibold">Voir mes livraisons</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentScreen('map')}
            className="w-full bg-white text-gray-800 p-4 rounded-xl flex items-center justify-between shadow active:scale-95 transition"
          >
            <div className="flex items-center gap-3">
              <Map className="w-6 h-6 text-blue-600" />
              <span className="font-semibold">Carte de tournée</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Écran 2 - Liste des livraisons
  const ListScreen = () => {
    const filteredDeliveries = deliveries.filter(d => 
      d.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 sticky top-0 z-10 shadow-lg">
          <h1 className="text-xl font-bold mb-3">Mes livraisons</h1>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="p-4 space-y-3">
          {filteredDeliveries.map(delivery => (
            <div 
              key={delivery.id}
              onClick={() => {
                setSelectedDelivery(delivery);
                setCurrentScreen('detail');
              }}
              className="bg-white rounded-xl shadow-sm p-4 active:scale-98 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{delivery.customer}</h3>
                  <p className="text-sm text-gray-500">{delivery.orderNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                  {getStatusIcon(delivery.status)}
                  {getStatusText(delivery.status)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{delivery.address}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{delivery.time}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`);
                  }}
                  className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1"
                >
                  <Navigation className="w-4 h-4" />
                  Itinéraire
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Écran 3 - Détails livraison
  const DetailScreen = () => {
    if (!selectedDelivery) return null;

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4">
          <button 
            onClick={() => setCurrentScreen('list')}
            className="mb-3 flex items-center gap-2"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Retour</span>
          </button>
          <h1 className="text-xl font-bold">Détails de livraison</h1>
        </div>

        <div className="p-4 space-y-4">
          {/* Info client */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">Informations client</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Numéro de commande</p>
                <p className="font-semibold">{selectedDelivery.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-semibold">{selectedDelivery.customer}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-semibold">{selectedDelivery.phone}</p>
                </div>
                <a 
                  href={`tel:${selectedDelivery.phone}`}
                  className="bg-green-500 text-white p-3 rounded-full"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-semibold">{selectedDelivery.address}</p>
                </div>
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDelivery.address)}`)}
                  className="bg-blue-500 text-white p-3 rounded-full ml-2"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-500">Créneau horaire</p>
                <p className="font-semibold">{selectedDelivery.time}</p>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">Articles à livrer</h3>
            <ul className="space-y-2">
              {selectedDelivery.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="font-semibold">Montant à encaisser</span>
              <span className="text-xl font-bold text-green-600">{selectedDelivery.amount.toLocaleString()} DA</span>
            </div>
          </div>

          {/* Statut */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">Changer le statut</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateDeliveryStatus(selectedDelivery.id, 'inProgress')}
                className={`p-3 rounded-lg font-semibold ${selectedDelivery.status === 'inProgress' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'}`}
              >
                En route
              </button>
              <button 
                onClick={() => updateDeliveryStatus(selectedDelivery.id, 'delivered')}
                className={`p-3 rounded-lg font-semibold ${selectedDelivery.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'}`}
              >
                Livré
              </button>
            </div>
          </div>

          {/* Preuve */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">Ajouter une preuve</h3>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-50 text-blue-600 p-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Photo
              </button>
              <button className="flex-1 bg-purple-50 text-purple-600 p-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <span className="text-xl">✍️</span>
                Signature
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Confirmer la livraison
            </button>
            <button className="w-full bg-red-50 text-red-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              Signaler un problème
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Écran 4 - Paiements
  const PaymentScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-xl font-bold">Paiements du jour</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total encaissé</span>
            <span className="text-2xl font-bold text-green-600">175 000 DA</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">En attente</span>
            <span className="font-semibold text-orange-600">147 000 DA</span>
          </div>
        </div>

        <div className="space-y-3">
          {deliveries.filter(d => d.status !== 'pending').map(delivery => (
            <div key={delivery.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{delivery.orderNumber}</p>
                  <p className="text-sm text-gray-500">{delivery.customer}</p>
                </div>
                {delivery.status === 'delivered' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <Clock className="w-6 h-6 text-orange-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{delivery.amount.toLocaleString()} DA</span>
                {delivery.status === 'delivered' ? (
                  <span className="text-sm text-green-600 font-semibold">Encaissé</span>
                ) : (
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Confirmer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Écran 5 - Carte
  const MapScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-xl font-bold">Carte de tournée</h1>
      </div>

      <div className="relative">
        {/* Simulation de carte */}
        <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Map className="w-16 h-16 text-gray-400" />
          </div>
          {/* Points de livraison simulés */}
          <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-orange-500 rounded-full border-4 border-white shadow-lg"></div>
          <div className="absolute top-2/3 left-2/3 w-8 h-8 bg-gray-400 rounded-full border-4 border-white shadow-lg"></div>
        </div>

        {/* Liste horizontale */}
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-3">
            {deliveries.map(delivery => (
              <div 
                key={delivery.id}
                onClick={() => {
                  setSelectedDelivery(delivery);
                  setCurrentScreen('detail');
                }}
                className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{delivery.customer}</span>
                  <span className={`w-3 h-3 rounded-full ${delivery.status === 'delivered' ? 'bg-green-500' : delivery.status === 'inProgress' ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{delivery.address}</p>
                <p className="text-xs text-gray-500 mt-1">{delivery.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Écran 6 - Historique
  const HistoryScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-xl font-bold">Historique</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-bold mb-3">Statistiques du mois</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">127</p>
              <p className="text-sm text-gray-600">Livraisons</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">98.4%</p>
              <p className="text-sm text-gray-600">Taux de succès</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">1,250 km</p>
              <p className="text-sm text-gray-600">Distance</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">2</p>
              <p className="text-sm text-gray-600">Retards</p>
            </div>
          </div>
        </div>

        <h3 className="font-bold mb-3">Tournées récentes</h3>
        <div className="space-y-2">
          {['Lundi 27 Oct', 'Dimanche 26 Oct', 'Samedi 25 Oct'].map((date, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{date}</p>
                  <p className="text-sm text-gray-500">{15 - idx} livraisons • {95 + idx}% succès</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Écran 7 - Profil
  const ProfileScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-xl font-bold">Mon profil</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-16 h-16 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold">Ahmed Benali</h2>
          <p className="text-gray-500">Livreur #LV-2024-042</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold mb-3">Informations</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">ahmed.benali@delivery.dz</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-semibold">+213 555 987 654</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Véhicule</p>
              <p className="font-semibold">Renault Kangoo - 16-ALG-3456</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <span className="font-semibold">Changer le mot de passe</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full bg-red-50 text-red-600 p-4 rounded-xl font-bold">
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );

  // Navigation bar
  const NavBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="flex justify-around p-2 max-w-md mx-auto">
        <button 
          onClick={() => setCurrentScreen('home')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentScreen === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Accueil</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('list')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentScreen === 'list' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Package className="w-6 h-6" />
          <span className="text-xs mt-1">Livraisons</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('map')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentScreen === 'map' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Map className="w-6 h-6" />
          <span className="text-xs mt-1">Carte</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('payment')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentScreen === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <CreditCard className="w-6 h-6" />
          <span className="text-xs mt-1">Paiements</span>
        </button>
        <button 
          onClick={() => setCurrentScreen('profile')}
          className={`flex flex-col items-center p-2 rounded-lg ${currentScreen === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">Profil</span>
        </button>
      </div>
    </div>
  );

  // Rendu principal
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'list' && <ListScreen />}
      {currentScreen === 'detail' && <DetailScreen />}
      {currentScreen === 'payment' && <PaymentScreen />}
      {currentScreen === 'map' && <MapScreen />}
      {currentScreen === 'history' && <HistoryScreen />}
      {currentScreen === 'profile' && <ProfileScreen />}
      <NavBar />
    </div>
  );
};

export default DeliveryApp