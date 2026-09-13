export function InyoMotoField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (inyoMoto: string) => void;
}) {
  return (
    <label className="inyo-moto-field" htmlFor={id}>
      引用元
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="URL や書名（任意）"
      />
    </label>
  );
}
