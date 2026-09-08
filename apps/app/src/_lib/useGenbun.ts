import { useEffect, useState } from "react";
import {
  fromRecord,
  mergeSelected,
  phaseOf,
  resplitSelected,
  selectBun,
  selectGengo,
  selectNextBun,
  setYakubun,
  startGenbun,
  toRecord,
  type GenbunSession,
} from "./genbun";
import type { GakushuGengo } from "./gakushu_gengo";
import { deleteGenbun, listGenbun, loadGenbun, saveGenbun, type GenbunSummary } from "./store";

export type { GenbunPhase, GenbunSession } from "./genbun";
export {
  fromRecord,
  mergeSelected,
  phaseOf,
  resplitSelected,
  selectBun,
  selectGengo,
  selectNextBun,
  setYakubun,
  startGenbun,
  toRecord,
} from "./genbun";

async function persist(session: GenbunSession): Promise<void> {
  const record = toRecord(session);
  if (record === null) {
    return;
  }
  await saveGenbun(record);
}

export function useGenbun() {
  const [session, setSession] = useState<GenbunSession | null>(null);
  const [ichiran, setIchiran] = useState<GenbunSummary[]>([]);
  const phase = phaseOf(session);

  useEffect(() => {
    let alive = true;
    void listGenbun()
      .then((items) => {
        if (alive) {
          setIchiran(items);
        }
      })
      .catch(() => {
        if (alive) {
          setIchiran([]);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  function refreshIchiran() {
    void listGenbun()
      .then(setIchiran)
      .catch(() => setIchiran([]));
  }

  function onPaste(body: string) {
    const next = startGenbun(body);
    if (next !== null) {
      setSession(next);
    }
  }

  function onSelectGengo(gengo: GakushuGengo) {
    setSession((prev) => {
      if (prev === null) {
        return prev;
      }
      const next = selectGengo(prev, gengo);
      void persist(next);
      return next;
    });
  }

  function onSelectBun(index: number) {
    setSession((prev) => (prev === null ? prev : selectBun(prev, index)));
  }

  function onTab() {
    setSession((prev) => {
      if (prev === null) {
        return prev;
      }
      void persist(prev);
      return selectNextBun(prev);
    });
  }

  function onCtrlEnter() {
    setSession((prev) => {
      if (prev === null) {
        return prev;
      }
      void persist(prev);
      return prev;
    });
  }

  function onChangeYakubun(yakubun: string) {
    setSession((prev) => {
      if (prev === null) {
        return prev;
      }
      const next = setYakubun(prev, yakubun);
      void persist(next);
      return next;
    });
  }

  function onMerge() {
    setSession((prev) => {
      if (prev === null) {
        return prev;
      }
      const next = mergeSelected(prev);
      void persist(next);
      return next;
    });
  }

  function onResplit(caret: number) {
    setSession((prev) => {
      if (prev === null) {
        return prev;
      }
      const next = resplitSelected(prev, caret);
      void persist(next);
      return next;
    });
  }

  async function onOpen(id: string) {
    try {
      const record = await loadGenbun(id);
      if (record === null) {
        return;
      }
      const next = fromRecord(record);
      if (next !== null) {
        setSession(next);
      }
    } catch {
      // 開けなければそのまま
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteGenbun(id);
      setSession((prev) => (prev?.id === id ? null : prev));
      refreshIchiran();
    } catch {
      // 失敗時は一覧を据え置き
    }
  }

  function onBackToIchiran() {
    setSession(null);
    refreshIchiran();
  }

  return {
    session,
    phase,
    ichiran,
    onPaste,
    onSelectGengo,
    onSelectBun,
    onTab,
    onCtrlEnter,
    onChangeYakubun,
    onMerge,
    onResplit,
    onOpen,
    onDelete,
    onBackToIchiran,
  };
}
