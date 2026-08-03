import { config } from "dotenv";
config({ path: ".env.local" });

import { PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

async function main() {
  const { getR2Client, R2_BUCKET } = await import("../src/lib/r2");
  if (!R2_BUCKET) {
    console.error("Falta R2_BUCKET_NAME en .env.local");
    process.exit(1);
  }
  const client = getR2Client();

  const cors = {
    CORSRules: [
      {
        AllowedOrigins: ["http://localhost:3000", "http://localhost:3001", "https://mundocelular.com", "https://*.vercel.app"],
        AllowedMethods: ["GET", "PUT", "DELETE", "HEAD", "POST"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["ETag", "Content-Length", "x-amz-*"],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  await client.send(new PutBucketCorsCommand({ Bucket: R2_BUCKET, CORSConfiguration: cors }));
  console.log(`CORS aplicado al bucket "${R2_BUCKET}"`);

  const actual = await client.send(new GetBucketCorsCommand({ Bucket: R2_BUCKET }));
  console.log("Política vigente:", JSON.stringify(actual.CORSRules, null, 2));
}

main().catch((err) => { console.error("Error configurando CORS:", err); process.exit(1); });
