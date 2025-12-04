import { XrpcMethodType } from "../types";

interface MethodTypeSelectorProps {
  methodType: () => XrpcMethodType;
  setMethodType: (type: XrpcMethodType) => void;
}

export const MethodTypeSelector = (props: MethodTypeSelectorProps) => (
  <div class="mb-3 flex gap-2">
    <button
      classList={{
        "px-3 py-1 rounded text-sm": true,
        "bg-blue-100 dark:bg-blue-900": props.methodType() === "query",
        "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700":
          props.methodType() !== "query",
      }}
      onClick={() => props.setMethodType("query")}
    >
      Query (GET)
    </button>
    <button
      classList={{
        "px-3 py-1 rounded text-sm": true,
        "bg-blue-100 dark:bg-blue-900": props.methodType() === "procedure",
        "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700":
          props.methodType() !== "procedure",
      }}
      onClick={() => props.setMethodType("procedure")}
    >
      Procedure (POST)
    </button>
  </div>
);

