import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.MINIO_REGION || "us-east-1",
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const jsonData = req.body

        if (!jsonData || !jsonData.faq) {
            return res.status(400).json({ error: 'Invalid data format' })
        }

        const jsonString = JSON.stringify(jsonData, null, 2)
        const buffer = Buffer.from(jsonString, 'utf-8')

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.MINIO_BUCKET,
                Key: '/faq.json',
                Body: buffer,
                ContentType: 'application/json',
                CacheControl: 'no-cache'
            })
        )

        return res.status(200).json({ success: true, message: 'FAQ saved successfully' })
    } catch (e) {
        console.error('Error saving FAQ:', e)
        return res.status(500).json({ error: e?.message || 'Failed to save FAQ' })
    }
}
