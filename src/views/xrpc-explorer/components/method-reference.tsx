import { For, Show } from "solid-js";
import { TextInput } from "../../../components/text-input";
import { DiscoveredMethod } from "../types";
import { filteredMethods, methodsByNamespace } from "../utils/method-helpers";

interface MethodReferenceProps {
  showMethodBrowser: () => boolean;
  setShowMethodBrowser: (show: boolean) => void;
  methodSearchQuery: () => string;
  setMethodSearchQuery: (query: string) => void;
  allMethods: () => DiscoveredMethod[];
  discoveringMethods: () => boolean;
  discoveredMethodsCount: () => number;
  onSelectMethod: (method: DiscoveredMethod) => void;
  pdsUrl?: string;
  currentNsid?: () => string | null;
}

export const MethodReference = (props: MethodReferenceProps) => {
  const filtered = () => filteredMethods(props.allMethods(), props.methodSearchQuery());
  const grouped = () => methodsByNamespace(filtered());

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3 class="flex items-center gap-2 font-medium">
          Method Reference
          <Show when={props.discoveringMethods()}>
            <span class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="iconify lucide--loader-circle animate-spin"></span>
              <Show when={props.currentNsid?.()}>
                <span class="font-mono">{props.currentNsid?.()}</span>
              </Show>
            </span>
          </Show>
          <Show when={props.discoveredMethodsCount() > 0}>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              ({props.discoveredMethodsCount()} discovered)
            </span>
          </Show>
        </h3>
        <div class="flex items-center gap-2">
          <button
            onClick={() => props.setShowMethodBrowser(!props.showMethodBrowser())}
            class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {props.showMethodBrowser() ? "▼ Hide" : "▶ Show"}
          </button>
        </div>
      </div>

      <Show when={props.showMethodBrowser()}>
        <div class="dark:bg-dark-200 rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-3 dark:border-neutral-700">
          <div class="mb-3">
            <TextInput
              name="method-search"
              placeholder="Filter methods..."
              value={props.methodSearchQuery()}
              onInput={(e) => props.setMethodSearchQuery(e.currentTarget.value)}
              class="w-full"
            />
          </div>
          <Show when={props.allMethods().length === 0 && !props.discoveringMethods()}>
            <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {props.pdsUrl ?
                "Discovering methods from server..."
              : "No methods discovered yet. Methods will be discovered automatically when a PDS is available."
              }
            </div>
          </Show>
          <Show when={props.discoveringMethods()}>
            <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <span class="iconify lucide--loader-circle mr-1 animate-spin"></span>
              <span>
                {props.currentNsid?.() || "Discovering methods from server..."}
              </span>
            </div>
          </Show>
          <Show when={props.allMethods().length > 0}>
            <div class="max-h-96 overflow-y-auto">
              <For each={Object.entries(grouped())}>
                {([namespace, methods]) => (
                  <div class="mb-4">
                    <h4 class="mb-2 text-sm font-semibold">{namespace}</h4>
                    <div class="flex flex-col gap-1">
                      <For each={methods}>
                        {(method) => (
                          <button
                            onClick={() => props.onSelectMethod(method)}
                            class="dark:hover:bg-dark-300 flex items-start gap-2 rounded p-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <span class="font-mono text-xs">{method.name}</span>
                            <Show when={method.description}>
                              <span class="text-gray-500 dark:text-gray-400">
                                - {method.description}
                              </span>
                            </Show>
                            <div class="ml-auto flex items-center gap-1">
                              <Show when={method.requiresAuth !== undefined}>
                                <span
                                  classList={{
                                    "rounded px-1.5 py-0.5 text-xs": true,
                                    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200":
                                      method.requiresAuth === true,
                                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400":
                                      method.requiresAuth === false,
                                  }}
                                  title={
                                    method.requiresAuth ? "Requires authentication" : (
                                      "No authentication required"
                                    )
                                  }
                                >
                                  {method.requiresAuth ? "🔒 Auth" : "🔓 No Auth"}
                                </span>
                              </Show>
                              <span
                                classList={{
                                  "rounded px-1.5 py-0.5 text-xs": true,
                                  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
                                    method.type === "query",
                                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
                                    method.type === "procedure",
                                  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200":
                                    method.type === "subscription",
                                }}
                              >
                                {method.type}
                              </span>
                            </div>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};
