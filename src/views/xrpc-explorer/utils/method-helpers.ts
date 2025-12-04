import { DiscoveredMethod, XrpcCallHistory } from "../types";

export const methodsFromHistory = (history: XrpcCallHistory[]): DiscoveredMethod[] => {
  const methodMap = new Map<string, DiscoveredMethod>();
  for (const item of history) {
    if (!methodMap.has(item.method)) {
      const parts = item.method.split(".");
      const namespace = parts.length >= 3 ? parts.slice(0, 3).join(".") : parts[0];
      // Infer auth requirement from history: if there was an error about auth, it likely requires auth
      // If the call succeeded without auth, it likely doesn't require auth
      const requiresAuth = item.error?.toLowerCase().includes("auth") ? true : undefined;
      methodMap.set(item.method, {
        name: item.method,
        type: item.input ? "procedure" : "query",
        namespace,
        requiresAuth,
      });
    }
  }
  return Array.from(methodMap.values());
};

export const allMethods = (
  discovered: DiscoveredMethod[],
  fromHistory: DiscoveredMethod[],
): DiscoveredMethod[] => {
  const methodMap = new Map<string, DiscoveredMethod>();

  // Add discovered methods first
  for (const method of discovered) {
    methodMap.set(method.name, method);
  }

  // Add methods from history (they override discovered if they exist)
  for (const method of fromHistory) {
    if (!methodMap.has(method.name)) {
      methodMap.set(method.name, method);
    }
  }

  return Array.from(methodMap.values());
};

export const filteredMethods = (all: DiscoveredMethod[], query: string): DiscoveredMethod[] => {
  if (!query) return all;
  const lowerQuery = query.toLowerCase();
  return all.filter(
    (m) =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.namespace.toLowerCase().includes(lowerQuery),
  );
};

export const methodsByNamespace = (
  methods: DiscoveredMethod[],
): Record<string, DiscoveredMethod[]> => {
  const grouped: Record<string, DiscoveredMethod[]> = {};
  for (const method of methods) {
    if (!grouped[method.namespace]) {
      grouped[method.namespace] = [];
    }
    grouped[method.namespace].push(method);
  }
  return grouped;
};

export const autocompleteSuggestions = (
  all: DiscoveredMethod[],
  input: string,
): DiscoveredMethod[] => {
  const lowerInput = input.toLowerCase().trim();
  if (!lowerInput || lowerInput.length < 2) return [];

  return all
    .filter(
      (m) =>
        m.name.toLowerCase().includes(lowerInput) ||
        m.description?.toLowerCase().includes(lowerInput) ||
        m.namespace.toLowerCase().includes(lowerInput),
    )
    .slice(0, 10); // Limit to 10 suggestions
};
