import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Truck } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Trash2, User, Calendar, Package } from "lucide-react";
import type { Order, Client, Article } from "@shared/schema";
import { ProductionSummaryDialog } from "./production-summary-dialog";
import { CLIENT_TYPE } from "@shared/constants";

interface ProductionStatus {
  orderId: number;
  etat: string;
  ajustements: string[];
}

interface OrderRowProps {
  order: Order;
  index: number;
  clients: Client[];
  products: Article[];
  onStatusChange: (order: Order, newStatus: string) => void;
  onDelete: (order: Order) => void;
  onView: (order: Order) => void;
  onEdit?: (order: Order) => void;
  orderStatusLabels: Record<string, string>;
  orderStatusColors: Record<string, string>;
  productionStatus?: ProductionStatus;
  productionStatusLoading: boolean;
}

export function OrderRow({
  order,
  index,
  clients,
  products,
  onStatusChange,
  onDelete,
  onView,
  onEdit,
  orderStatusLabels,
  orderStatusColors,
  productionStatus,
  productionStatusLoading
}: OrderRowProps) {
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);

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
    if (client?.type != CLIENT_TYPE) return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
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

  const getProductionStatusLabel = (etat: string) => {
    switch (etat) {
      case "prepare":
        return "Préparé";
      case "partiellement_prepare":
        return "Partiellement préparé";
      case "en_cours":
        return "En cours";
      case "non_prepare":
      default:
        return "Non préparé";
    }
  };

  const getProductionStatusColor = (etat: string) => {
    switch (etat) {
      case "prepare":
        return "bg-green-100 text-green-800 border-green-200";
      case "partiellement_prepare":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "en_cours":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "non_prepare":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
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
        {/* <TableCell>
          <Badge variant="outline">
            {order.type === "quote" ? "Devis" : "Commande"}
          </Badge>
        </TableCell> */}
        <TableCell>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-red-900">{getClientName(order.clientId)}</span>
          </div>
        </TableCell>
        {/* <TableCell className="font-bold">{getClientPhone(order.clientId)}</TableCell> */}
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
              <Badge variant="outline" className={`text-xs px-2 py-1 ${orderStatusColors[order.status as keyof typeof orderStatusLabels]} `
              }>
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
          {productionStatusLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          ) : productionStatus ? (
            <div
              className="flex flex-col gap-1 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
              onClick={() => setIsProductionDialogOpen(true)}
              title="Cliquer pour voir le détail de la préparation"
            >
              <Badge
                className={`${getProductionStatusColor(productionStatus.etat)} border`}
                variant="outline"
              >
                {getProductionStatusLabel(productionStatus.etat)}
              </Badge>

            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              data-testid={`button-view-order-${order.id}`}
              onClick={() => {
                window.location.href = `/deliveries?orderId=${order.id}`;
              }}
            >
              <Truck className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid={`button-view-order-${order.id}`}
              onClick={() => onView(order)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                data-testid={`button-edit-order-${order.id}`}
                onClick={() => onEdit(order)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(order)}
              disabled={order.status != "draft" && order.status != "confirmed"}
              data-testid={`button-delete-order-${order.id}`}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <ProductionSummaryDialog
        order={order}
        isOpen={isProductionDialogOpen}
        onClose={() => setIsProductionDialogOpen(false)}
        clients={clients}
      />
    </>
  );
}
