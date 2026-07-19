"use client";

import { useEffect, useId, useRef, useState } from "react";

export type PremiumSelectOption = {
  value: string;
  label: string;
};

type PremiumSelectProps = {
  ariaLabelledBy: string;
  disabled?: boolean;
  invalid?: boolean;
  name: string;
  onChange?: (value: string) => void;
  options: PremiumSelectOption[];
  placeholder: string;
  value: string;
};

export function PremiumSelect({
  ariaLabelledBy,
  disabled = false,
  invalid = false,
  name,
  onChange,
  options,
  placeholder,
  value,
}: PremiumSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const choose = (nextValue: string) => {
    onChange?.(nextValue);
    setOpen(false);
  };

  const move = (direction: 1 | -1) => {
    setActiveIndex((current) => {
      if (!options.length) return 0;
      return (current + direction + options.length) % options.length;
    });
  };

  return (
    <div className="premium-select" ref={rootRef}>
      <input aria-invalid={invalid} name={name} type="hidden" value={value} />
      <button
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
        className="premium-select-trigger"
        data-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => {
          setActiveIndex(Math.max(selectedIndex, 0));
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            if (!open) {
              setActiveIndex(Math.max(selectedIndex, 0));
              setOpen(true);
            } else if (event.key === "ArrowDown") move(1);
            else if (event.key === "ArrowUp") move(-1);
          }
        }}
        type="button"
      >
        <span className={value ? undefined : "premium-select-placeholder"}>
          {options[selectedIndex]?.label ?? placeholder}
        </span>
        <svg aria-hidden="true" viewBox="0 0 12 8">
          <path d="m1 1.5 5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div aria-labelledby={ariaLabelledBy} className="premium-select-menu" id={`${id}-listbox`} role="listbox">
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className={index === activeIndex ? "is-active" : undefined}
              key={option.value}
              onClick={() => choose(option.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  move(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                }
              }}
              ref={(element) => { optionRefs.current[index] = element; }}
              role="option"
              tabIndex={index === activeIndex ? 0 : -1}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === value ? (
                <svg aria-hidden="true" viewBox="0 0 14 11"><path d="m1 5.5 3.6 3.6L13 1" /></svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
