import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function formatRelative(date: Date | number): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}
