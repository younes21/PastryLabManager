import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Trash2, User, Calendar, Package } from "lucide-react";
import type { Order, Client, Article } from "@shared/schema";

interface OrderRowProps {
  order: Order;
  index: number;
  clients: Client[];
  products: Article[];
  onStatusChange: (order: Order, newStatus: string) => void;
  onDelete: (order: Order) => void;
  onView: (order: Order) => void;
  orderStatusLabels: Record<string, string>;
  orderStatusColors: Record<string, string>;
}

export function OrderRow({
  order,
  index,
  clients,
  products,
  onStatusChange,
  onDelete,
  onView,
  orderStatusLabels,
  orderStatusColors
}: OrderRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    if (client?.type != 'societe') return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
    else return client ? `${client.companyName}` : "Client inconnu";
  };

  const getClientPhone = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.phone || "-";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      data-testid={`row-order-${order.id}`}
      className={isDragging ? "opacity-50" : ""}
    >
      <TableCell className="w-12 p-0">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center h-full cursor-grab active:cursor-grabbing p-2 hover:bg-muted/50 rounded"
          title="Glisser pour réordonner"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{order.code}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {order.type === "quote" ? "Devis" : "Commande"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {getClientName(order.clientId)}
        </div>
      </TableCell>
      <TableCell>{getClientPhone(order.clientId)}</TableCell>
      <TableCell>{formatDate(order.orderDate || null)}</TableCell>
      <TableCell>{formatDate(order.deliveryDate || null)}</TableCell>
      <TableCell className="font-semibold">
        {parseFloat(order.totalTTC || "0").toFixed(2)} DA
      </TableCell>
      <TableCell>
        <Select
          value={order.status}
          onValueChange={(value) => onStatusChange(order, value)}
        >
          <SelectTrigger className="w-auto">
            <Badge variant={orderStatusColors[order.status as keyof typeof orderStatusColors]}>
              {orderStatusLabels[order.status as keyof typeof orderStatusLabels]}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(orderStatusLabels).map(([status, label]) => (
              <SelectItem key={status} value={status}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-view-order-${order.id}`}
            onClick={() => onView(order)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-edit-order-${order.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(order)}
            disabled={order.status === "confirmed" || order.status === "delivered"}
            data-testid={`button-delete-order-${order.id}`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
