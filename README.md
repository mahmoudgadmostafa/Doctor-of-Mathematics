# منصة معلم الرياضيات

## التشغيل محليًا
```bash
npm install
npm run dev
```
هيفتح على `http://localhost:5173`

#:oard

## نشر قواعد الأمان
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # اختار مشروع math-teacher-platform
firebase deploy --only firestore:rules
```
