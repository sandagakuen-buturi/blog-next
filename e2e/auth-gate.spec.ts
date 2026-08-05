import { test, expect } from "@playwright/test";

/**
 * Google OAuthを実際に通す認証済みフローは、テスト用のダミーGoogleアカウントが
 * 用意できないため自動化していない(このアプリはsandagakuen.ed.jpドメインの実アカウント
 * でのログインのみを許可するため)。ここではproxy.tsの未認証ガードと、ログイン画面自体の
 * 表示だけを検証する。認証後の主要導線(投稿・承認等)は各Phaseの実装時に手動で確認済み。
 */

test("visiting the app while signed out redirects to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("login page shows the Google sign-in button and domain hint", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("sandagakuen.ed.jp")).toBeVisible();
  await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
});

test("a protected feature route also redirects to /login when signed out", async ({ page }) => {
  await page.goto("/blog");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fblog/);
});
