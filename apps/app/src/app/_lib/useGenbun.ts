import { useEffect, useState } from "react";
import { logCaughtError } from "../../lib/error_log";
import {
  fromRecord,
  mergeSelected,
  phaseOf,
  resplitSelected,
  selectBun,
  selectGengo,
  setYakubun,
  startGenbun,
  toRecord,
  type GenbunSession,
} from "../../model/genbun";
import type { GakushuGengo } from "../../model/gakushu_gengo";
import {
  deleteGenbun,
  listGenbun,
  loadGenbun,
  saveGenbun,
  type GenbunSummary,
} from "../../lib/store";

async function persist(session: GenbunSession): Promise<void> {
  const record = toRecord(session);
  if (record === null) {
    return;
  }
  try {
    await saveGenbun(record);
  } catch (err) {
    logCaughtError(err);
  }
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
      .catch((err) => {
        logCaughtError(err);
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
      .catch((err) => {
        logCaughtError(err);
        setIchiran([]);
      });
  }

  function onPaste(body: string) {
    const next = startGenbun(body);
    if (next !== null) {
      setSession(next);
    }
  }

  function onSelectGengo(gengo: GakushuGengo) {
    if (session === null) {
      return;
    }
    const next = selectGengo(session, gengo);
    if (next === session) {
      return;
    }
    setSession(next);
    void persist(next);
  }

  function onSelectBun(index: number) {
    setSession((prev) => (prev === null ? prev : selectBun(prev, index)));
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
    } catch (err) {
      logCaughtError(err);
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteGenbun(id);
      setSession((prev) => (prev?.id === id ? null : prev));
      refreshIchiran();
    } catch (err) {
      logCaughtError(err);
    }
  }

  function onBackToIchiran() {
    setSession(null);
    refreshIchiran();
  }

  return {
    session,
    setSession,
    persist,
    phase,
    ichiran,
    onPaste,
    onSelectGengo,
    onSelectBun,
    onChangeYakubun,
    onMerge,
    onResplit,
    onOpen,
    onDelete,
    onBackToIchiran,
  };
}
