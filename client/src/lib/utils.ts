import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function extractMessage(err: any): string {
  if (!err) return "Erreur inconnue";

  // Cas normal axios -> err.response.data.message
  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  // Cas fetch -> err.message = "400: {\"message\":\"...\"}"
  if (typeof err.message === "string") {
    // Essaye d'extraire le JSON après les deux-points
    const parts = err.message.split(":");
    const maybeJson = parts.slice(1).join(":").trim();

    try {
      const parsed = JSON.parse(maybeJson);
      if (parsed.message) return parsed.message;
    } catch {
      /* ignore si ce n'est pas du JSON */
    }
    return err.message;
  }

  return String(err);
}