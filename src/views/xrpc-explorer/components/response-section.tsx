import { For, Show } from "solid-js";
import { Button } from "../../../components/button";
import { XrpcMethodInfo } from "../types";

interface ResponseSectionProps {
  responseData: () => any;
  errorData: () => string | null;
  methodInfo: () => XrpcMethodInfo | null;
  onCopyResponse: (text: string) => void;
  onClearResponse: () => void;
}

export const ResponseSection = (props: ResponseSectionProps) => {
  return (
    <Show when={props.responseData() || props.errorData()}>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h3 class="font-medium">Response</h3>
          <Button onClick={props.onClearResponse} variant="secondary" class="text-sm">
            Clear Response
          </Button>
        </div>

        <Show when={props.errorData()}>
          <div class="dark:bg-dark-200/50 rounded border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div class="flex items-start gap-2">
              <span class="iconify lucide--alert-triangle text-red-600 dark:text-red-400"></span>
              <div>
                <h4 class="font-semibold">Error</h4>
                <p class="text-sm">{props.errorData()}</p>
              </div>
            </div>
          </div>
        </Show>

        <Show when={props.responseData()}>
          <div class="dark:bg-dark-200 rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-3 text-sm dark:border-neutral-700">
            <pre class="overflow-x-auto">{JSON.stringify(props.responseData(), null, 2)}</pre>

            <div class="mt-2 flex gap-2">
              <button
                onClick={() => props.onCopyResponse(JSON.stringify(props.responseData(), null, 2))}
                class="flex items-center gap-1 rounded border-[0.5px] border-neutral-300 bg-neutral-50 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <span class="iconify lucide--copy"></span>
                Copy Response
              </button>
            </div>
          </div>
        </Show>

        <Show when={props.methodInfo()}>
          <div class="flex flex-col gap-2">
            <h3 class="font-medium">Method Information</h3>

            <div class="dark:bg-dark-200 rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-3 text-sm dark:border-neutral-700">
              <div class="flex flex-col gap-1">
                <div>
                  <span class="font-semibold">Name:</span>{" "}
                  <span class="font-mono">{props.methodInfo()!.name}</span>
                </div>
                <div>
                  <span class="font-semibold">Type:</span> <span>{props.methodInfo()!.type}</span>
                </div>
                <Show when={props.methodInfo()!.description}>
                  <div>
                    <span class="font-semibold">Description:</span>{" "}
                    <span>{props.methodInfo()!.description}</span>
                  </div>
                </Show>

                <Show when={props.methodInfo()!.parameters}>
                  <div class="mt-2">
                    <h4 class="font-semibold">Parameters:</h4>
                    <div class="mt-1 ml-2 flex flex-col gap-1">
                      <For each={Object.entries(props.methodInfo()!.parameters || {})}>
                        {([paramName, paramInfo]) => (
                          <div class="flex items-center gap-2">
                            <span class="font-mono">{paramName}</span>
                            <span class="text-xs">({paramInfo.type})</span>
                            <Show when={paramInfo.required}>
                              <span class="text-xs text-red-500 dark:text-red-400">required</span>
                            </Show>
                            <Show when={paramInfo.description}>
                              <span class="text-gray-500 dark:text-gray-400">
                                - {paramInfo.description}
                              </span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};

