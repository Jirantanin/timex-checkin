# TimeX API Server

API server สำหรับเช็คอิน TimeX อัตโนมัติ — deploy บน Railway ได้เลย

## Deploy on Railway

1. Fork repo นี้ไป GitHub
2. ไปที่ [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. เลือก repo
4. Set environment variables:
   - `EMPLOYEE_ID` = `61019`
   - `PASSWORD` = `N@029ii2`
   - `SECRET_KEY` = `FOPVPLL3QRLSSA2Q`
   - `LOCATION_LAT` = `13.79177234`
   - `LOCATION_LNG` = `100.57600597`
   - `LOCATION_NAME` = `รัชดาภิเษก 20`
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

ตั้งเวลาให้รันทุกวันจันทร์-ศุกร์ 09:40:

```yaml
# .github/workflows/checkin.yml
name: TimeX Check-in
on:
  schedule:
    - cron: '40 9 * * 1-5'  # 09:40 Mon-Fri
  workflow_dispatch:  # กดรันมือได้ด้วย
jobs:
  checkin:
    runs-on: ubuntu-latest
    steps:
      - name: Check-in
        run: |
          curl -X POST ${{ secrets.TIMEX_API_URL }}/checkin
```

Set `TIMEX_API_URL` เป็น Secrets ใน GitHub repo settings
