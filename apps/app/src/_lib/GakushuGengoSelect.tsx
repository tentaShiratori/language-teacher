import { GAKUSHU_GENGO_HYOJI, GAKUSHU_GENGO_ICHIRAN, type GakushuGengo } from "./gakushu_gengo";

export function GakushuGengoSelect({
  value,
  locked,
  onSelect,
}: {
  value: GakushuGengo | null;
  locked: boolean;
  onSelect: (gengo: GakushuGengo) => void;
}) {
  if (locked && value !== null) {
    return <p className="gakushu-gengo-locked">学習言語: {GAKUSHU_GENGO_HYOJI[value]}</p>;
  }

  return (
    <fieldset className="gakushu-gengo-select">
      <legend>学習言語</legend>
      {GAKUSHU_GENGO_ICHIRAN.map((gengo) => (
        <label key={gengo}>
          <input
            type="radio"
            name="gakushu-gengo"
            value={gengo}
            checked={value === gengo}
            onChange={() => onSelect(gengo)}
          />
          {GAKUSHU_GENGO_HYOJI[gengo]}
        </label>
      ))}
    </fieldset>
  );
}
