// Configures the generated OpenAPI client: backend origin and cookie auth.
import { OpenAPI } from "@/api/generated";

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

OpenAPI.BASE = API_BASE;
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";
