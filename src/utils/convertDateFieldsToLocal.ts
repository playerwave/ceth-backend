import { formatTimeToLocal } from "./formatTimeToLocal";

export const convertDateFieldsToLocal = <T extends object>(data: T): T => {
  const converted: any = {};
  for (const [key, value] of Object.entries(data)) {
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
