"use client";

import { Users } from "lucide-react";
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
        <p className="text-gray-500">Сначала создайте магазин</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Покупатели</h1>

      {!customers?.length ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Покупателей пока нет</p>
          <p className="text-sm text-gray-400 mt-1">
            Поделитесь ссылкой на ваш магазин
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Покупатель</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Дата регистрации</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
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
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium text-sm">
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
      )}
    </div>
  );
}
