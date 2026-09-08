import { useState } from "react";
import { applyHantei, selectNextBun, type GenbunSession } from "./genbun";
import { runHanteiIfNeeded } from "./hantei";
import { hanteiBun } from "./store";

export function useHantei({
  session,
  canHantei,
  setSession,
  persist,
}: {
  session: GenbunSession | null;
  canHantei: boolean;
  setSession: (updater: (prev: GenbunSession | null) => GenbunSession | null) => void;
  persist: (session: GenbunSession) => Promise<void>;
}) {
  const [pendingIndexes, setPendingIndexes] = useState<ReadonlySet<number>>(new Set());
  const [errors, setErrors] = useState<ReadonlyMap<number, string>>(new Map());

  function markPending(index: number, pending: boolean) {
    setPendingIndexes((prev) => {
      const next = new Set(prev);
      if (pending) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  }

  function setError(index: number, message: string | null) {
    setErrors((prev) => {
      const next = new Map(prev);
      if (message === null) {
        next.delete(index);
      } else {
        next.set(index, message);
      }
      return next;
    });
  }

  async function runForIndex(index: number, snapshot: GenbunSession): Promise<void> {
    if (!canHantei || snapshot.gakushuGengo === null) {
      return;
    }
    const target = snapshot.buns[index];
    if (target === undefined || target.yakubun === "") {
      return;
    }

    markPending(index, true);
    setError(index, null);

    try {
      const gengo = snapshot.gakushuGengo;
      const result = await runHanteiIfNeeded(target.yakubun, () =>
        hanteiBun({
          gakushuGengo: gengo,
          genbun: snapshot.body,
          bun: target.body,
          yakubun: target.yakubun,
        }),
      );
      if (result === null) {
        return;
      }
      setSession((prev) => {
        if (prev === null) {
          return prev;
        }
        const next = applyHantei(prev, index, result);
        void persist(next);
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(index, message === "" ? "判定に失敗しました" : message);
    } finally {
      markPending(index, false);
    }
  }

  function onTab() {
    if (session === null) {
      return;
    }
    const snapshot = session;
    void persist(snapshot);
    if (canHantei) {
      void runForIndex(snapshot.selectedIndex, snapshot);
    }
    setSession((prev) => (prev === null ? prev : selectNextBun(prev)));
  }

  function onCtrlEnter() {
    if (session === null) {
      return;
    }
    const snapshot = session;
    void persist(snapshot);
    if (canHantei) {
      void runForIndex(snapshot.selectedIndex, snapshot);
    }
  }

  function onHantei() {
    onCtrlEnter();
  }

  function isPending(index: number): boolean {
    return pendingIndexes.has(index);
  }

  function errorOf(index: number): string | null {
    return errors.get(index) ?? null;
  }

  return {
    onTab,
    onCtrlEnter,
    onHantei,
    isPending,
    errorOf,
  };
}
