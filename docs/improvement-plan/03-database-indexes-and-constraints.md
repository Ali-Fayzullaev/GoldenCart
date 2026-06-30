# Шаг 3: Индексы и ревизия схемы БД

## Проблема

14 миграций в `supabase/migrations/` росли реактивно — почти половина
(`003_telegram.sql`, `011_low_stock_threshold.sql`, `012_card_style.sql`,
`014_product_extra_fields.sql`) это однострочные `ALTER TABLE ... ADD COLUMN`
без пересмотра индексов/ограничений. В результате:

1. **Нет индексов на часто фильтруемые внешние ключи**:
   - `products.store_id` — фильтруется на каждой загрузке витрины и дашборда
     товаров (`use-products.ts`).
   - `orders.customer_id` — фильтруется на каждой загрузке истории заказов
     покупателя (`use-orders.ts: useCustomerOrders`).
   - `reviews.product_id` — используется при агрегации рейтинга на каждой
     карточке товара.
   - `wishlist.customer_id` / `wishlist.product_id`.

   Сейчас это не страшно при маленьких объёмах данных, но с ростом числа
   товаров/заказов в одном магазине запросы начнут деградировать (full scan).

2. **JSONB-колонки без валидации**: `products.variants`,
   `store_pages.blocks` — это сырой JSONB без `CHECK`-ограничений или схемы.
   Невалидные данные (например, вариант без `prices`) могут попасть в БД и
   уронить рендер на клиенте.

3. **`card_style` (миграция 012)** — `TEXT NOT NULL DEFAULT 'standard'` без
   `CHECK (card_style IN (...))`. Фронтенд знает 4 стиля (standard, compact,
   elegant, minimal) — в БД это никак не закреплено, опечатка в коде запишет
   невалидное значение и витрина тихо откатится на дефолтный рендер.

4. **Нет soft delete** — товары/заказы/отзывы удаляются физически
   (`DELETE`), `is_active`-флаги скрывают товар от витрины, но не сохраняют
   историю. Если продавец удалит товар, по которому были заказы — у заказа
   останется `order_items.product_id`, ссылающийся в никуда (если FK
   `ON DELETE CASCADE`, то и сам order_item исчезнет, и в истории заказа
   потеряется позиция — стоит проверить поведение `ON DELETE` для
   `order_items.product_id`).

## Почему это важно

Это классический технический долг, который не болит на старте, но дорого
стоит при росте: деградация производительности запросов, риск рассинхрона
данных, невозможность восстановить историю при случайном удалении.

## Что сделать

1. Добавить новую миграцию `015_indexes.sql` с индексами:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
   CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
   CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
   CREATE INDEX IF NOT EXISTS idx_wishlist_customer_id ON wishlist(customer_id);
   CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
   ```
   (сверить точные имена таблиц/колонок с актуальной схемой перед написанием).
2. Проверить `ON DELETE` поведение для `order_items.product_id` —
   при удалении товара заказ не должен терять данные о том, что было куплено.
   Рекомендуемый паттерн: хранить в `order_items` денормализованные `name`,
   `price_at_time` (уже есть) и сделать `product_id` `ON DELETE SET NULL`
   вместо `CASCADE`, чтобы позиция заказа сохранялась даже после удаления
   товара.
3. Добавить `CHECK` на `store_settings.card_style`:
   ```sql
   ALTER TABLE store_settings
     ADD CONSTRAINT card_style_valid
     CHECK (card_style IN ('standard','compact','elegant','minimal'));
   ```
4. Для `products.variants` и `store_pages.blocks` — как минимум добавить
   валидацию на уровне Zod (`lib/validations.ts`) перед записью, если полная
   JSON-схема в Postgres избыточна для масштаба проекта.
5. Рассмотреть `deleted_at TIMESTAMPTZ` на `products`/`orders` вместо
   физического удаления (опционально, если бизнес-требование появится).

## Критерий готовности (DoD)

- [ ] Новая миграция с индексами применена и закоммичена.
- [ ] Удаление товара с существующими заказами не ломает историю заказов
      продавца/покупателя (проверено вручную).
- [ ] `card_style` защищён `CHECK`-constraint.
- [ ] `EXPLAIN ANALYZE` на ключевых запросах (список товаров магазина, заказы
      покупателя) показывает использование индекса, а не seq scan.
