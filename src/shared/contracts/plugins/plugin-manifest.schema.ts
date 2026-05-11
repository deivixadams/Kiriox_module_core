import { z } from "zod";

export const KirioxPluginManifestSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(3),
  version: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["installed", "active", "disabled", "quarantined"]),
  permissions: z.array(z.string()).default([]),
  extensionPoints: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).optional(),
});

export type KirioxPluginManifestInput = z.infer<
  typeof KirioxPluginManifestSchema
>;
