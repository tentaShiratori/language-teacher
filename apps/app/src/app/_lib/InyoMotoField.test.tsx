import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { InyoMotoField } from "./InyoMotoField";

describe("InyoMotoField", () => {
  test("値を表示する", () => {
    render(<InyoMotoField id="inyo-moto" value="書名" onChange={() => undefined} />);
    expect(screen.getByLabelText("引用元")).toHaveProperty("value", "書名");
  });

  test("空でも出せる", () => {
    render(<InyoMotoField id="inyo-moto" value="" onChange={() => undefined} />);
    expect(screen.getByLabelText("引用元")).toHaveProperty("value", "");
  });

  test("変更を渡す", () => {
    const onChange = vi.fn<(inyoMoto: string) => void>();
    render(<InyoMotoField id="inyo-moto" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("引用元"), { target: { value: "URL" } });
    expect(onChange).toHaveBeenCalledWith("URL");
  });
});
