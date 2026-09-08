import { useRef, type ReactNode } from "react";
import type { Bun } from "../../model/bun";
import { HanteiView } from "./HanteiView";
import { YakubunField } from "./YakubunField";

function bunStatusLabel(bun: Bun, pending: boolean): string | null {
  if (pending) {
    return "判定中";
  }
  if (bun.tekisetsu === true) {
    return "適切";
  }
  if (bun.tekisetsu === false) {
    return "不適切";
  }
  return null;
}

export function BunList({
  buns,
  selectedIndex,
  canHantei,
  isPending,
  errorOf,
  onSelect,
  onChangeYakubun,
  onTab,
  onCtrlEnter,
  onHantei,
  onMerge,
  onResplit,
}: {
  buns: Bun[];
  selectedIndex: number;
  canHantei: boolean;
  isPending: (index: number) => boolean;
  errorOf: (index: number) => string | null;
  onSelect: (index: number) => void;
  onChangeYakubun: (yakubun: string) => void;
  onTab: () => void;
  onCtrlEnter: () => void;
  onHantei: () => void;
  onMerge: () => void;
  onResplit: (caret: number) => void;
}) {
  const bodyRef = useRef<HTMLInputElement>(null);
  const selected = buns[selectedIndex];
  const canMerge = selectedIndex < buns.length - 1;

  const items: ReactNode[] = [];
  buns.forEach((bun, index) => {
    if (index > 0) {
      items.push(
        <span key={`mark-${index}`} className="bun-kyokai" aria-hidden="true">
          |
        </span>,
      );
    }
    const pending = isPending(index);
    const status = bunStatusLabel(bun, pending);
    items.push(
      <button
        key={`bun-${index}`}
        type="button"
        className={index === selectedIndex ? "bun-item bun-item-selected" : "bun-item"}
        onClick={() => onSelect(index)}
      >
        {bun.body}
        {index !== selectedIndex && bun.yakubun !== "" ? (
          <span className="bun-yakubun-preview">{bun.yakubun}</span>
        ) : null}
        {status !== null ? <span className="bun-hantei-status">{status}</span> : null}
      </button>,
    );
  });

  return (
    <div className="bun-list">
      <div className="bun-items">{items}</div>
      {selected !== undefined ? (
        <div className="bun-henshu">
          <label className="bun-body-caret">
            文（キャレット位置で再分割）
            <input ref={bodyRef} type="text" readOnly value={selected.body} />
          </label>
          <div className="bun-actions">
            <button type="button" disabled={!canMerge} onClick={onMerge}>
              次と結合
            </button>
            <button
              type="button"
              onClick={() => {
                const caret = bodyRef.current?.selectionStart ?? 0;
                onResplit(caret);
              }}
            >
              再分割
            </button>
            <button type="button" disabled={!canHantei} onClick={onHantei}>
              判定
            </button>
          </div>
          <YakubunField
            key={selectedIndex}
            value={selected.yakubun}
            onChange={onChangeYakubun}
            onTab={onTab}
            onCtrlEnter={onCtrlEnter}
          />
          <HanteiView
            bun={selected}
            pending={isPending(selectedIndex)}
            error={errorOf(selectedIndex)}
          />
        </div>
      ) : null}
    </div>
  );
}
