import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { OrderRow } from "./order-row";
import type { Order, Client, Article } from "@shared/schema";
import { useProductionStatusCalculation } from "@/hooks/use-production-status-calculation";

interface OrdersTableProps {
  orders: Order[];
  clients: Client[];
  products: Article[];
  onStatusChange: (order: Order, newStatus: string) => void;
  onDelete: (order: Order) => void;
  onView: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onReorder: (orders: Order[]) => void;
  orderStatusLabels: Record<string, string>;
  orderStatusColors: Record<string, string>;
  isLoading: boolean;
}

export function OrdersTable({
  orders,
  clients,
  products,
  onStatusChange,
  onDelete,
  onView,
  onEdit,
  onReorder,
  orderStatusLabels,
  orderStatusColors,
  isLoading
}: OrdersTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const recalculateOrderValues = (
    filteredOrders: Order[],
    draggedOrder: Order,
    targetOrder: Order
  ): Order[] => {
    if (filteredOrders.length === 0) return filteredOrders;
  
    const oldIndex = filteredOrders.findIndex(o => o.id === draggedOrder.id);
    const newIndex = filteredOrders.findIndex(o => o.id === targetOrder.id);
  
    if (oldIndex === -1 || newIndex === -1) return filteredOrders;
  
    // 1️⃣ Déplacer localement dans la liste filtrée
    const newFiltered = arrayMove([...filteredOrders], oldIndex, newIndex);
  
    // 2️⃣ Conserver la continuité des valeurs `order` d’origine
    const sortedOrderValues = filteredOrders
      .map(o => o.order)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
  
    // 3️⃣ Appliquer les ordres triés dans le nouvel ordre visuel
    const updated = newFiltered.map((order, i) => ({
      ...order,
      order: sortedOrderValues[i],
    }));
  
    return updated;
  };
  // Utiliser le nouveau hook de calcul du statut de production
  const { data: productionStatuses = [], isLoading: productionStatusLoading } = useProductionStatusCalculation(orders);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const draggedOrder = orders.find(o => o.id === active.id);
    const targetOrder = orders.find(o => o.id === over.id);
  
    if (!draggedOrder || !targetOrder) return;
  
    console.log('filtered before orders:', orders.map(o => ({ id:o.id, order:o.order })));
    const updatedFiltered = recalculateOrderValues(orders, draggedOrder, targetOrder);
    console.log('filtered after orders:', updatedFiltered.map(o => ({ id:o.id, order:o.order })));
    
  
    // Envoie les éléments mis à jour à ton backend ou parent
    onReorder(updatedFiltered);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Ordre</TableHead>
            <TableHead>Référence</TableHead>
            {/* <TableHead>Type</TableHead> */}
            <TableHead>Client</TableHead>
            {/* <TableHead>Téléphone</TableHead> */}
            <TableHead>Date commande</TableHead>
            <TableHead>Date livraison</TableHead>
            <TableHead>Total TTC</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Production</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8">
                Chargement des commandes...
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8">
                Aucune commande trouvée
              </TableCell>
            </TableRow>
          ) : (
            <SortableContext items={orders.map((order) => order.id)} strategy={verticalListSortingStrategy}>
              {orders.map((order, index) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  index={index}
                  clients={clients}
                  products={products}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  onView={onView}
                  onEdit={onEdit}
                  orderStatusLabels={orderStatusLabels}
                  orderStatusColors={orderStatusColors}
                  productionStatus={productionStatuses.find(ps => ps.orderId === order.id)}
                  productionStatusLoading={productionStatusLoading}
                />
              ))}
            </SortableContext>
          )}
        </TableBody>
      </Table>
    </DndContext>
  );
}
