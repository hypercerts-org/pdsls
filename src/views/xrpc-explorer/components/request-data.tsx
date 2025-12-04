import { createSignal, Show, createEffect, createMemo } from "solid-js";
import { XrpcMethodType } from "../types";
import { DynamicForm } from "./dynamic-form";

interface RequestDataProps {
  methodType: () => XrpcMethodType;
  requestData: () => string;
  setRequestData: (data: string) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  schema?: () => any | null;
  schemaFetched?: () => boolean;
}

export const RequestData = (props: RequestDataProps) => {
  const [activeTab, setActiveTab] = createSignal<"form" | "json">("form");
  const [jsonError, setJsonError] = createSignal<string | null>(null);
  
  // Memoize schema value to avoid repeated calls
  const schemaValue = createMemo(() => {
    if (!props.schema) return null;
    try {
      return props.schema();
    } catch (e) {
      return null;
    }
  });

  // Parse JSON value for form
  const parsedValue = () => {
    try {
      const data = props.requestData();
      if (!data || data.trim() === "" || data === "{}") {
        return {};
      }
      const parsed = JSON.parse(data);
      setJsonError(null);
      return parsed;
    } catch (e) {
      setJsonError((e as Error).message);
      return {};
    }
  };

  // Handle form changes - update JSON
  const handleFormChange = (value: any) => {
    try {
      // Remove undefined/null/empty string values
      const cleaned = Object.fromEntries(
        Object.entries(value).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      );
      const jsonString = Object.keys(cleaned).length === 0 ? "{}" : JSON.stringify(cleaned, null, 2);
      props.setRequestData(jsonString);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  // Handle JSON editor changes - validate and update form if valid
  const handleJsonChange = (value: string) => {
    props.setRequestData(value);
    try {
      if (value.trim() && value !== "{}") {
        JSON.parse(value);
        setJsonError(null);
      } else {
        setJsonError(null);
      }
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{props.methodType() === "query" ? "Parameters" : "Input"}</h3>
      </div>

      <div class="flex flex-col gap-2">
          {/* Tabs */}
          <div class="flex gap-1 border-b border-neutral-300 dark:border-neutral-700">
            <button
              onClick={() => setActiveTab("form")}
              classList={{
                "px-3 py-2 text-sm font-medium": true,
                "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400":
                  activeTab() === "form",
                "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200":
                  activeTab() !== "form",
              }}
            >
              Form
            </button>
            <button
              onClick={() => setActiveTab("json")}
              classList={{
                "px-3 py-2 text-sm font-medium": true,
                "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400":
                  activeTab() === "json",
                "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200":
                  activeTab() !== "json",
              }}
            >
              JSON
            </button>
          </div>

          {/* Form Tab */}
          <Show when={activeTab() === "form"}>
            <div class="dark:bg-dark-200 rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-3 dark:border-neutral-700">
              <Show when={schemaValue()}>
                <DynamicForm
                  schema={schemaValue()!}
                  value={parsedValue}
                  onChange={handleFormChange}
                />
              </Show>
              <Show when={!schemaValue()}>
                <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {props.schemaFetched?.() ? (
                    "This method does not require any input data."
                  ) : (
                    "No schema available. Use the JSON tab to enter data manually."
                  )}
                </div>
              </Show>
            </div>
          </Show>

          {/* JSON Tab */}
          <Show when={activeTab() === "json"}>
            <div class="flex flex-col gap-2">
              <Show when={!schemaValue() && props.schemaFetched?.()}>
                <div class="dark:bg-dark-200 rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-3 dark:border-neutral-700">
                  <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    This method does not require any input data.
                  </div>
                </div>
              </Show>
              <Show when={schemaValue() || !props.schemaFetched?.()}>
                <textarea
                  class="dark:bg-dark-200 w-full rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-2 text-sm font-mono dark:border-neutral-700"
                  classList={{
                    "border-red-300 dark:border-red-700": jsonError() !== null,
                  }}
                  rows={8}
                  placeholder={
                    props.methodType() === "query" ?
                      'Parameters JSON (e.g., {"limit": 10, "cursor": "abc123"})'
                    : 'Input JSON (e.g., {"record": {...}, "collection": "app.bsky.feed.post"})'
                  }
                  value={props.requestData()}
                  onInput={(e) => handleJsonChange(e.currentTarget.value)}
                />
              </Show>
              <Show when={jsonError()}>
                <div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                  JSON Error: {jsonError()}
                </div>
              </Show>
            </div>
          </Show>
        </div>
    </div>
  );
};
