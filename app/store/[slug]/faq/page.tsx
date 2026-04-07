"use client";

import { use, useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { usePublicStoreFaqs } from "@/lib/hooks/use-store-faqs";

export default function StoreFaqPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: faqs, isLoading } = usePublicStoreFaqs(store?.id);
  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
        Частые вопросы
      </h1>

      {!faqs?.length ? (
        <div className="text-center py-20">
          <HelpCircle className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Пока нет вопросов</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      )}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 whitespace-pre-line leading-relaxed border-t pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}
