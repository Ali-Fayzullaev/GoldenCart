import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const storeId = formData.get("store_id") as string | null;
    const authHeader = req.headers.get("authorization");

    if (!file || !storeId || !authHeader) {
      return NextResponse.json(
        { error: "Файл, store_id и авторизация обязательны" },
        { status: 400 }
      );
    }

    // Проверяем авторизацию
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем что пользователь — владелец магазина
    const { data: store } = await supabase
      .from("stores")
      .select("id, owner_id")
      .eq("id", storeId)
      .single();

    if (!store || store.owner_id !== user.id) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    let text = await file.text();
    // Убираем BOM если есть
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    const lines = text.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "Файл пуст или содержит только заголовок" },
        { status: 400 }
      );
    }

    // Определяем разделитель (запятая, точка с запятой, табуляция)
    const header = lines[0];
    const separator = header.includes("\t")
      ? "\t"
      : header.includes(";")
      ? ";"
      : ",";

    const columns = parseCsvLine(header, separator).map((c) =>
      c.trim().toLowerCase().replace(/\s*\(.*\)$/, "")
    );

    // Маппинг колонок
    const nameIdx = columns.findIndex((c) =>
      ["name", "название", "наименование", "товар", "имя"].includes(c)
    );
    const descIdx = columns.findIndex((c) =>
      ["description", "описание", "desc"].includes(c)
    );
    const priceIdx = columns.findIndex((c) =>
      ["price", "цена", "стоимость"].includes(c)
    );
    const stockIdx = columns.findIndex((c) =>
      ["stock", "остаток", "количество", "qty", "кол-во"].includes(c)
    );
    const categoryIdx = columns.findIndex((c) =>
      ["category", "категория"].includes(c)
    );
    const imagesIdx = columns.findIndex((c) =>
      ["images", "изображения", "фото", "image", "картинки", "url"].includes(c)
    );

    if (nameIdx === -1 || priceIdx === -1) {
      return NextResponse.json(
        {
          error:
            "Не найдены обязательные колонки. Нужны: name/название, price/цена",
          found_columns: columns,
        },
        { status: 400 }
      );
    }

    // Опциональная колонка скидки
    const discountIdx = columns.findIndex((c) =>
      ["discount", "скидка"].includes(c)
    );

    const products: Array<{
      store_id: string;
      name: string;
      description: string;
      price: number;
      stock: number;
      category: string;
      images: string[];
    }> = [];

    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i], separator);
      const name = values[nameIdx]?.trim();
      const priceStr = values[priceIdx]?.trim().replace(/\s/g, "").replace(",", ".");
      let price = parseFloat(priceStr || "0");

      // Применяем скидку если есть
      if (discountIdx >= 0) {
        const discStr = values[discountIdx]?.trim().replace(/[%\s]/g, "").replace(",", ".");
        const discPercent = parseFloat(discStr || "0");
        if (!isNaN(discPercent) && discPercent > 0 && discPercent <= 100) {
          price = Math.round(price * (1 - discPercent / 100));
        }
      }

      if (!name) {
        errors.push(`Строка ${i + 1}: пустое название`);
        continue;
      }
      if (isNaN(price) || price <= 0) {
        errors.push(`Строка ${i + 1}: некорректная цена "${values[priceIdx]}"`);
        continue;
      }

      const stock = stockIdx >= 0 ? parseInt(values[stockIdx]?.trim() || "0") : 0;
      const description =
        descIdx >= 0 ? values[descIdx]?.trim() || `Товар ${name}` : `Товар ${name}`;
      const category =
        categoryIdx >= 0 ? values[categoryIdx]?.trim() || "Другое" : "Другое";
      const images =
        imagesIdx >= 0
          ? (values[imagesIdx] || "")
              .split("|")
              .map((u) => u.trim())
              .filter(Boolean)
          : [];

      products.push({
        store_id: storeId,
        name: name.slice(0, 200),
        description: description.slice(0, 5000),
        price,
        stock: isNaN(stock) ? 0 : Math.max(0, stock),
        category,
        images,
      });
    }

    if (!products.length) {
      return NextResponse.json(
        { error: "Нет валидных товаров для импорта", details: errors },
        { status: 400 }
      );
    }

    // Вставляем батчами по 50
    let imported = 0;
    for (let i = 0; i < products.length; i += 50) {
      const batch = products.slice(i, i + 50);
      const { error } = await supabase
        .from("products")
        .insert(batch as never);
      if (error) {
        errors.push(`Батч ${Math.floor(i / 50) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    return NextResponse.json({
      imported,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Парсер CSV с поддержкой кавычек
function parseCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === separator) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
