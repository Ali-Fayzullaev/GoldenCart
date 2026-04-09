"use client";

import { ShoppingCart, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { Order, OrderWithItems } from "@/lib/types/database";

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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil((orders?.length || 0) / PAGE_SIZE);
  const pagedOrders = orders?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

  const handleStatusChange = async (orderId: string, status: string | null) => {
    if (!status) return;
    const order = orders?.find((o) => o.id === orderId);
    const oldStatus = order?.status || "pending";
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: status as Order["status"],
      });
      toast.success("Статус обновлён");

      // Telegram notification about status change (fire & forget)
      if (store?.telegram_chat_id && order) {
        fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "status_change",
            chat_id: store.telegram_chat_id,
            store_name: store.name,
            order_id: orderId,
            old_status: oldStatus,
            new_status: status,
            total: formatPrice(order.total_amount),
          }),
        }).catch(() => {});
      }

      // Email notification about status change (fire & forget)
      if (store?.contact_email && order) {
        fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: store.contact_email,
            store_name: store.name,
            subject: `Заказ ${orderId.slice(0, 8)} — статус обновлён`,
            type: "status_change",
            order_id: orderId,
            old_status: oldStatus,
            new_status: status,
            total: formatPrice(order.total_amount),
          }),
        }).catch(() => {});
      }
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
        <p className="text-muted-foreground">Сначала создайте магазин</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Заказы</h1>
        {orders && orders.length > 0 && (
          <Button variant="outline" onClick={() => exportOrdersCSV(orders)}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт CSV
          </Button>
        )}
      </div>

      {!orders?.length ? (
        <div className="text-center py-20 bg-card rounded-xl border">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Заказов пока нет</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
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
              {pagedOrders.map((order) => (
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, orders?.length || 0)} из {orders?.length || 0}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  ←
                </button>
                <span className="px-3 py-1.5 text-sm">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function exportOrdersCSV(orders: OrderWithItems[]) {
  const BOM = "\uFEFF";
  const header = [
    "ID заказа",
    "Дата",
    "Статус",
    "Сумма",
    "Адрес",
    "Телефон",
    "Комментарий",
    "Товары",
  ].join(";");

  const rows = orders.map((o) => {
    const items = o.order_items
      ?.map((i) => `${i.products?.name || "?"} x${i.quantity}`)
      .join(", ") || "";
    return [
      o.id.slice(0, 8),
      new Date(o.created_at).toLocaleDateString("ru-RU"),
      getStatusLabel(o.status),
      o.total_amount,
      `"${(o.shipping_address || "").replace(/"/g, '""')}"`,
      o.phone || "",
      `"${(o.notes || "").replace(/"/g, '""')}"`,
      `"${items.replace(/"/g, '""')}"`,
    ].join(";");
  });

  const csv = BOM + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `заказы_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
