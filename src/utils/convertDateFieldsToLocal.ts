import { formatTimeToLocal } from "./formatTimeToLocal";

export const convertDateFieldsToLocal = <T extends object>(data: T): T => {
  const converted: any = {};

  // ✅ รายการ field ที่ไม่ควรแปลงเป็นวันที่
  const excludeFields = [
    "activity_name",
    "presenter_company_name",
    "description",
    "image_url",
    "url",
    "type",
    "event_format",
    "activity_status",
    "activity_state",
    "status",
  ];

  for (const [key, value] of Object.entries(data)) {
    // ✅ ข้าม field ที่ไม่ควรแปลงเป็นวันที่
    if (excludeFields.includes(key)) {
      converted[key] = value;
      continue;
    }

    if (typeof value === "string" || value instanceof Date) {
      const dateVal = new Date(value);
      if (!isNaN(dateVal.getTime())) {
        converted[key] = formatTimeToLocal(value);
        continue;
      }
    }
    converted[key] = value;
  }
  return converted;
};
