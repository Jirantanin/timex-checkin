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
