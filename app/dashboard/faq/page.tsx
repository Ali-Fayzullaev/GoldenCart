"use client";

import { useState } from "react";
import { HelpCircle, Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMyStore } from "@/lib/hooks/use-stores";
import {
  useStoreFaqs,
  useCreateStoreFaq,
  useUpdateStoreFaq,
  useDeleteStoreFaq,
} from "@/lib/hooks/use-store-faqs";
import { toast } from "sonner";

export default function FaqDashboardPage() {
  const { data: store } = useMyStore();
  const { data: faqs, isLoading } = useStoreFaqs(store?.id);
  const createFaq = useCreateStoreFaq();
  const updateFaq = useUpdateStoreFaq();
  const deleteFaq = useDeleteStoreFaq();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleCreate = async () => {
    if (!store || !question.trim() || !answer.trim()) return;
    try {
      await createFaq.mutateAsync({
        store_id: store.id,
        question: question.trim(),
        answer: answer.trim(),
      });
      setQuestion("");
      setAnswer("");
      toast.success("Вопрос добавлен");
    } catch {
      toast.error("Ошибка создания");
    }
  };

  const handleUpdate = (id: string, field: string, value: string | boolean) => {
    updateFaq.mutate({ id, [field]: value } as never);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFaq.mutateAsync(id);
      toast.success("Удалено");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">FAQ — Частые вопросы</h1>

      {/* Добавление */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Добавить вопрос</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Вопрос</Label>
            <Input
              placeholder="Как оформить заказ?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Ответ</Label>
            <Textarea
              placeholder="Добавьте товар в корзину и..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={createFaq.isPending || !question.trim() || !answer.trim()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Список */}
      {!faqs?.length ? (
        <div className="text-center py-10 bg-white rounded-xl border">
          <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Вопросов пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl border p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-gray-300 mt-1 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">Вопрос</Label>
                    <Input
                      defaultValue={faq.question}
                      className="text-sm font-medium"
                      onBlur={(e) => handleUpdate(faq.id, "question", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Ответ</Label>
                    <Textarea
                      defaultValue={faq.answer}
                      className="text-sm"
                      rows={2}
                      onBlur={(e) => handleUpdate(faq.id, "answer", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleUpdate(faq.id, "is_active", !faq.is_active)}
                    className="p-1"
                  >
                    {faq.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => handleDelete(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
