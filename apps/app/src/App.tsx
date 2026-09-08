import { BunList } from "./_lib/BunList";
import { GakushuGengoSelect } from "./_lib/GakushuGengoSelect";
import { GenbunIndex } from "./_lib/GenbunIndex";
import { GenbunPaste } from "./_lib/GenbunPaste";
import { OllamaSetup } from "./_lib/OllamaSetup";
import { Settings } from "./_lib/Settings";
import { useGenbun } from "./_lib/useGenbun";
import { useHantei } from "./_lib/useHantei";
import { useOllama } from "./_lib/useOllama";
import "./App.css";

function App() {
  const {
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
  } = useGenbun();
  const { ready, status, settings, canHantei, onSaveSettings, onRecheck } = useOllama();
  const { onTab, onCtrlEnter, onHantei, isPending, errorOf } = useHantei({
    session,
    canHantei,
    setSession,
    persist,
  });

  const selectedIndex = session?.selectedIndex ?? 0;

  return (
    <main className="app">
      <h1>言語教師</h1>
      <Settings value={settings} onSave={onSaveSettings} />
      {ready && status !== null && status.kind !== "ok" ? (
        <OllamaSetup status={status} onRecheck={onRecheck} />
      ) : null}
      {phase === "paste" ? (
        <>
          <GenbunIndex items={ichiran} onOpen={onOpen} onDelete={onDelete} />
          <GenbunPaste onPaste={onPaste} />
        </>
      ) : null}
      {phase === "gengo" && session !== null ? (
        <GakushuGengoSelect value={session.gakushuGengo} locked={false} onSelect={onSelectGengo} />
      ) : null}
      {phase === "henshu" && session !== null && session.gakushuGengo !== null ? (
        <>
          <button type="button" className="back-ichiran" onClick={onBackToIchiran}>
            一覧へ
          </button>
          <GakushuGengoSelect value={session.gakushuGengo} locked={true} onSelect={onSelectGengo} />
          <p className="genbun-preview">{session.body}</p>
          <BunList
            buns={session.buns}
            selectedIndex={session.selectedIndex}
            canHantei={canHantei}
            pending={isPending(selectedIndex)}
            error={errorOf(selectedIndex)}
            onSelect={onSelectBun}
            onChangeYakubun={onChangeYakubun}
            onTab={onTab}
            onCtrlEnter={onCtrlEnter}
            onHantei={onHantei}
            onMerge={onMerge}
            onResplit={onResplit}
          />
        </>
      ) : null}
    </main>
  );
}

export default App;
