# turath-gpt-proxy

Proxy ذكي بين GPT Actions و Turath API يمنع إعادة الفهرس الكامل، ويحصر الاستجابات في نتائج صغيرة ومفلترة مناسبة لحدود GPT Actions.

## لماذا نحتاج Proxy؟

بعض الكتب عبر `/book?include=indexes` تُرجع فهرسًا ضخمًا يتجاوز حد أدوات GPT. هذا المشروع يحمل الفهرس داخليًا في السيرفر مع cache ثم يوفّر:
- نظرة عامة (`top`)
- بحث داخل الفهرس (`index/search`)
- تصفح تدريجي (`index/chunk`)
- نافذة السياق حول صفحة (`index/window`)

بدون إرجاع الفهرس الكامل أبدًا.

## المتطلبات

- Node.js >= 22
- npm

## التشغيل

```bash
npm install
npm run dev
```

## متغيرات البيئة

انسخ `.env.example` ثم عدّل القيم عند الحاجة.

## أهم Endpoints

- `GET /health`
- `GET /books/search?q=...&limit=10`
- `GET /search/text?q=...&book_id=...&page=1&limit=10`
- `GET /books/{book_id}/pages/{page}`
- `GET /books/{book_id}/index/top?max_level=1&limit=50`
- `GET /books/{book_id}/index/search?q=...&limit=10`
- `GET /books/{book_id}/index/chunk?offset=0&limit=50`
- `GET /books/{book_id}/index/window?page=120&before=5&after=5`
- `GET /authors/{author_id}`

## أمثلة curl

```bash
curl "http://localhost:3000/health"
curl "http://localhost:3000/books/search?q=الجواب%20الصحيح%20لمن%20بدل%20دين%20المسيح"
curl "http://localhost:3000/books/170/index/top?max_level=1&limit=30"
curl "http://localhost:3000/books/170/index/search?q=المسيح&limit=10"
curl "http://localhost:3000/books/170/index/chunk?offset=0&limit=50"
curl "http://localhost:3000/books/170/index/window?page=120"
curl "http://localhost:3000/search/text?q=المسيح&book_id=170&page=1"
```

## ربطه مع GPT Actions

1. شغّل السيرفر على عنوان قابل للوصول من GPT Actions.
2. استعمل ملف OpenAPI الموجود في:
   - `src/openapi/openapi.yaml`
3. أضف تعليمات GPT من:
   - `prompts/gpt-instructions.md`

## الاختبارات

```bash
npm test
```
