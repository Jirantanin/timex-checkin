# TimeX Check-in Automation

ระบบเช็คอิน TimeX อัตโนมัติด้วย GitHub Actions — รันเองทุกวันจันทร์-ศุกร์ 09:40 แล้วส่ง notification ไป Telegram

## วิธีตั้ง Secrets บน GitHub

ไปที่ **Settings → Secrets and variables → Actions** ของ repo:

| Secret Name | คำอธิบาย |
|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Token ของ bot ที่จะส่ง notification |
| `TELEGRAM_CHAT_ID` | Chat ID ที่จะรับ notification |
| `EMPLOYEE_ID` | รหัสพนักงาน TimeX |
| `PASSWORD` | รหัสผ่าน TimeX |
| `SECRET_KEY` | Secret key สำหรับ OTP |
| `LOCATION_LAT` | ละติจูดสถานที่เช็คอิน |
| `LOCATION_LNG` | ลองจิจูดสถานที่เช็คอิน |
| `LOCATION_NAME` | ชื่อสถานที่เช็คอิน |

### วิธีได้ Telegram Bot Token
1. ไปที่ **@BotFather** บน Telegram
2. ส่ง `/newbot` แล้วตั้งชื่อ bot
3. จะได้ token ประมาณ `123456789:ABCdef...`

### วิธีได้ Telegram Chat ID
1. เปิด chat กับ bot ที่สร้าง แล้วส่งข้อความอะไรก็ได้ไป
2. เรียก API:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
3. ใน response จะเห็น `"id": 123456789` — นั่นคือ Chat ID ของตัวเอง

## วิธีรัน

### Auto (GitHub Actions)
Workflow รันอัตโนมัติทุกวันจันทร์-ศุกร์ **09:40** (เวลาไทย)  
ดูได้ที่ tab **Actions** ของ repo

### Manual
ไปที่ **Actions → TimeX Check-in → Run workflow**

## ไฟล์สำคัญ

| ไฟล์ | คำอธิบาย |
|------|----------|
| `checkin.js` | Script หลักสำหรับเช็คอิน |
| `.github/workflows/checkin.yml` | GitHub Actions workflow |
