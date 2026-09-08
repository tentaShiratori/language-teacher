import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { appRoutes, HANTEI_LOG_PATH } from "./appRoutes";

describe("appRoutes", () => {
  test("本編ルートは本編を出す", () => {
    const router = createMemoryRouter(
      appRoutes({
        honban: () => <div>本編</div>,
        hanteiLog: () => <div>判定ログ画面</div>,
      }),
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByText("本編")).toBeTruthy();
    expect(screen.queryByText("判定ログ画面")).toBeNull();
  });

  test("判定ログルートはログ画面を出す", () => {
    const router = createMemoryRouter(
      appRoutes({
        honban: () => <div>本編</div>,
        hanteiLog: () => <div>判定ログ画面</div>,
      }),
      { initialEntries: [HANTEI_LOG_PATH] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByText("判定ログ画面")).toBeTruthy();
    expect(screen.queryByText("本編")).toBeNull();
  });
});
