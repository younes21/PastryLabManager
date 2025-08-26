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

interface OrdersTableProps {
  orders: Order[];
  clients: Client[];
  products: Article[];
  onStatusChange: (order: Order, newStatus: string) => void;
  onDelete: (order: Order) => void;
  onView: (order: Order) => void;
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orders.findIndex((order) => order.id === active.id);
      const newIndex = orders.findIndex((order) => order.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrders = arrayMove(orders, oldIndex, newIndex);
        
        // Mettre à jour l'ordre dans la base de données
        onReorder(newOrders);
      }
    }
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
            <TableHead>Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Date commande</TableHead>
            <TableHead>Date livraison</TableHead>
            <TableHead>Total TTC</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8">
                Chargement des commandes...
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8">
                Aucune commande trouvée
              </TableCell>
            </TableRow>
          ) : (
            <SortableContext items={orders.map(order => order.id)} strategy={verticalListSortingStrategy}>
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
                  orderStatusLabels={orderStatusLabels}
                  orderStatusColors={orderStatusColors}
                />
              ))}
            </SortableContext>
          )}
        </TableBody>
      </Table>
    </DndContext>
  );
}
