# Fresh Framework Integration

Solana Trading Bot متوافق الآن تماماً مع Deno Deploy وإطار عمل Fresh.

## البناء والنشر

### التطوير المحلي

```bash
# تثبيت Deno
curl -fsSL https://deno.land/install.sh | sh

# إعداد ملف .env
cp .env.example .env
# عدّل .env بإدراج إعداداتك

# تشغيل البوت محلياً
deno run -A src/index.ts

# أو باستخدام مهمة البناء
deno task build
deno task preview
```

### Docker

```bash
# بناء صورة Docker
docker build -t solana-trading-bot .

# تشغيل الحاوية
docker run -p 8000:8000 --env-file .env solana-trading-bot
```

### Deno Deploy

1. ادفع مستودعك إلى GitHub
2. اذهب إلى [deno.com/deploy](https://deno.com/deploy)
3. أنشئ مشروع جديد وربطه بمستودعك على GitHub
4. عيّن نقطة الدخول إلى `src/index.ts`
5. اضبط متغيرات البيئة التالية (Secrets):
   - `PRIVATE_KEY`: مفتاح محفظتك الخاص
   - `RPC_ENDPOINT`: نقطة نهاية Solana RPC
   - `TRADE_SIZE_SOL`: مبلغ التداول (مثل 0.1)
   - `SLIPPAGE_BPS`: تحمل الانزلاق (مثل 50)
   - `MIN_PROFIT_USD`: حد الربح الأدنى (مثل 2)
   - `ENABLE_LIVE`: عيّن على "true" فقط بعد الاختبار
6. انشر المشروع

## مهام البناء

أوامر `deno task` المتاحة في deno.json:

```bash
deno task build   # بناء المشروع
deno task dev     # التطوير مع إعادة تحميل فوري
deno task preview # معاينة الإنتاج
deno task start   # تشغيل خادم الإنتاج
```

## الميزات الرئيسية

- ✅ بدء آمن بدون PRIVATE_KEY (يستخدم القيم الافتراضية)
- ✅ معالجة طلبات الإحماء (استجابة سريعة، لا تداول)
- ✅ تنفيذ معاملات ذري (كلا التداولين في معاملة واحدة)
- ✅ مرونة في الخطأ مع منطق إعادة المحاولة
- ✅ متوافق مع Deno Deploy (بدون تبعيات Node.js)
- ✅ جاهز لإطار عمل Fresh

## سلامة الإعدادات

وحدة `src/config.ts` تحمّل جميع الإعدادات من متغيرات البيئة مع قيم افتراضية معقولة.
هذا يمنع فشل البناء عندما لا تتوفر الأسرار.

## ملاحظات الأمان

- **PRIVATE_KEY**: لا تلتزم بمستودع التحكم بالإصدارات. استخدم Deno Deploy Secrets.
- **ENABLE_LIVE**: ابدأ بـ `false` وفعّل فقط بعد الاختبار الشامل على devnet.
- **RPC_ENDPOINT**: استخدم موفر RPC موثوق (انظر [helius.dev](https://helius.dev) أو [magic-eden.io](https://magic-eden.io))
