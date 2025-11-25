// pages/api/upload.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

export const config = {
  api: { bodyParser: false }, // We'll handle the raw body ourselves
};

const s3 = new S3Client({
  region: process.env.MINIO_REGION || "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
});

function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0);
    req.on("data", (chunk) => {
      data = Buffer.concat([data, chunk]);
    });
    req.on("end", () => {
      try {
        const contentType = req.headers["content-type"];
        if (!contentType || !contentType.startsWith("multipart/form-data")) {
          return reject(new Error("Invalid content-type"));
        }
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (!boundaryMatch) {
          return reject(new Error("No boundary in content-type"));
        }
        const boundary = "--" + boundaryMatch[1];
        const parts = data
          .toString("binary")
          .split(boundary)
          .filter(
            (part) =>
              part.trim() &&
              part.trim() !== "--" &&
              part.trim() !== "--\r\n"
          );

        let file = null;
        let folder = null;
        for (const part of parts) {
          // Each part: headers + \r\n\r\n + body + \r\n
          const [rawHeaders, ...bodyArr] = part.split("\r\n\r\n");
          const body = bodyArr.join("\r\n\r\n");
          if (!rawHeaders) continue;
          const dispositionMatch = rawHeaders.match(
            /Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]*)")?/i
          );
          if (!dispositionMatch) continue;
          const name = dispositionMatch[1];
          const filename = dispositionMatch[2];
          if (filename) {
            // It's a file
            const contentTypeMatch = rawHeaders.match(
              /Content-Type: ([^\r\n;]+)/i
            );
            const contentType = contentTypeMatch
              ? contentTypeMatch[1]
              : "application/octet-stream";
            // Remove trailing \r\n if present
            let fileBuffer = Buffer.from(body, "binary");
            // Remove the last 2 bytes if they are \r\n
            if (
              fileBuffer.length >= 2 &&
              fileBuffer[fileBuffer.length - 2] === 13 &&
              fileBuffer[fileBuffer.length - 1] === 10
            ) {
              fileBuffer = fileBuffer.slice(0, fileBuffer.length - 2);
            }
            file = {
              name,
              filename,
              contentType,
              buffer: fileBuffer,
            };
            // Don't break, keep looking for folder field
          } else if (name === "folder") {
            // It's the folder field
            // Remove trailing \r\n if present
            let folderValue = body;
            if (
              folderValue.length >= 2 &&
              folderValue.charCodeAt(folderValue.length - 2) === 13 &&
              folderValue.charCodeAt(folderValue.length - 1) === 10
            ) {
              folderValue = folderValue.slice(0, folderValue.length - 2);
            }
            folder = folderValue;
          }
        }
        if (!file) {
          return reject(new Error("No file found in form data"));
        }
        resolve({ ...file, folder });
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}

export default async function handler(req, res) {


  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    let parsed;
    try {
      parsed = await parseMultipartFormData(req);
    } catch (err) {
      return res.status(400).json({ error: "Failed to parse form data: " + err.message });
    }
    const { filename, contentType, buffer, folder: rawFolder } = parsed;

    if (!buffer) {
      return res.status(400).json({ error: "No file" });
    }

    // Normalize folder (remove leading/trailing slashes)
    const folder = (rawFolder || "").replace(/^\/+|\/+$/g, "");
    const basePath = folder ? `/${folder}` : "";
    // Remove special characters from filename
    const sanitizedFilename = (filename || "upload.bin").replace(/[!@%.,]/g, "");
    const key = `${basePath}/${crypto.randomUUID()}-${sanitizedFilename}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return res.status(200).json({ key });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "upload error" });
  }
}
