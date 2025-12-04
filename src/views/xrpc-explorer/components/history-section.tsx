import { For, Show } from "solid-js";
import { XrpcCallHistory } from "../types";

interface HistorySectionProps {
  history: XrpcCallHistory[];
  onLoadFromHistory: (item: XrpcCallHistory) => void;
  onClearHistory: () => void;
}

export const HistorySection = (props: HistorySectionProps) => {
  return (
    <Show when={props.history.length > 0}>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h3 class="font-medium">Call History ({props.history.length})</h3>
          <button
            onClick={props.onClearHistory}
            class="text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            Clear History
          </button>
        </div>

        <div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
          <For each={props.history}>
            {(item) => (
              <div
                onClick={() => props.onLoadFromHistory(item)}
                class="dark:hover:bg-dark-200 cursor-pointer rounded border-[0.5px] border-neutral-200 bg-neutral-50 p-2 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Show when={item.error}>
                      <span class="iconify lucide--alert-triangle text-red-500 dark:text-red-400"></span>
                    </Show>
                    <Show when={!item.error}>
                      <span class="iconify lucide--check text-green-500 dark:text-green-400"></span>
                    </Show>
                    <span class="font-mono text-xs">{item.method}</span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};
