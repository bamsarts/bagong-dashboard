# FAQ System Setup - Bagong Bus Apps

## Overview
FAQ system menggunakan JSON file yang disimpan di MinIO CDN, bukan database. Ini memudahkan pengelolaan dan performa loading yang lebih cepat.

## File Structure

```
src/
├── pages/
│   ├── faq/
│   │   ├── index.js              # Public FAQ page
│   │   └── FAQ.module.scss       # FAQ styling
│   ├── api/
│   │   └── faq.js                # API endpoint untuk save ke MinIO
│   └── admin/
│       └── marketing-and-support/
│           └── cms-compro/
│               └── faq.js        # CMS Admin page untuk manage FAQ
└── faq-initial-data.json         # Initial data untuk upload ke MinIO
```

## Setup Instructions

### 1. Upload Initial Data ke MinIO

Upload file `faq-initial-data.json` ke MinIO bucket dengan nama `faq.json`:

**Menggunakan MinIO Console:**
- Login ke MinIO Console
- Pilih bucket yang sesuai (sesuai dengan `MINIO_BUCKET` di env)
- Upload file `faq-initial-data.json` dengan nama `faq.json`

**Atau menggunakan MinIO Client (mc):**
```bash
mc cp faq-initial-data.json your-minio-alias/your-bucket/faq.json
```

### 2. Environment Variables

Pastikan environment variables berikut sudah diset di `.env.local`:

```env
MINIO_ENDPOINT=https://your-minio-endpoint.com
MINIO_REGION=us-east-1
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=your-bucket-name
NEXT_PUBLIC_MINIO_BUCKET=https://cdn.your-domain.com
```

### 3. Access URLs

**Public FAQ Page:**
```
http://localhost:3000/faq
```

**Admin CMS Page:**
```
http://localhost:3000/admin/marketing-and-support/cms-compro/faq
```

## Features

### Public FAQ Page (`/faq`)
- Menampilkan FAQ berdasarkan kategori
- Tab navigation untuk switch antar kategori
- Accordion untuk expand/collapse jawaban
- Support untuk berbagai format jawaban:
  - Text biasa
  - HTML content
  - List items
  - Mixed content (kombinasi text dan list)
- Responsive design

### Admin CMS Page (`/admin/marketing-and-support/cms-compro/faq`)
- Tambah FAQ baru
- Edit FAQ existing
- Hapus FAQ
- Filter berdasarkan kategori
- Support 3 tipe jawaban:
  - **Text**: Jawaban teks biasa
  - **HTML**: Jawaban dengan HTML formatting
  - **List**: Jawaban berupa list (setiap baris = 1 item)
- Max height setting untuk scroll pada jawaban panjang

## FAQ Categories

1. **generalInfo** - Informasi Umum
2. **bagongApps** - Bagong Apps
3. **passengerBaggage** - Penumpang & Barang Bawaan
4. **payment** - Pembayaran
5. **baggage** - Bagasi

## Answer Types

### 1. Text (String)
```json
{
  "question": "Pertanyaan?",
  "answer": "Jawaban dalam bentuk text biasa",
  "maxHeight": null
}
```

### 2. HTML
```json
{
  "question": "Pertanyaan?",
  "answer": {
    "type": "html",
    "content": "Jawaban dengan <a href='#'>link</a> dan <b>formatting</b>"
  },
  "maxHeight": 200
}
```

### 3. List
```json
{
  "question": "Pertanyaan?",
  "answer": {
    "type": "list",
    "items": [
      "Item pertama",
      "Item kedua",
      "Item ketiga"
    ]
  },
  "maxHeight": null
}
```

### 4. Mixed (Text + List)
```json
{
  "question": "Pertanyaan?",
  "answer": {
    "type": "mixed",
    "content": [
      {
        "type": "text",
        "text": "Penjelasan:",
        "bold": true
      },
      {
        "type": "list",
        "items": ["Item 1", "Item 2"]
      }
    ]
  },
  "maxHeight": null
}
```

## How It Works

1. **Public Page** membaca data dari `${BUCKET}/faq.json`
2. **Admin CMS** membaca data yang sama
3. Saat admin save/update/delete, data dikirim ke API `/api/faq`
4. API menyimpan JSON ke MinIO menggunakan S3 SDK
5. Public page otomatis mendapat data terbaru (dengan cache busting `?t=${Date.now()}`)

## Advantages

✅ **Fast Loading**: JSON file lebih cepat dari database query  
✅ **CDN Ready**: File bisa di-cache di CDN  
✅ **Easy Backup**: Tinggal download JSON file  
✅ **Version Control**: Bisa track changes di git  
✅ **No Database**: Tidak perlu table tambahan  
✅ **Scalable**: MinIO bisa handle banyak request  

## Customization

### Menambah Kategori Baru

Edit di kedua file:
1. `src/pages/faq/index.js`
2. `src/pages/admin/marketing-and-support/cms-compro/faq.js`

Tambahkan di array `categories`:
```javascript
const categories = [
  // ... existing categories
  { key: 'newCategory', label: 'Kategori Baru' }
];
```

Dan di initial state:
```javascript
const [faqData, setFaqData] = useState({
  // ... existing categories
  newCategory: []
});
```

### Styling

Edit `src/pages/faq/FAQ.module.scss` untuk mengubah tampilan public page.

## Troubleshooting

**FAQ tidak muncul:**
- Cek apakah file `faq.json` sudah ada di MinIO
- Cek environment variable `NEXT_PUBLIC_MINIO_BUCKET`
- Cek browser console untuk error

**Tidak bisa save dari CMS:**
- Cek environment variables MinIO di server
- Cek permission MinIO bucket (harus allow write)
- Cek browser console dan server logs

**Data tidak update:**
- Clear browser cache
- Cek apakah file di MinIO sudah terupdate
- Pastikan cache busting (`?t=${Date.now()}`) berfungsi
