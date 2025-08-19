# 📧 Email Template Preview System

ระบบสำหรับ preview email templates แบบ real-time โดยไม่ต้องส่งเมลจริง

## 🚀 การใช้งาน

### 1. Backend API Endpoints

#### GET `/api/email/templates`
- **Description**: ดึงรายการ templates ที่มีอยู่
- **Response**:
```json
{
  "success": true,
  "templates": ["OpenRegisterTemplate", "ReminderTemplate", "createActivityTemplate"],
  "count": 3
}
```

#### POST `/api/email/preview`
- **Description**: Preview template ด้วยข้อมูลที่กำหนด
- **Body**:
```json
{
  "templateName": "OpenRegisterTemplate",
  "data": {
    "name": "สมชาย ใจดี",
    "message": "ข้อความเพิ่มเติม",
    "activityName": "Workshop การพัฒนาทักษะ",
    "activityDate": "20 ธันวาคม 2024",
    "activityTime": "09:00 - 16:00",
    "activityLocation": "ห้องประชุม 301",
    "maxParticipants": "30",
    "registrationLink": "https://example.com/register",
    "deadline": "15 ธันวาคม 2024",
    "contactEmail": "activity@buu.ac.th"
  }
}
```

### 2. Frontend Interface

เข้าใช้งานที่: `http://localhost:5173/email-template-preview`

#### ฟีเจอร์:
- ✅ เลือก template จากรายการที่มีอยู่
- ✅ แก้ไขข้อมูล template แบบ real-time
- ✅ Preview HTML ที่ render แล้ว
- ✅ แสดง HTML source code
- ✅ รองรับข้อมูลหลากหลาย

### 3. Templates ที่มีอยู่

#### OpenRegisterTemplate.ejs
- **Purpose**: แจ้งเตือนกิจกรรมเปิดรับสมัคร
- **Variables**:
  - `name`: ชื่อผู้รับ
  - `message`: ข้อความเพิ่มเติม
  - `activityName`: ชื่อกิจกรรม
  - `activityDate`: วันที่กิจกรรม
  - `activityTime`: เวลากิจกรรม
  - `activityLocation`: สถานที่
  - `maxParticipants`: จำนวนที่รับ
  - `registrationLink`: ลิงก์ลงทะเบียน
  - `deadline`: วันหมดเขต
  - `contactEmail`: อีเมลติดต่อ

#### ReminderTemplate.ejs
- **Purpose**: เตือนกิจกรรมพรุ่งนี้
- **Variables**:
  - `name`: ชื่อผู้รับ
  - `message`: ข้อความเพิ่มเติม
  - `activityName`: ชื่อกิจกรรม
  - `activityDate`: วันที่กิจกรรม
  - `activityTime`: เวลากิจกรรม
  - `activityLocation`: สถานที่
  - `requirements`: สิ่งที่ต้องเตรียม
  - `activityLink`: ลิงก์ดูรายละเอียด
  - `contactEmail`: อีเมลติดต่อ

### 4. การเพิ่ม Template ใหม่

1. สร้างไฟล์ `.ejs` ใน `src/mailer/template/`
2. ใช้ EJS syntax: `<%= variableName %>`
3. ระบบจะ auto-detect template ใหม่

### 5. ตัวอย่างการใช้งาน

```bash
# 1. Start backend
cd ceth-backend
npm run dev

# 2. Start frontend
cd ceth-frontend
npm run dev

# 3. เข้าใช้งาน
# http://localhost:5173/email-template-preview
```

### 6. ข้อดีของระบบ

- ✅ **Real-time Preview**: เห็นผลลัพธ์ทันที
- ✅ **No Email Sending**: ไม่ต้องส่งเมลจริง
- ✅ **Multiple Templates**: รองรับหลาย template
- ✅ **Flexible Data**: ข้อมูลปรับเปลี่ยนได้
- ✅ **HTML Source**: เห็น source code
- ✅ **Responsive Design**: ใช้งานได้ทุกอุปกรณ์

### 7. การ Debug

หากมีปัญหา:
1. ตรวจสอบ console logs
2. ตรวจสอบ network requests
3. ตรวจสอบ template syntax
4. ตรวจสอบ file permissions

### 8. Security Notes

- ระบบนี้ใช้สำหรับ development/testing เท่านั้น
- ไม่ควรเปิดใช้งานใน production
- ข้อมูลที่ส่งเป็น mock data
- ไม่มีการส่งเมลจริง

