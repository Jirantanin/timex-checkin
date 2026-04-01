# TimeX API Server

API server สำหรับเช็คอิน TimeX อัตโนมัติ — deploy บน Railway ได้เลย

## Deploy on Railway

1. Fork repo นี้ไป GitHub
2. ไปที่ [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. เลือก repo
4. Set environment variables (ดูใน GitHub repo → Settings → Secrets):
   - `EMPLOYEE_ID`
   - `PASSWORD`
   - `SECRET_KEY`
   - `LOCATION_LAT`
   - `LOCATION_LNG`
   - `LOCATION_NAME`
5. Deploy — เสร็จแล้วจะได้ URL เช่น `https://timex-api.up.railway.app`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/checkin` | เช็คอิน |
| POST | `/checkout` | เช็คเอาต์ |
| POST | `/history` | ดูประวัติเดือนนี้ |

## ใช้งาน

```bash
# เช็คอิน
curl -X POST https://your-railway-app.railway.app/checkin

# เช็คเอาต์
curl -X POST https://your-railway-app.railway.app/checkout

# ดูประวัติ
curl -X POST https://your-railway-app.railway.app/history
```

## GitHub Actions Cron

ตั้งเวลาให้รันทุกวันจันทร์-ศุกร์ 09:40 — workflow อยู่ที่ `.github/workflows/checkin.yml`

ต้องตั้ง Secrets บน GitHub:
- `TELEGRAM_BOT_TOKEN` — bot token สำหรับส่ง notification
- `TELEGRAM_CHAT_ID` — chat ID ที่จะรับ noti
- `EMPLOYEE_ID`, `PASSWORD`, `SECRET_KEY` — ข้อมูล TimeX
- `LOCATION_LAT`, `LOCATION_LNG`, `LOCATION_NAME` — พิกัดสถานที่
