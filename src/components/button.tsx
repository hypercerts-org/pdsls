import { JSX } from "solid-js";

export interface ButtonProps {
  class?: string;
  classList?: Record<string, boolean | undefined>;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  children?: JSX.Element;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export const Button = (props: ButtonProps) => {
  const baseClasses =
    props.variant === "secondary" ?
      "dark:hover:bg-dark-200 dark:shadow-dark-700 dark:active:bg-dark-100 box-border flex h-7 items-center gap-1 rounded-lg border-[0.5px] border-neutral-300 bg-neutral-50 px-2 py-1.5 text-xs shadow-xs select-none hover:bg-neutral-100 active:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800"
    : "dark:hover:bg-blue-600 dark:active:bg-blue-700 box-border flex h-8 items-center gap-1 rounded-lg border-[0.5px] border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm select-none hover:bg-blue-700 active:bg-blue-800 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700";

  return (
    <button
      type="button"
      class={`${baseClasses} ${props.class || ""}`}
      classList={{
        ...props.classList,
        "opacity-50 cursor-not-allowed": props.disabled,
      }}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
};
