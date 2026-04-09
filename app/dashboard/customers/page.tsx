"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMyStore } from "@/lib/hooks/use-stores";
import { useStoreCustomers } from "@/lib/hooks/use-customers";

export default function CustomersPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: customers, isLoading: customersLoading } = useStoreCustomers(store?.id);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil((customers?.length || 0) / PAGE_SIZE);
  const pagedCustomers = customers?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

  if (storeLoading || customersLoading) {
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
      <h1 className="text-3xl font-bold">Покупатели</h1>

      {!customers?.length ? (
        <div className="text-center py-20 bg-card rounded-xl border">
          <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Покупателей пока нет</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Поделитесь ссылкой на ваш магазин
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Покупатель</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Дата регистрации</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {c.profiles?.avatar_url ? (
                        <img
                          src={c.profiles.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                          {c.profiles?.full_name?.[0] || "?"}
                        </div>
                      )}
                      <span>{c.profiles?.full_name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{c.profiles?.email}</TableCell>
                  <TableCell>
                    {new Date(c.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, customers?.length || 0)} из {customers?.length || 0}
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
