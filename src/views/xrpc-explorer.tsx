import { useLocation, useParams } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Button } from "../components/button";
import { CopyMenu, DropdownMenu, MenuProvider, NavMenu } from "../components/dropdown";
import { agent } from "../components/login";
import { resolvePDS } from "../utils/api";
import { HistorySection } from "./xrpc-explorer/components/history-section";
import { MethodInput } from "./xrpc-explorer/components/method-input";
import { MethodReference } from "./xrpc-explorer/components/method-reference";
import { RequestData } from "./xrpc-explorer/components/request-data";
import { ResponseSection } from "./xrpc-explorer/components/response-section";
import type {
  DiscoveredMethod,
  XrpcCallHistory,
  XrpcExplorerProps,
  XrpcMethodInfo,
  XrpcMethodType,
} from "./xrpc-explorer/types";
import { discoverMethodsFromServer } from "./xrpc-explorer/utils/method-discovery";
import {
  allMethods as getAllMethods,
  methodsFromHistory,
} from "./xrpc-explorer/utils/method-helpers";
import { fetchMethodSchema } from "./xrpc-explorer/utils/schema-fetcher";
import { callXrpcMethod } from "./xrpc-explorer/utils/xrpc-caller";

export const XrpcExplorer = (props?: XrpcExplorerProps) => {
  const params = useParams();
  const location = useLocation();
  const [methodInput, setMethodInput] = createSignal<string>("");
  const [methodType, setMethodType] = createSignal<XrpcMethodType>("query");
  const [requestData, setRequestData] = createSignal<string>("{}");
  const [responseData, setResponseData] = createSignal<any>(null);
  const [errorData, setErrorData] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [history, setHistory] = createStore<XrpcCallHistory[]>([]);
  const [methodInfo, setMethodInfo] = createSignal<XrpcMethodInfo | null>(null);
  const [methodSchema, setMethodSchema] = createSignal<any>(null);
  const [schemaFetched, setSchemaFetched] = createSignal<boolean>(false);
  const [pdsUrl, setPdsUrl] = createSignal<string>(props?.pdsUrl || "");
  const [authType, setAuthType] = createSignal<"none" | "pds" | "oauth">("none");
  const [expandedSections, setExpandedSections] = createStore<Record<string, boolean>>({});
  const [showMethodBrowser, setShowMethodBrowser] = createSignal<boolean>(false);
  const [methodSearchQuery, setMethodSearchQuery] = createSignal<string>("");
  const [showAutocomplete, setShowAutocomplete] = createSignal<boolean>(false);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = createSignal<number>(-1);
  const [discoveredMethods, setDiscoveredMethods] = createSignal<DiscoveredMethod[]>([]);
  const [discoveringMethods, setDiscoveringMethods] = createSignal<boolean>(false);
  const [currentNsid, setCurrentNsid] = createSignal<string | null>(null);
  const [authWarning, setAuthWarning] = createSignal<string | null>(null);

  // Initialize with current PDS if available and auto-discover methods
  createEffect(async () => {
    if (props?.pdsUrl) {
      setPdsUrl(props.pdsUrl);
      // Auto-discover methods when PDS is provided via props
      await discoverMethodsFromServer(
        props.pdsUrl,
        authType(),
        setDiscoveringMethods,
        setDiscoveredMethods,
        setErrorData,
        setCurrentNsid,
      );
    } else if (params.pds) {
      try {
        const pds = await resolvePDS(params.pds);
        setPdsUrl(pds);
        // Auto-discover methods when PDS is resolved
        if (pds) {
          await discoverMethodsFromServer(
            pds,
            authType(),
            setDiscoveringMethods,
            setDiscoveredMethods,
            setErrorData,
            setCurrentNsid,
          );
        }
      } catch (e) {
        console.error("Failed to resolve PDS:", e);
      }
    }
  });

  const toggleSection = (section: string) => {
    setExpandedSections(section, !expandedSections[section]);
  };

  const handleCallXrpcMethod = async () => {
    await callXrpcMethod({
      methodInput: methodInput(),
      methodType: methodType(),
      requestData: requestData(),
      pdsUrl: pdsUrl(),
      authType: authType(),
      setLoading,
      setErrorData,
      setResponseData,
      setMethodInfo,
      setHistory,
    });
  };

  const clearResponse = () => {
    setResponseData(null);
    setErrorData(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const loadFromHistory = (historyItem: XrpcCallHistory) => {
    setMethodInput(historyItem.method);
    setMethodType(historyItem.input ? "procedure" : "query");
    if (historyItem.input) {
      setRequestData(JSON.stringify(historyItem.input || {}, null, 2));
    } else {
      setRequestData(JSON.stringify(historyItem.params || {}, null, 2));
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const selectMethod = async (method: DiscoveredMethod) => {
    setMethodInput(method.name);
    setMethodType(method.type);
    setAuthWarning(null);

    // Auto-detect and set auth type based on method requirements
    if (method.requiresAuth !== undefined) {
      if (method.requiresAuth) {
        const hasPdsUrl = pdsUrl() || props?.pdsUrl;
        const hasAgent = agent();

        // If auth is required, prefer PDS auth if PDS URL is available, otherwise OAuth if available
        if (hasPdsUrl && authType() !== "oauth") {
          setAuthType("pds");
        } else if (hasAgent && authType() !== "pds") {
          setAuthType("oauth");
        } else {
          setAuthType("pds"); // Default to PDS auth if required
        }

        // Warn if method requires auth but user isn't logged in via OAuth
        // (PDS auth credentials can't be easily checked, but warn if no OAuth agent)
        if (!hasAgent) {
          setAuthWarning(
            "This method requires authentication, but you are not logged in. The call may fail.",
          );
        }
      } else {
        // If auth is not required, set to "none"
        setAuthType("none");
      }
    }

    // Fetch schema for the selected method
    // If method was discovered, we know it exists (even if schema field is undefined)
    const wasDiscovered = discoveredMethods().some((m) => m.name === method.name);

    if (method.schema) {
      // Use cached schema if available
      const schemaToUse = method.type === "query" ? method.schema.parameters : method.schema.input;
      setMethodSchema(schemaToUse || null);
      setSchemaFetched(true); // Schema was found in discovery
    } else {
      // Try to fetch schema
      const schema = await fetchMethodSchema(method.name);
      if (schema) {
        // Schema was successfully fetched (even if input/parameters are undefined)
        setMethodSchema(method.type === "query" ? schema.parameters : schema.input);
        setSchemaFetched(true);
      } else if (wasDiscovered) {
        // Method was discovered but schema fetch failed - still consider it "fetched"
        // because we know the method exists from discovery, it just has no input/parameters
        setMethodSchema(null);
        setSchemaFetched(true);
      } else {
        // Schema fetch failed and method wasn't discovered
        setMethodSchema(null);
        setSchemaFetched(false);
      }
    }

    setShowMethodBrowser(false);
    setMethodSearchQuery("");
    setShowAutocomplete(false);
    setSelectedAutocompleteIndex(-1);
  };

  const allMethods = () => getAllMethods(discoveredMethods(), methodsFromHistory(history));

  return (
    <div class="flex w-full flex-col gap-3">
      <Show when={!props}>
        <div class="dark:bg-dark-300 flex justify-between rounded-lg border-[0.5px] border-neutral-300 bg-neutral-50 px-3 py-2 shadow-xs dark:border-neutral-700">
          <h2 class="text-lg font-semibold">XRPC Explorer</h2>
          <MenuProvider>
            <DropdownMenu
              icon="lucide--ellipsis-vertical"
              buttonClass="rounded-sm p-1"
              menuClass="top-8 p-2 text-sm"
            >
              <NavMenu href="/settings" label="Settings" icon="lucide--settings" />
              <CopyMenu content={location.pathname} label="Copy URL" icon="lucide--copy" />
            </DropdownMenu>
          </MenuProvider>
        </div>
      </Show>

      <div class="flex w-full flex-col gap-3">
        <MethodReference
          showMethodBrowser={showMethodBrowser}
          setShowMethodBrowser={setShowMethodBrowser}
          methodSearchQuery={methodSearchQuery}
          setMethodSearchQuery={setMethodSearchQuery}
          allMethods={allMethods}
          discoveringMethods={discoveringMethods}
          discoveredMethodsCount={() => allMethods().length}
          onSelectMethod={selectMethod}
          pdsUrl={props?.pdsUrl}
          currentNsid={currentNsid}
        />

        <MethodInput
          methodInput={methodInput}
          setMethodInput={setMethodInput}
          methodType={methodType}
          setMethodType={setMethodType}
          authType={authType}
          setAuthType={(type) => {
            setAuthType(type);
            setAuthWarning(null); // Clear warning when auth changes
          }}
          pdsUrl={pdsUrl}
          setPdsUrl={setPdsUrl}
          allMethods={allMethods}
          showAutocomplete={showAutocomplete}
          setShowAutocomplete={setShowAutocomplete}
          selectedAutocompleteIndex={selectedAutocompleteIndex}
          setSelectedAutocompleteIndex={setSelectedAutocompleteIndex}
          onSelectMethod={selectMethod}
          embeddedPdsUrl={props?.pdsUrl}
          discoveringMethods={discoveringMethods}
          authWarning={authWarning}
        />

        <RequestData
          methodType={methodType}
          requestData={requestData}
          setRequestData={setRequestData}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          schema={methodSchema}
          schemaFetched={schemaFetched}
        />

        {/* Action Buttons */}
        <div class="flex gap-2">
          <Button
            onClick={handleCallXrpcMethod}
            disabled={loading()}
            class="flex items-center gap-1"
          >
            <Show when={loading()}>
              <span class="iconify lucide--loader-circle animate-spin"></span>
            </Show>
            {loading() ? "Calling..." : "Call XRPC"}
          </Button>
        </div>

        <ResponseSection
          responseData={responseData}
          errorData={errorData}
          methodInfo={methodInfo}
          onCopyResponse={copyToClipboard}
          onClearResponse={clearResponse}
        />

        <HistorySection
          history={history}
          onLoadFromHistory={loadFromHistory}
          onClearHistory={clearHistory}
        />
      </div>
    </div>
  );
};
