import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = "project-matchmaker"): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_API_KEY) {
      // Mock upload for local environment where Cloudinary vars are not set
      console.warn("Cloudinary environment variables not set. Using local mock upload.");
      const mockUrl = `https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg`;
      resolve(mockUrl);
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}
