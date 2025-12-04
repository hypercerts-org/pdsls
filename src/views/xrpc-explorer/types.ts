export type XrpcMethodType = "query" | "procedure" | "subscription";

export interface XrpcMethodInfo {
  name: string;
  type: XrpcMethodType;
  description?: string;
  parameters?: Record<
    string,
    {
      type: string;
      description?: string;
      required?: boolean;
    }
  >;
  inputSchema?: any;
  outputSchema?: any;
}

export interface XrpcCallHistory {
  method: string;
  timestamp: number;
  params?: any;
  input?: any;
  response?: any;
  error?: string;
}

export interface XrpcExplorerProps {
  pdsUrl?: string;
  repo?: string; // The repo DID to use for discovering lexicon schemas
}

export interface DiscoveredMethod {
  name: string;
  type: XrpcMethodType;
  description?: string;
  namespace: string;
  requiresAuth?: boolean; // Auto-detected from description
  schema?: {
    parameters?: any; // Lexicon parameters schema
    input?: any; // Lexicon input schema
  };
}
