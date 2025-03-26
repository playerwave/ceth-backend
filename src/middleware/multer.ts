import multer from "multer";
import { CloudinaryStorage } from "@fluidjs/multer-cloudinary";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "your_folder_name",
    allowed_formats: ["jpg", "png", "jpeg"],
    // ลบ public_id ออกเพื่อให้ Cloudinary สร้างชื่อไฟล์ให้อัตโนมัติ
  },
});

const upload = multer({ storage });

export default upload;
