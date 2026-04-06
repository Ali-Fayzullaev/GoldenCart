-- ============================================
-- GoldenCart — Telegram-уведомления
-- Запустить ПОСЛЕ 001_initial.sql
-- ============================================

-- Добавляем поле telegram_chat_id в таблицу stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
