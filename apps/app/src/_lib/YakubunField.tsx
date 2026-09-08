import { useEffect, useRef, type KeyboardEvent } from "react";

export function YakubunField({
  value,
  canHantei,
  onChange,
  onTab,
  onCtrlEnter,
}: {
  value: string;
  canHantei: boolean;
  onChange: (yakubun: string) => void;
  onTab: () => void;
  onCtrlEnter: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      onTab();
      return;
    }
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      if (!canHantei) {
        return;
      }
      onCtrlEnter();
    }
  }

  return (
    <label className="yakubun-field">
      訳文
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={onKeyDown}
        rows={3}
      />
    </label>
  );
}
