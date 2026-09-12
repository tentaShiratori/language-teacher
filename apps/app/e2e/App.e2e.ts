import { $, expect } from "@wdio/globals";

describe("言語教師", () => {
  it("ウィンドウが開き、見出しが出る", async () => {
    const heading = $("h1");
    await heading.waitForDisplayed();
    await expect(heading).toHaveText("言語教師");
  });

  it("空の原文では進めない", async () => {
    await expect($(".genbun-paste button[type='submit']")).toBeDisabled();
  });

  it("原文を貼って進める", async () => {
    await $("#genbun-body").setValue("今日は雨です。");
    const submit = $(".genbun-paste button[type='submit']");
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect($(".gakushu-gengo-select legend")).toHaveText("学習言語");
  });
});
