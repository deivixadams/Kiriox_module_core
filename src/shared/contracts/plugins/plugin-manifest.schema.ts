import { z } from "zod";
import {
  KIRIOX_PLUGIN_EXTENSION_POINTS,
  KIRIOX_PLUGIN_PERMISSIONS,
  KIRIOX_PLUGIN_STATUSES,
} from "./plugin.contract";

export const KirioxPluginManifestSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(3),
  version: z.string().min(1),
  description: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(KIRIOX_PLUGIN_STATUSES),
  permissions: z.array(z.enum(KIRIOX_PLUGIN_PERMISSIONS)).default([]),
  extensionPoints: z.array(z.enum(KIRIOX_PLUGIN_EXTENSION_POINTS)).default([]),
  dependencies: z.array(z.string()).optional(),
});

export type KirioxPluginManifestInput = z.infer<
  typeof KirioxPluginManifestSchema
>;
