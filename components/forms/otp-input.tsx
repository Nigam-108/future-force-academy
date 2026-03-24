"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
} from "react";

type OtpInputProps = {
  value: string;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
};

export function OtpInput({
  value,
  length = 4,
  disabled = false,
  autoFocus = false,
  onChange,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = useMemo(() => {
    return Array.from({ length }, (_, index) => value[index] ?? "");
  }, [length, value]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      refs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  function emitValue(nextDigits: string[]) {
    const nextValue = nextDigits.join("").slice(0, length);
    onChange(nextValue);

    if (nextValue.length === length && !nextValue.includes("")) {
      onComplete?.(nextValue);
    }
  }

  function focusIndex(index: number) {
    const safeIndex = Math.max(0, Math.min(length - 1, index));
    refs.current[safeIndex]?.focus();
    refs.current[safeIndex]?.select();
  }

  function handleInput(index: number, event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "");

    if (!raw) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      emitValue(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    const incoming = raw.split("");

    let writeIndex = index;

    for (const char of incoming) {
      if (writeIndex >= length) break;
      nextDigits[writeIndex] = char;
      writeIndex += 1;
    }

    emitValue(nextDigits);

    if (writeIndex < length) {
      focusIndex(writeIndex);
    } else {
      refs.current[length - 1]?.blur();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        emitValue(nextDigits);
        return;
      }

      if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        emitValue(nextDigits);
        focusIndex(index - 1);
      }

      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusIndex(index + 1);
      return;
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    if (!pasted) return;

    const nextDigits = Array.from({ length }, (_, index) => pasted[index] ?? "");
    emitValue(nextDigits);

    if (pasted.length >= length) {
      refs.current[length - 1]?.blur();
    } else {
      focusIndex(pasted.length);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleInput(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="h-14 w-12 rounded-2xl border border-slate-200 text-center text-xl font-semibold tracking-wide outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
      ))}
    </div>
  );
}