import { Show } from "solid-js";
import { agent } from "../../../components/login";

interface AuthSelectorProps {
  authType: () => "none" | "pds" | "oauth";
  setAuthType: (type: "none" | "pds" | "oauth") => void;
}

export const AuthSelector = (props: AuthSelectorProps) => (
  <div class="mb-3 flex gap-2">
    <button
      classList={{
        "px-3 py-1 rounded text-sm": true,
        "bg-green-100 dark:bg-green-900": props.authType() === "none",
        "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700":
          props.authType() !== "none",
      }}
      onClick={() => props.setAuthType("none")}
    >
      No Auth
    </button>
    <button
      classList={{
        "px-3 py-1 rounded text-sm": true,
        "bg-green-100 dark:bg-green-900": props.authType() === "pds",
        "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700":
          props.authType() !== "pds",
      }}
      onClick={() => props.setAuthType("pds")}
    >
      PDS Auth
    </button>
    <Show when={agent()}>
      <button
        classList={{
          "px-3 py-1 rounded text-sm": true,
          "bg-green-100 dark:bg-green-900": props.authType() === "oauth",
          "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700":
            props.authType() !== "oauth",
        }}
        onClick={() => props.setAuthType("oauth")}
      >
        OAuth
      </button>
    </Show>
  </div>
);

