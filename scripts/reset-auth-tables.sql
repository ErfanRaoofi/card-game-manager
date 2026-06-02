-- بعد از تغییر ساختار users (لاگین + password + role) این اسکریپت را یک‌بار اجرا کنید.
-- اتاق‌ها (rooms) حفظ می‌شوند؛ فقط کاربران و عضویت اتاق پاک می‌شود.
-- اولین ثبت‌نام بعد از ریست = نقش admin

DROP TABLE IF EXISTS room_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- اگر فقط ستون role اضافه نشده (بدون حذف کاربران):
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(16) NOT NULL DEFAULT 'player';
-- UPDATE users SET role = 'admin' WHERE username = 'YOUR_ADMIN_USERNAME';
