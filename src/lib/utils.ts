import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "./api"; // Import backend URL

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an image URL. If it's a relative path (e.g. from local uploads),
 * it prepends the backend server URL. If it's absolute (http), it leaves it alone.
 */
export function getImageUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/assets/')) return path; // Skip frontend local assets

  // API_BASE_URL is usually 'http://localhost:3001/api'
  // We want 'http://localhost:3001' for static files
  const serverUrl = API_BASE_URL.replace(/\/api$/, '');
  return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

