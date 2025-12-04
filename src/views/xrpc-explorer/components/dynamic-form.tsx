import { For } from "solid-js";
import { TextInput } from "../../../components/text-input";

interface DynamicFormProps {
  schema: any; // Lexicon parameters or input schema
  value: () => any; // Current JSON value as object
  onChange: (value: any) => void; // Callback when form changes
}

export const DynamicForm = (props: DynamicFormProps) => {
  const updateField = (key: string, value: any) => {
    const currentData = props.value() || {};
    const newData = { ...currentData };
    if (value === undefined || value === null || value === "") {
      delete newData[key];
    } else {
      newData[key] = value;
    }
    props.onChange(newData);
  };

  const getFieldType = (property: any): string => {
    if (property.type === "array") return "array";
    if (property.type === "boolean") return "boolean";
    if (property.type === "integer" || property.type === "number") return "number";
    if (property.type === "string") {
      if (property.format === "uri" || property.format === "at-uri") return "uri";
      if (property.format === "datetime") return "datetime";
      return "string";
    }
    if (property.type === "object" || property.ref) return "object";
    return "string"; // default
  };

  const renderField = (key: string, property: any, required: boolean = false) => {
    const fieldType = getFieldType(property);
    const currentValue = () => props.value()?.[key];

    if (fieldType === "boolean") {
      return (
        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id={key}
            checked={currentValue() === true}
            onChange={(e) => updateField(key, e.currentTarget.checked)}
            class="rounded border-neutral-300 dark:border-neutral-700"
          />
          <label for={key} class="text-sm">
            {property.description || key}
            {required && <span class="text-red-500 ml-1">*</span>}
          </label>
        </div>
      );
    }

    if (fieldType === "number") {
      return (
        <div class="flex flex-col gap-1">
          <label for={key} class="text-sm font-medium">
            {property.description || key}
            {required && <span class="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            id={key}
            value={currentValue() ?? ""}
            onInput={(e) => {
              const val = e.currentTarget.value;
              updateField(key, val === "" ? undefined : Number(val));
            }}
            class="dark:bg-dark-200 w-full rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-2 text-sm dark:border-neutral-700"
            placeholder={property.default !== undefined ? String(property.default) : ""}
          />
        </div>
      );
    }

    if (fieldType === "array") {
      return (
        <div class="flex flex-col gap-1">
          <label for={key} class="text-sm font-medium">
            {property.description || key}
            {required && <span class="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            id={key}
            value={Array.isArray(currentValue()) ? JSON.stringify(currentValue()) : ""}
            onInput={(e) => {
              try {
                const parsed = JSON.parse(e.currentTarget.value);
                if (Array.isArray(parsed)) {
                  updateField(key, parsed);
                }
              } catch {
                // Invalid JSON, ignore
              }
            }}
            class="dark:bg-dark-200 w-full rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-2 text-sm dark:border-neutral-700"
            placeholder='JSON array, e.g., ["item1", "item2"]'
            rows={3}
          />
        </div>
      );
    }

    if (fieldType === "object") {
      return (
        <div class="flex flex-col gap-1">
          <label for={key} class="text-sm font-medium">
            {property.description || key}
            {required && <span class="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            id={key}
            value={currentValue() ? JSON.stringify(currentValue(), null, 2) : ""}
            onInput={(e) => {
              try {
                const parsed = JSON.parse(e.currentTarget.value);
                if (typeof parsed === "object" && parsed !== null) {
                  updateField(key, parsed);
                }
              } catch {
                // Invalid JSON, ignore
              }
            }}
            class="dark:bg-dark-200 w-full rounded border-[0.5px] border-neutral-300 bg-neutral-50 p-2 text-sm font-mono dark:border-neutral-700"
            placeholder="JSON object"
            rows={4}
          />
        </div>
      );
    }

    // Default: string input
    return (
      <div class="flex flex-col gap-1">
        <label for={key} class="text-sm font-medium">
          {property.description || key}
          {required && <span class="text-red-500 ml-1">*</span>}
        </label>
        <TextInput
          name={key}
          type={fieldType === "datetime" ? "datetime-local" : "text"}
          value={currentValue() ?? ""}
          onInput={(e) => updateField(key, e.currentTarget.value)}
          placeholder={property.default !== undefined ? String(property.default) : ""}
          class="w-full"
        />
      </div>
    );
  };

  const schemaObj = props.schema;
  if (!schemaObj) {
    return (
      <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No schema available for this method
      </div>
    );
  }

  // Handle lexicon schema format
  // For parameters: { type: "params", properties: {...}, required: [...] }
  // For input: { encoding: "...", schema: { type: "object", properties: {...}, required: [...] } }
  let properties: Record<string, any> = {};
  let required: string[] = [];

  if (schemaObj.type === "params") {
    // Parameters schema
    properties = schemaObj.properties || {};
    required = schemaObj.required || [];
  } else if (schemaObj.schema) {
    // Input schema with encoding wrapper
    const innerSchema = schemaObj.schema;
    if (innerSchema.properties) {
      properties = innerSchema.properties;
      required = innerSchema.required || [];
    }
  } else if (schemaObj.type === "object" && schemaObj.properties) {
    // Direct object schema
    properties = schemaObj.properties;
    required = schemaObj.required || [];
  } else if (schemaObj.properties) {
    // Fallback: just properties
    properties = schemaObj.properties;
    required = schemaObj.required || [];
  }

  if (Object.keys(properties).length === 0) {
    return (
      <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No parameters available for this method
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-3">
      <For each={Object.entries(properties)}>
        {([key, property]: [string, any]) => (
          <div>{renderField(key, property, required.includes(key))}</div>
        )}
      </For>
    </div>
  );
};

