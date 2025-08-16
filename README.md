# DeepSoul — Astro + Telegram WebApp

Приложение астрологии в Telegram. Построение натальных карт, интерпретация с помощью ИИ.

## Особенности

- **Натальные карты**: расчёт планет, домов, аспектов
- **ИИ-интерпретация**: обзор карты через OpenAI GPT
- **Telegram WebApp**: нативная интеграция с Telegram
- **Адаптивный UI**: работает на всех устройствах
- **Веб-совместимость**: использует `astronomy-engine` для астрономических расчётов

## Пакеты

Основные зависимости: `astronomy-engine`, `openai`, `geo-tz`, `lru-cache`, `next`, `react`. 

## Быстрый старт

```bash
pnpm install
pnpm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## API

### POST `/api/chart`

Расчёт натальной карты.

**Запрос:**
```json
{
  "date": "1990-12-25",
  "time": "14:30", 
  "tzOffset": 3,
  "lat": 55.7558,
  "lon": 37.6176,
  "houseSystem": "P"
}
```

**Ответ:**
```json
{
  "ok": true,
  "chart": {
    "jdUT": 2448246.0,
    "planets": [...],
    "houses": {...},
    "bigThree": {...}
  }
}
```

### POST `/api/interpret`

ИИ-интерпретация карты.

**Запрос:**
```json
{
  "chart": { /* результат /api/chart */ }
}
```

**Ответ:**
```json
{
  "ok": true,
  "text": "Интерпретация астролога..."
}
```

### POST `/api/resolve`

Геокодинг места рождения.

## Архитектура

- **Framework**: Next.js 14 App Router
- **UI**: CSS Variables + Telegram Theme
- **Астрономия**: `astronomy-engine` (pure JavaScript)
- **ИИ**: OpenAI GPT-4o-mini
- **База данных**: файловая система (эфемериды)

## Астрологические вычисления

Приложение использует `astronomy-engine` - чистую JavaScript библиотеку для астрономических расчётов. Это обеспечивает совместимость с серверless-средами вроде Vercel без необходимости компиляции нативного кода.

**Возможности:**
- Расчёт положений планет (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto)
- Система домов Placidus (упрощённая реализация)
- Основные аспекты (conjunction, sextile, square, trine, opposition)
- Зодиакальные знаки

## Telegram WebApp

Интеграция с Telegram через Web App API:

- Viewport адаптация
- Тема интерфейса
- Тактильная обратная связь
- Навигация

## Переменные окружения

```bash
OPENAI_API_KEY=your_openai_key
```

## Развёртывание

Приложение готово для развёртывания на Vercel, Netlify и других serverless-платформах.

## Лицензия

MIT