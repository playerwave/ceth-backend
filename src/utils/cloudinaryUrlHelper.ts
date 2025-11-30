import cloudinary from './cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';

/**
 * แปลง Cloudinary URL ให้เป็น public URL หรือ signed URL
 * สำหรับไฟล์ที่อาจเป็น private
 */
export async function ensurePublicUrl(cloudinaryUrl: string): Promise<string> {
  try {
    // ✅ ถ้าไม่ใช่ Cloudinary URL ให้ส่งกลับไปตรงๆ
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
      return cloudinaryUrl;
    }

    // ✅ Extract public_id จาก URL
    // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{path}/{filename}
    const urlPattern = /res\.cloudinary\.com\/[^/]+\/([^/]+)\/upload\/(?:v\d+\/)?(.+)/;
    const match = cloudinaryUrl.match(urlPattern);
    
    if (!match) {
      console.warn("⚠️ [CloudinaryURLHelper] Cannot parse Cloudinary URL:", cloudinaryUrl);
      return cloudinaryUrl;
    }

    const [, resourceType, pathWithFile] = match;
    const publicId = pathWithFile.replace(/\.[^/.]+$/, ''); // ลบ extension

    console.log("🔍 [CloudinaryURLHelper] Extracted:", {
      resourceType,
      publicId,
      originalUrl: cloudinaryUrl
    });

    try {
      // ✅ ตรวจสอบ resource info
      const resourceInfo = await cloudinaryV2.api.resource(publicId, {
        resource_type: resourceType,
        type: 'upload'
      });

      console.log("✅ [CloudinaryURLHelper] Resource info:", {
        public_id: resourceInfo.public_id,
        access_mode: resourceInfo.access_mode,
        secure_url: resourceInfo.secure_url
      });

      // ✅ ถ้าไฟล์เป็น private ให้ลอง update เป็น public
      if (resourceInfo.access_mode === 'authenticated' || resourceInfo.access_mode === 'private') {
        console.log("⚠️ [CloudinaryURLHelper] File is private, attempting to make it public...");
        
        try {
          // ✅ Update access_mode เป็น public
          const updateResult = await cloudinaryV2.uploader.explicit(publicId, {
            resource_type: resourceType,
            type: 'upload',
            access_mode: 'public',
            invalidate: true
          });

          console.log("✅ [CloudinaryURLHelper] Successfully updated to public:", updateResult.secure_url);
          return updateResult.secure_url;
        } catch (updateError) {
          console.error("❌ [CloudinaryURLHelper] Failed to update access_mode:", updateError);
          // ✅ ถ้า update ไม่ได้ ให้ลองสร้าง signed URL
          return generateSignedUrl(cloudinaryUrl, resourceType);
        }
      }

      // ✅ ถ้าเป็น public อยู่แล้ว ให้ใช้ URL เดิม
      return resourceInfo.secure_url || cloudinaryUrl;
    } catch (apiError: any) {
      console.warn("⚠️ [CloudinaryURLHelper] API error (file may not exist or permission denied):", apiError.message);
      // ✅ ถ้า API ไม่สามารถเข้าถึงได้ ให้ลองใช้ signed URL
      return generateSignedUrl(cloudinaryUrl, resourceType);
    }
  } catch (error) {
    console.error("❌ [CloudinaryURLHelper] Error ensuring public URL:", error);
    return cloudinaryUrl; // ✅ Return original URL if all fails
  }
}

/**
 * สร้าง signed URL สำหรับไฟล์ private
 */
function generateSignedUrl(cloudinaryUrl: string, resourceType: string): string {
  try {
    // ✅ Extract public_id
    const urlPattern = /res\.cloudinary\.com\/[^/]+\/([^/]+)\/upload\/(?:v\d+\/)?(.+)/;
    const match = cloudinaryUrl.match(urlPattern);
    
    if (!match) {
      return cloudinaryUrl;
    }

    const [, , pathWithFile] = match;
    const publicId = pathWithFile.replace(/\.[^/.]+$/, '');

    // ✅ สร้าง signed URL
    const signedUrl = cloudinaryV2.utils.unsigned_upload_url(
      publicId,
      {
        resource_type: resourceType,
        type: 'upload'
      },
      {
        access_mode: 'public'
      }
    );

    // ✅ ถ้า signed URL ไม่ได้ ให้ใช้ URL เดิม
    return signedUrl || cloudinaryUrl;
  } catch (error) {
    console.error("❌ [CloudinaryURLHelper] Error generating signed URL:", error);
    return cloudinaryUrl;
  }
}

/**
 * แปลง URL ให้ใช้ https และ secure_url
 */
export function normalizeCloudinaryUrl(url: string): string {
  if (!url) return url;
  
  // ✅ แปลง http เป็น https
  url = url.replace(/^http:/, 'https:');
  
  // ✅ ถ้าเป็น Cloudinary URL ให้ใช้ secure_url format
  if (url.includes('cloudinary.com')) {
    // ✅ ลบ query parameters ที่อาจทำให้เกิดปัญหา
    const urlObj = new URL(url);
    urlObj.searchParams.delete('signature'); // ลบ signature เก่า (ถ้ามี)
    return urlObj.toString();
  }
  
  return url;
}

