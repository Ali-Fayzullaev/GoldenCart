"use client";

import { ShoppingCart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMyStore } from "@/lib/hooks/use-stores";
import { useSellerOrders, useUpdateOrderStatus } from "@/lib/hooks/use-orders";
import { formatPrice, getStatusLabel, getStatusColor } from "@/lib/helpers";
import { toast } from "sonner";
import type { Order } from "@/lib/types/database";

const statuses: Order["status"][] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrdersPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: orders, isLoading: ordersLoading } = useSellerOrders(store?.id);
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (orderId: string, status: string | null) => {
    if (!status) return;
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: status as Order["status"],
      });
      toast.success("Статус обновлён");
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  if (storeLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Сначала создайте магазин</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Заказы</h1>

      {!orders?.length ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Заказов пока нет</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заказ</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Товары</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.order_items?.map((item, i) => (
                        <p key={i} className="text-sm">
                          {item.products?.name} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(order.total_amount)}
                  </TableCell>
                  <TableCell className="text-sm max-w-48 truncate">
                    {order.shipping_address}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(val) =>
                        handleStatusChange(order.id, val)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
