# 🧪 การทดสอบระบบ Check-in/Check-out

## 📋 ข้อมูลทดสอบ

### นักเรียนทดสอบ:
- **Username:** `65160169`
- **Password:** `1234`
- **ชื่อ:** ทดสอบ นักเรียน

### กิจกรรมทดสอบ:
- **Activity ID:** `1`
- **ชื่อ:** test activity 1
- **รูปแบบ:** Onsite
- **สถานะ:** Open Register

## 🚀 ขั้นตอนการทดสอบ

### 1. รัน SQL Scripts
```bash
# รัน script สร้างข้อมูลนักเรียน
psql -d your_database -f create-test-student.sql

# รัน script สร้างข้อมูลกิจกรรม
psql -d your_database -f create-test-activity.sql
```

### 2. เริ่มต้น Backend
```bash
cd ceth-backend
npm run dev
```

### 3. เริ่มต้น Frontend
```bash
cd ceth-frontend
npm run dev
```

### 4. ทดสอบระบบ
1. ไปที่ URL: `http://localhost:5173/qr-activity-checkinout-student/1`
2. กรอกข้อมูล:
   - รหัสนิสิต: `65160169`
   - รหัสผ่าน: `1234`
3. กดปุ่ม "ลงทะเบียนเข้าร่วมกิจกรรม"

## ✅ ผลลัพธ์ที่คาดหวัง

### กรณีสำเร็จ:
- แสดงข้อความ: "ลงทะเบียนเข้าร่วมกิจกรรมสำเร็จ!"
- `time_in` ในตาราง `activity_detail` จะถูกอัพเดทเป็นเวลาปัจจุบัน

### กรณีล้มเหลว:
- แสดงข้อความ error ที่เหมาะสม เช่น:
  - "รหัสนิสิตหรือรหัสผ่านไม่ถูกต้อง"
  - "คุณยังไม่ได้ลงทะเบียนกิจกรรมนี้"
  - "คุณได้ลงทะเบียนเข้าร่วมกิจกรรมนี้แล้ว"

## 🔍 การตรวจสอบในฐานข้อมูล

### ตรวจสอบการ Check-in:
```sql
SELECT 
    a.activity_name,
    ad.time_in,
    ad.time_out,
    ad.status,
    s.first_name,
    s.last_name,
    u.username
FROM activity a
JOIN activity_detail ad ON a.activity_id = ad.activity_id
JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
JOIN students s ON j.students_id = s.students_id
JOIN users u ON s.users_id = u.users_id
WHERE a.activity_id = 1;
```

## 🐛 การแก้ไขปัญหา

### ปัญหา: "รหัสนิสิตหรือรหัสผ่านไม่ถูกต้อง"
**สาเหตุ:** ข้อมูลนักเรียนไม่มีในฐานข้อมูล
**วิธีแก้:** รัน `create-test-student.sql`

### ปัญหา: "คุณยังไม่ได้ลงทะเบียนกิจกรรมนี้"
**สาเหตุ:** นักเรียนยังไม่ได้ลงทะเบียนกิจกรรม
**วิธีแก้:** รัน `create-test-activity.sql`

### ปัญหา: "คุณได้ลงทะเบียนเข้าร่วมกิจกรรมนี้แล้ว"
**สาเหตุ:** นักเรียนได้ check-in แล้ว
**วิธีแก้:** รีเซ็ต `time_in` เป็น NULL:
```sql
UPDATE activity_detail 
SET time_in = NULL 
WHERE activity_detail_id = (
    SELECT ad.activity_detail_id 
    FROM activity_detail ad
    JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
    JOIN students s ON j.students_id = s.students_id
    JOIN users u ON s.users_id = u.users_id
    WHERE u.username = '65160169' AND ad.activity_id = 1
);
```

## 📝 บันทึกการทดสอบ

| วันที่ | เวลา | ผลลัพธ์ | หมายเหตุ |
|--------|------|---------|----------|
| - | - | - | - |
