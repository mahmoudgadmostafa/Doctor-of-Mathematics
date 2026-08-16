# منصة معلم الرياضيات

## التشغيل محليًا
```bash
npm install
npm run dev
```
هيفتح على `http://localhost:5173`

## تجهيز حساب المعلم (مرة واحدة فقط)
النظام دلوقتي بيسجل أي حساب جديد كـ "طالب" تلقائيًا (من صفحة التسجيل). عشان تعمل حسابك كمعلم:

1. سجّل حساب عادي من صفحة `/register` (هيتحفظ كـ student)
2. من Firebase Console → Firestore Database → مجموعة `users` → افتح المستند بتاعك (بالـ uid بتاعك)
3. غيّر الحقل `role` من `"student"` إلى `"teacher"`
4. سجّل خروج ودخول تاني — هتلاقي نفسك اتوجهت لـ TeacherDashboard

## نشر قواعد الأمان
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # اختار مشروع math-teacher-platform
firebase deploy --only firestore:rules
```

## الخطوات الجاية
- بناء صفحة "إدارة الحصص المباشرة" (إنشاء/تعديل/حذف حصة)
- بناء صفحة "المكتبة" لرفع الفيديوهات وربطها بطلاب محددين (`student_content`)
- بناء صفحة "الطلاب" وملف كل طالب
- ربط بوابة دفع (Paymob/فوري) بالاشتراكات
