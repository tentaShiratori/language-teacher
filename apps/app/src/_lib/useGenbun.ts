import { useState } from "react";
import type { GakushuGengo } from "./gakushu_gengo";
import {
  mergeSelected,
  phaseOf,
  resplitSelected,
  selectBun,
  selectGengo,
  selectNextBun,
  setYakubun,
  startGenbun,
  type GenbunSession,
} from "./genbun";

export function useGenbun() {
  const [session, setSession] = useState<GenbunSession | null>(null);
  const phase = phaseOf(session);

  function onPaste(body: string) {
    const next = startGenbun(body);
    if (next !== null) {
      setSession(next);
    }
  }

  function onSelectGengo(gengo: GakushuGengo) {
    setSession((prev) => (prev === null ? prev : selectGengo(prev, gengo)));
  }

  function onSelectBun(index: number) {
    setSession((prev) => (prev === null ? prev : selectBun(prev, index)));
  }

  function onTab() {
    setSession((prev) => (prev === null ? prev : selectNextBun(prev)));
  }

  function onCtrlEnter() {
    // 判定は後続 issue。選択は動かさない。
  }

  function onChangeYakubun(yakubun: string) {
    setSession((prev) => (prev === null ? prev : setYakubun(prev, yakubun)));
  }

  function onMerge() {
    setSession((prev) => (prev === null ? prev : mergeSelected(prev)));
  }

  function onResplit(caret: number) {
    setSession((prev) => (prev === null ? prev : resplitSelected(prev, caret)));
  }

  return {
    session,
    phase,
    onPaste,
    onSelectGengo,
    onSelectBun,
    onTab,
    onCtrlEnter,
    onChangeYakubun,
    onMerge,
    onResplit,
  };
}
