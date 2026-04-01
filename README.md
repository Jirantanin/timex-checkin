# TimeX Check-in Automation

ระบบเช็คอิน/เช็คเอาต์ TimeX อัตโนมัติด้วย GitHub Actions — รันเองทุกวันจันทร์-ศุกร์ แล้วส่ง notification ไป Telegram

## เวลาทำงาน

| Event | เวลา (ไทย) |
|-------|-----------|
| Check-in | 09:40 จันทร์-ศุกร์ |
| Check-out | 18:40 จันทร์-ศุกร์ |

## วิธีตั้ง Secrets บน GitHub

ไปที่ **Settings → Secrets and variables → Actions** ของ repo:

| Secret Name | คำอธิบาย |
|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Token ของ bot ที่จะส่ง notification |
| `TELEGRAM_CHAT_ID` | Chat ID ที่จะรับ notification |
| `EMPLOYEE_ID` | รหัสพนักงาน TimeX |
| `PASSWORD` | รหัสผ่าน TimeX |
| `SECRET_KEY` | Secret key สำหรับ OTP |
| `LOCATION_LAT` | ละติจูดสถานที่เช็คอิน/เช็คเอาต์ |
| `LOCATION_LNG` | ลองจิจูดสถานที่เช็คอิน/เช็คเอาต์ |
| `LOCATION_NAME` | ชื่อสถานที่เช็คอิน/เช็คเอาต์ |

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
รันอัตโนมัติตามตารางด้านบน ดูได้ที่ tab **Actions**

### Manual
ไปที่ **Actions → TimeX Check-in / TimeX Check-out → Run workflow**

## ไฟล์สำคัญ

| ไฟล์ | คำอธิบาย |
|------|----------|
| `checkin.js` | Script เช็คอิน |
| `checkout.js` | Script เช็คเอาต์ |
| `.github/workflows/checkin.yml` | Workflow เช็คอิน (09:40) |
| `.github/workflows/checkout.yml` | Workflow เช็คเอาต์ (18:40) |
