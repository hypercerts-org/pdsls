import { XrpcMethodInfo } from "../types";

export const parseMethodInfo = (method: string): XrpcMethodInfo => {
  // This would be enhanced with actual lexicon schema resolution
  // For now, we'll use a simple pattern-based approach
  if (
    method.includes(".get") ||
    method.endsWith("Query") ||
    method.includes("list") ||
    method.includes("describe")
  ) {
    return {
      name: method,
      type: "query",
      description: `Query method: ${method}`,
      parameters: {
        limit: {
          type: "number",
          description: "Maximum number of items to return",
          required: false,
        },
        cursor: { type: "string", description: "Pagination cursor", required: false },
      },
    };
  } else if (
    method.includes(".create") ||
    method.includes(".update") ||
    method.includes(".put") ||
    method.includes(".delete")
  ) {
    return {
      name: method,
      type: "procedure",
      description: `Procedure method: ${method}`,
      inputSchema: {
        type: "object",
        properties: {
          // Generic properties that would be enhanced with schema resolution
          record: { type: "object", description: "The record to create/update" },
          collection: { type: "string", description: "Collection name" },
        },
      },
    };
  } else {
    return {
      name: method,
      type: "query", // default
      description: `XRPC method: ${method}`,
    };
  }
};

