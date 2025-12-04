import { For, Show } from "solid-js";
import { TextInput } from "../../../components/text-input";
import { DiscoveredMethod, XrpcMethodType } from "../types";
import { autocompleteSuggestions } from "../utils/method-helpers";
import { AuthSelector } from "./auth-selector";
import { MethodTypeSelector } from "./method-type-selector";

interface MethodInputProps {
  methodInput: () => string;
  setMethodInput: (value: string) => void;
  methodType: () => XrpcMethodType;
  setMethodType: (type: XrpcMethodType) => void;
  authType: () => "none" | "pds" | "oauth";
  setAuthType: (type: "none" | "pds" | "oauth") => void;
  pdsUrl: () => string;
  setPdsUrl: (url: string) => void;
  allMethods: () => DiscoveredMethod[];
  showAutocomplete: () => boolean;
  setShowAutocomplete: (show: boolean) => void;
  selectedAutocompleteIndex: () => number;
  setSelectedAutocompleteIndex: (index: number) => void;
  onSelectMethod: (method: DiscoveredMethod) => void;
  embeddedPdsUrl?: string;
  discoveringMethods: () => boolean;
  authWarning?: () => string | null;
}

export const MethodInput = (props: MethodInputProps) => {
  const suggestions = () => autocompleteSuggestions(props.allMethods(), props.methodInput());

  const handleMethodInput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const value = e.currentTarget.value;
    props.setMethodInput(value);
    props.setShowAutocomplete(value.length > 0);
    props.setSelectedAutocompleteIndex(-1);
  };

  const handleMethodInputKeyDown = (e: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = props.selectedAutocompleteIndex();
      const next = current < suggestions().length - 1 ? current + 1 : current;
      props.setSelectedAutocompleteIndex(next);
      props.setShowAutocomplete(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = props.selectedAutocompleteIndex();
      const prev = current > 0 ? current - 1 : -1;
      props.setSelectedAutocompleteIndex(prev);
    } else if (e.key === "Enter" && props.selectedAutocompleteIndex() >= 0) {
      e.preventDefault();
      const selected = suggestions()[props.selectedAutocompleteIndex()];
      if (selected) {
        props.onSelectMethod(selected);
      }
    } else if (e.key === "Escape") {
      props.setShowAutocomplete(false);
      props.setSelectedAutocompleteIndex(-1);
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <h3 class="font-medium">XRPC Method</h3>
      </div>

      <div class="flex flex-col gap-2">
        <div class="relative">
          <TextInput
            name="xrpc-method"
            placeholder={
              props.discoveringMethods() ?
                "e.g., com.atproto.repo.getRecord"
              : "e.g., com.atproto.repo.getRecord (autocomplete available)"
            }
            value={props.methodInput()}
            autocomplete="off"
            onInput={handleMethodInput}
            onKeyDown={handleMethodInputKeyDown}
            onFocus={() => {
              if (props.methodInput().length > 0) {
                props.setShowAutocomplete(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow clicks on suggestions
              setTimeout(() => props.setShowAutocomplete(false), 200);
            }}
            class="w-full"
          />
          <Show when={props.showAutocomplete() && suggestions().length > 0}>
            <div class="dark:bg-dark-200 absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded border-[0.5px] border-neutral-300 bg-neutral-50 shadow-lg dark:border-neutral-700">
              <For each={suggestions()}>
                {(method, index) => (
                  <button
                    onClick={() => props.onSelectMethod(method)}
                    classList={{
                      "dark:hover:bg-dark-300 flex w-full items-start gap-2 rounded p-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700": true,
                      "bg-blue-50 dark:bg-blue-900/30":
                        index() === props.selectedAutocompleteIndex(),
                    }}
                  >
                    <span class="font-mono text-xs">{method.name}</span>
                    <Show when={method.description}>
                      <span class="text-gray-500 dark:text-gray-400">- {method.description}</span>
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
                          {method.requiresAuth ? "🔒" : "🔓"}
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
          </Show>
        </div>

        <MethodTypeSelector methodType={props.methodType} setMethodType={props.setMethodType} />

        <AuthSelector authType={props.authType} setAuthType={props.setAuthType} />

        <Show when={props.authWarning?.()}>
          <div class="rounded border border-orange-300 bg-orange-50 p-2 text-sm text-orange-800 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-200">
            {props.authWarning?.()}
          </div>
        </Show>

        <Show
          when={
            (props.authType() === "pds" || props.authType() === "none") && !props.embeddedPdsUrl
          }
        >
          <TextInput
            name="pds-url"
            placeholder="PDS URL (e.g., https://bsky.social)"
            value={props.pdsUrl()}
            onInput={(e) => props.setPdsUrl(e.currentTarget.value)}
            class="w-full"
          />
        </Show>
      </div>
    </div>
  );
};
