import { Client, CredentialManager } from "@atcute/client";
import { agent } from "../../../components/login";
import { XrpcCallHistory, XrpcMethodInfo } from "../types";
import { parseMethodInfo } from "./method-parser";

interface CallXrpcMethodParams {
  methodInput: string;
  methodType: "query" | "procedure" | "subscription";
  requestData: string;
  pdsUrl: string;
  authType: "none" | "pds" | "oauth";
  setLoading: (loading: boolean) => void;
  setErrorData: (error: string | null) => void;
  setResponseData: (data: any) => void;
  setMethodInfo: (info: XrpcMethodInfo | null) => void;
  setHistory: (updater: (prev: XrpcCallHistory[]) => XrpcCallHistory[]) => void;
}

export const callXrpcMethod = async (params: CallXrpcMethodParams): Promise<void> => {
  const {
    methodInput,
    methodType,
    requestData,
    pdsUrl,
    authType,
    setLoading,
    setErrorData,
    setResponseData,
    setMethodInfo,
    setHistory,
  } = params;

  if (!methodInput.trim()) {
    setErrorData("Please enter an XRPC method name");
    return;
  }

  if (authType !== "oauth" && !pdsUrl) {
    setErrorData("Please set a PDS URL");
    return;
  }

  if (authType === "oauth" && !agent()) {
    setErrorData("Please log in to use OAuth authentication");
    return;
  }

  setLoading(true);
  setErrorData(null);
  setResponseData(null);

  // Parse JSON input
  let parsedParams: Record<string, any> = {};
  let parsedInput: Record<string, any> = {};
  const method = methodInput.trim();

  try {
    try {
      const trimmedData = requestData?.trim();
      if (trimmedData && trimmedData !== "{}") {
        if (methodType === "query") {
          parsedParams = JSON.parse(trimmedData);
        } else {
          parsedInput = JSON.parse(trimmedData);
        }
      }
    } catch (e) {
      setErrorData(`Invalid JSON: ${(e as Error).message}`);
      setLoading(false);
      return;
    }

    // Create appropriate client based on auth type
    let handler;
    if (authType === "oauth" && agent()) {
      handler = agent() as any;
    } else {
      handler = new CredentialManager({ service: pdsUrl });
    }

    const rpc = new Client({ handler });

    // Determine method type and call appropriately
    let result;

    if (methodType === "query" || method.includes(".get") || method.includes("list")) {
      // Only pass params if they're not empty
      const hasParams = Object.keys(parsedParams).length > 0;
      // @ts-expect-error: Dynamic method name for explorer
      result = await rpc.get(method, hasParams ? { params: parsedParams } : undefined);
    } else {
      // Only include input if it's not empty (has at least one key)
      const hasInput = Object.keys(parsedInput).length > 0;
      // @ts-expect-error: Dynamic method name for explorer
      result = await rpc.post(method, hasInput ? { input: parsedInput } : undefined);
    }

    // Store in history
    setHistory((prev) => [
      {
        method,
        timestamp: Date.now(),
        params: parsedParams,
        input: parsedInput,
        response: result.data,
        error: result.ok ? undefined : result.data?.error,
      },
      ...prev,
    ]);

    if (result.ok) {
      setResponseData(result.data);
      setMethodInfo(parseMethodInfo(method));
    } else {
      setErrorData(`XRPC Error: ${result.data?.error || "Unknown error"}`);
      if (result.data?.message) {
        setErrorData(`${result.data?.error || "Unknown error"} - ${result.data.message}`);
      }
    }
  } catch (error: any) {
    // Handle the case where a method with no output returns null content-type
    // This is valid for procedures that don't return data (e.g., requestEmailConfirmation)
    const errorMessage = error.message || String(error);
    if (
      errorMessage.includes("content-type") &&
      (errorMessage.includes("null") || errorMessage.includes("got null"))
    ) {
      // Check if this might be a successful call with no output
      // Many procedures (especially those ending in requestEmailConfirmation, etc.)
      // legitimately return 200 with no content-type when they have no output
      console.log(
        "Method returned null content-type, treating as success (no output expected)",
      );
      setResponseData(null);
      setMethodInfo(parseMethodInfo(method));
      setHistory((prev) => [
        {
          method,
          timestamp: Date.now(),
          params: parsedParams,
          input: parsedInput,
          response: null,
          error: undefined,
        },
        ...prev,
      ]);
      return;
    }
    setErrorData(`Failed to call XRPC method: ${error.message}`);
    console.error("XRPC call failed:", error);
  } finally {
    setLoading(false);
  }
};
