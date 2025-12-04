import { Client, CredentialManager } from "@atcute/client";
import { agent } from "../../../components/login";
import { getPDS, resolveHandle } from "../../../utils/api";
import { DiscoveredMethod, XrpcMethodType } from "../types";

const LEXICON_SCHEMA_REPOS = ["atproto-lexicons.bsky.social", "bsky-lexicons.bsky.social"];

const CACHE_KEY = "xrpc-discovered-methods";

// Load cache from localStorage
function loadCache(): DiscoveredMethod[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.debug("Failed to load cache from localStorage:", error);
  }
  return null;
}

// Save cache to localStorage
function saveCache(methods: DiscoveredMethod[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(methods));
  } catch (error) {
    console.debug("Failed to save cache to localStorage:", error);
  }
}

function setupRpcClient(pdsUrl: string, authType: "none" | "pds" | "oauth"): Client {
  let handler;
  if (authType === "oauth" && agent()) {
    handler = agent() as any;
  } else {
    handler = new CredentialManager({ service: pdsUrl });
  }
  return new Client({ handler });
}

async function getServerDid(rpc: Client): Promise<string | null> {
  const serverRes = await rpc.get("com.atproto.server.describeServer", {});
  if (serverRes.ok && serverRes.data) {
    const serverDid = (serverRes.data as any).did;
    return serverDid || null;
  }
  return null;
}

function detectAuthRequirement(description?: string): boolean | undefined {
  if (!description) return undefined;

  const descLower = description.toLowerCase();
  if (descLower.includes("requires auth") || descLower.includes("requires authentication")) {
    return true;
  }
  if (
    descLower.includes("does not require auth") ||
    descLower.includes("does not require authentication")
  ) {
    return false;
  }
  return undefined;
}

function extractMethodsFromSchema(rawSchema: any): DiscoveredMethod[] {
  const methods: DiscoveredMethod[] = [];

  if (!rawSchema.defs) return methods;

  for (const [defName, def] of Object.entries(rawSchema.defs)) {
    if (
      !def ||
      typeof def !== "object" ||
      !("type" in def) ||
      (def.type !== "query" && def.type !== "procedure")
    ) {
      // Skip subscriptions, only process queries and procedures
      continue;
    }

    const methodName = defName === "main" ? rawSchema.id : `${rawSchema.id}#${defName}`;
    const namespace = rawSchema.id.split(".").slice(0, 3).join(".");
    const description = "description" in def ? (def.description as string) : undefined;
    const requiresAuth = detectAuthRequirement(description);

    const schema = {
      parameters: "parameters" in def ? def.parameters : undefined,
      input: "input" in def ? def.input : undefined,
    };

    methods.push({
      name: methodName,
      type: def.type as XrpcMethodType,
      description,
      namespace,
      requiresAuth,
      schema: schema.parameters || schema.input ? schema : undefined,
    });
  }

  return methods;
}

async function queryLexiconSchemaRecords(
  repoHandle: string,
  setCurrentNsid?: (nsid: string | null) => void,
): Promise<any[]> {
  const allRecords: any[] = [];
  let cursor: string | undefined = undefined;

  try {
    setCurrentNsid?.(`Resolving ${repoHandle}...`);
    // Resolve handle to DID
    const did = await resolveHandle(repoHandle as any);

    setCurrentNsid?.(`Finding PDS for ${repoHandle}...`);
    // Resolve DID to PDS
    const pdsUrl = await getPDS(did);

    setCurrentNsid?.(`Querying ${repoHandle}...`);
    // Create RPC client for this PDS (no auth needed for public repos)
    const rpc = new Client({ handler: new CredentialManager({ service: pdsUrl }) });

    while (true) {
      try {
        const res: any = await rpc.get("com.atproto.repo.listRecords", {
          params: {
            repo: did as any,
            collection: "com.atproto.lexicon.schema",
            limit: 100,
            cursor,
          },
        });

        if (!res.ok || !res.data?.records) {
          console.debug(`Failed to query ${repoHandle}:`, res.data?.error || "Unknown error");
          break;
        }

        allRecords.push(...res.data.records);

        if (!res.data.cursor || res.data.records.length < 100) {
          break;
        }

        cursor = res.data.cursor;
      } catch (error) {
        console.debug(`Error querying ${repoHandle}:`, error);
        break;
      }
    }
  } catch (error) {
    console.debug(`Error resolving ${repoHandle}:`, error);
  }

  return allRecords;
}

function extractMethodsFromRecords(
  records: any[],
  setCurrentNsid?: (nsid: string | null) => void,
  setDiscoveredMethods?: (methods: DiscoveredMethod[]) => void,
): DiscoveredMethod[] {
  const discovered: DiscoveredMethod[] = [];

  for (const record of records) {
    if (!record.value || typeof record.value !== "object" || !record.value.id) {
      continue;
    }

    const lexiconId = record.value.id;
    if (typeof lexiconId !== "string" || !lexiconId.includes(".")) {
      continue;
    }

    try {
      setCurrentNsid?.(`Processing ${lexiconId}...`);
      // Extract methods directly from the record value (which contains the full lexicon schema)
      const methods = extractMethodsFromSchema(record.value);
      discovered.push(...methods);

      // Update discovered methods incrementally for autocomplete
      if (setDiscoveredMethods) {
        setDiscoveredMethods([...discovered]);
      }
    } catch (err) {
      console.debug(`Failed to extract methods from ${lexiconId}:`, err);
    }
  }

  return discovered;
}

export const discoverMethodsFromServer = async (
  pdsUrl: string,
  authType: "none" | "pds" | "oauth",
  setDiscoveringMethods: (value: boolean) => void,
  setDiscoveredMethods: (methods: DiscoveredMethod[]) => void,
  setErrorData: (error: string | null) => void,
  setCurrentNsid?: (nsid: string | null) => void,
): Promise<void> => {
  if (!pdsUrl && authType !== "oauth") {
    setErrorData("Please set a PDS URL first");
    return;
  }

  // Check cache first (from localStorage)
  const cached = loadCache();
  if (cached) {
    setDiscoveredMethods(cached);
    setErrorData(null);
    return;
  }

  setDiscoveringMethods(true);
  setErrorData(null);

  try {
    const rpc = setupRpcClient(pdsUrl, authType);
    const serverDid = await getServerDid(rpc);

    if (!serverDid) {
      setErrorData("Server did not return a DID");
      return;
    }

    // Query lexicon schema records from both repos
    const allRecords: any[] = [];
    for (const repoHandle of LEXICON_SCHEMA_REPOS) {
      try {
        const records = await queryLexiconSchemaRecords(repoHandle, setCurrentNsid);
        allRecords.push(...records);
      } catch (error) {
        console.debug(`Failed to query ${repoHandle}:`, error);
        // Continue with other repos if one fails
      }
    }

    if (allRecords.length === 0) {
      setErrorData("No lexicon schemas found in repos");
      return;
    }

    // Extract methods directly from records (no need to resolve authorities or fetch schemas)
    const discovered = extractMethodsFromRecords(allRecords, setCurrentNsid, setDiscoveredMethods);

    // Final update (in case incremental updates were skipped)
    setDiscoveredMethods(discovered);
    setErrorData(null);

    // Cache the discovered methods in localStorage
    saveCache(discovered);
  } catch (error: any) {
    console.error("Failed to discover methods:", error);
    setErrorData(`Failed to discover methods: ${error.message}`);
  } finally {
    setCurrentNsid?.(null);
    setDiscoveringMethods(false);
  }
};
