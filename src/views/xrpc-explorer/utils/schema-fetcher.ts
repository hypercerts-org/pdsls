import { resolveLexiconAuthority, resolveLexiconSchema } from "../../../utils/api";
import { Nsid } from "@atcute/lexicons/syntax";

export interface MethodSchema {
  parameters?: any; // Lexicon parameters schema
  input?: any; // Lexicon input schema
  rawSchema?: any; // Full raw lexicon schema
}

const schemaCache = new Map<string, MethodSchema>();

export const fetchMethodSchema = async (methodName: string): Promise<MethodSchema | null> => {
  // Check cache first
  if (schemaCache.has(methodName)) {
    return schemaCache.get(methodName)!;
  }

  try {
    // Extract lexicon ID from method name (e.g., "com.atproto.repo.getRecord" -> "com.atproto.repo.getRecord")
    // For methods with fragments, handle them separately
    const lexiconId = methodName.split("#")[0] as Nsid;
    const defName = methodName.includes("#") ? methodName.split("#")[1] : "main";

    // Resolve authority and fetch schema
    const authority = await resolveLexiconAuthority(lexiconId);
    const schemaResult = await resolveLexiconSchema(authority as any, lexiconId);

    if (schemaResult?.rawSchema) {
      const raw = schemaResult.rawSchema as any;
      const def = raw.defs?.[defName];

      if (def) {
        const methodSchema: MethodSchema = {
          parameters: def.parameters,
          input: def.input,
          rawSchema: raw,
        };

        // Cache it
        schemaCache.set(methodName, methodSchema);
        return methodSchema;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch schema for ${methodName}:`, error);
  }

  return null;
};

