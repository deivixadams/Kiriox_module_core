import { z } from "zod";

export const KirioxModuleManifestSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(3),
  version: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["active", "disabled", "experimental"]),
  capabilities: z.array(z.string()).default([]),
  requiredPermissions: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export type KirioxModuleManifestInput = z.infer<
  typeof KirioxModuleManifestSchema
>;
