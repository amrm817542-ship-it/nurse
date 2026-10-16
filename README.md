# رِفْق — منصة تعليم التمريض

تطبيق عربي يعمل على الويب وiOS وAndroid باستخدام Expo / React Native. يتضمن مساحة تعلّم للطلاب، ومساحات للمدرّسين ومشرفي المنصة، مع مصادقة وقاعدة بيانات عبر Supabase.

## التشغيل

```sh
npm install
npm run web
```

لتشغيل التطبيق على الهاتف:

```sh
npm start
```

ثم امسحي رمز QR بتطبيق Expo Go، أو استخدمي `npm run android` على جهاز/محاكي Android. يتطلب تشغيل iOS محليًا جهاز macOS.

## إعداد Supabase

1. أنشئي مشروعًا في Supabase.
2. انسخي `.env.example` إلى `.env` وضعي عنوان المشروع ومفتاحه العام (`publishable` أو `anon`) في `EXPO_PUBLIC_SUPABASE_URL` و`EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. نفّذي `supabase/schema.sql` في SQL Editor داخل مشروع Supabase.
4. أعيدي تشغيل Expo بعد تعديل متغيرات البيئة.
5. فعّلي تأكيد البريد الإلكتروني من إعدادات المصادقة في Supabase عند الحاجة.

لا تضعي مفتاح `service_role` أو أي سرّ إداري في التطبيق. التسجيل العام ينشئ حساب طالبة فقط. لمنح صلاحية مدرس أو مشرف، استخدمي لوحة SQL الموثوقة في Supabase بعد مراجعة عنوان البريد:

```sql
update public.profiles
set role = 'teacher'
where id = (
  select id from auth.users where email = 'teacher@example.com'
);
```

استبدلي `teacher` بـ `admin` لمنح صلاحية المشرف. لا يستطيع المستخدم تغيير دوره من التطبيق؛ كما تحمي سياسات RLS بيانات المقررات والدروس والتسجيل والتقدم.

## وضع العرض

إذا لم تُضبط متغيرات Supabase، تفتح المنصة بيانات عرض محلية للتجربة. هذه البيانات ليست محفوظة ولا تمثل حسابًا حقيقيًا. بمجرد ضبط Supabase، تنتقل المنصة إلى تسجيل الدخول الفعلي.
