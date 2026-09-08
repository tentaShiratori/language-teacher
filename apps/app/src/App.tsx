import { BunList } from "./_lib/BunList";
import { GakushuGengoSelect } from "./_lib/GakushuGengoSelect";
import { GenbunIndex } from "./_lib/GenbunIndex";
import { GenbunPaste } from "./_lib/GenbunPaste";
import { useGenbun } from "./_lib/useGenbun";
import "./App.css";

function App() {
  const {
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
  } = useGenbun();

  return (
    <main className="app">
      <h1>言語教師</h1>
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
            onSelect={onSelectBun}
            onChangeYakubun={onChangeYakubun}
            onTab={onTab}
            onCtrlEnter={onCtrlEnter}
            onMerge={onMerge}
            onResplit={onResplit}
          />
        </>
      ) : null}
    </main>
  );
}

export default App;
