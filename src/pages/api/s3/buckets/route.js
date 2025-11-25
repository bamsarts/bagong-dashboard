import { s3 } from '../env'
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  const { bucket, prefix, continuationToken } = req.query;
  const Bucket = bucket || "damri";
  const Prefix = prefix || undefined;
  const ContinuationToken = continuationToken || undefined;

  if (!Bucket) {
    return res.status(400).json({ error: "bucket is required" });
  }

  try {
    const data = await s3.send(
      new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken, MaxKeys: 1000 })
    );

    // Sort objects by LastModified date (latest first)
    const sortedObjects = (data.Contents || []).sort((a, b) =>
      new Date(b.LastModified) - new Date(a.LastModified)
    );

    return res.status(200).json({
      objects: sortedObjects,
      isTruncated: data.IsTruncated || false,
      nextContinuationToken: data.NextContinuationToken || null,
      keyCount: data.KeyCount || 0,
      prefix: data.Prefix || Prefix || "",
    })

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || "bucket error" });
  }
}