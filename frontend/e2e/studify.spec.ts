import { createHmac, randomUUID } from "node:crypto";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const mailpit = process.env.E2E_MAILPIT_URL ?? "http://localhost:8025";
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8080";
const password = "StudifyTestPassword123";

interface MailSummary {
  ID: string;
  To: Array<{ Address: string }>;
}

async function register(page: Page) {
  const email = `studify-${randomUUID()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Эл. почта", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/subjects\/?$/);
  return email;
}

async function signIn(page: Page, email: string) {
  await page.getByLabel("Эл. почта", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
}

async function confirmationLink(request: APIRequestContext, email: string) {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const inbox = await request.get(`${mailpit}/api/v1/messages`);
        if (!inbox.ok()) return false;
        const { messages }: { messages: MailSummary[] } = await inbox.json();
        const summary = messages.find((message) =>
          message.To.some(({ Address }) => Address === email),
        );
        if (!summary) return false;
        const emailResponse = await request.get(
          `${mailpit}/api/v1/message/${summary.ID}`,
        );
        if (!emailResponse.ok()) return false;
        const { Text }: { Text: string } = await emailResponse.json();
        link = Text.match(/https?:\/\/[^\s<]+\/confirm\?token=[\w-]+/)?.[0];
        return Boolean(link);
      },
      {
        message: "Mailpit received a confirmation link for the test account",
        timeout: 15_000,
      },
    )
    .toBe(true);
  if (!link) throw new Error("Confirmation link missing from Mailpit message");
  return link;
}

function currentAuthenticatorCode(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes: number[] = [];
  let bits = 0;
  let buffer = 0;
  for (const char of secret.replace(/=+$/, "")) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error("Invalid base32 authenticator secret");
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", Buffer.from(bytes))
    .update(counter)
    .digest();
  const offset = digest.readUInt8(digest.length - 1) & 0x0f;
  return String(
    (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000,
  ).padStart(6, "0");
}

test("registers, then confirms the email after signing in from the link", async ({
  page,
  browser,
  request,
}) => {
  const email = await register(page);
  const link = await confirmationLink(request, email);

  const guest = await browser.newPage();
  try {
    await guest.goto(link);
    await expect(guest).toHaveURL(/\/login\?/);
    await signIn(guest, email);
    await expect(
      guest.getByRole("heading", { name: "Почта подтверждена" }),
    ).toBeVisible();

    const session = await guest.request.get(`${apiUrl}/api/auth/session`);
    expect(await session.json()).toMatchObject({
      user: { email, is_email_verified: true },
    });
  } finally {
    await guest.close();
  }
});

test("enables 2FA and completes the next login with an authenticator code", async ({
  page,
  browser,
  request,
  baseURL,
}) => {
  const email = await register(page);
  await page.goto(await confirmationLink(request, email));
  await expect(
    page.getByRole("heading", { name: "Почта подтверждена" }),
  ).toBeVisible();

  await page.goto("/settings/security");
  const setupResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.replace(/\/$/, "") ===
        "/api/auth/totp/setup",
  );
  await page.getByRole("button", { name: "Настроить аутентификатор" }).click();
  const setup = await setupResponse;
  expect(setup.ok()).toBe(true);
  const { text_key }: { text_key: string } = await setup.json();
  await expect(
    page.getByRole("img", { name: "QR-код для настройки аутентификатора" }),
  ).toBeVisible();
  await page
    .getByLabel("Код аутентификатора", { exact: true })
    .fill(currentAuthenticatorCode(text_key));
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  const codes = page.getByRole("dialog", { name: "Сохраните резервные коды" });
  await expect(codes.locator("code")).toHaveCount(10);
  await codes.getByRole("button", { name: "Готово" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Двухфакторная аутентификация включена",
    }),
  ).toBeVisible();

  const guest = await browser.newPage();
  try {
    await guest.goto(new URL("/login", baseURL).href);
    await signIn(guest, email);
    await expect(
      guest.getByRole("heading", { name: "Подтвердите вход" }),
    ).toBeVisible();
    await guest
      .getByLabel("Код аутентификатора", { exact: true })
      .fill(currentAuthenticatorCode(text_key));
    await guest.getByRole("button", { name: "Продолжить" }).click();
    await expect(guest).toHaveURL(/\/subjects\/?$/);
  } finally {
    await guest.close();
  }
});

test("creates a subject and task, opens its month and removes completed work from the calendar", async ({
  page,
}) => {
  await register(page);
  const subjectName = "Лабораторные по физике";
  const taskName = "Подготовить отчёт";

  await page.getByRole("button", { name: "Добавить предмет" }).click();
  const subjectForm = page.getByRole("dialog", { name: "Новый предмет" });
  await subjectForm
    .getByRole("textbox", { name: "Название", exact: true })
    .fill(subjectName);
  await subjectForm.getByRole("button", { name: "Создать предмет" }).click();
  const subjectLink = page.getByRole("link", { name: new RegExp(subjectName) });
  await expect(subjectLink).toBeVisible();
  await subjectLink.click();
  await expect(page).toHaveURL(/\/subjects\/\d+\/?$/);
  const subjectUrl = page.url();

  await page.getByRole("button", { name: "Новая задача" }).click();
  const taskForm = page.getByRole("dialog", { name: "Новая задача" });
  await taskForm.getByLabel("Название", { exact: true }).fill(taskName);
  await taskForm.getByLabel("Запланировано на").click();
  await page
    .locator('[data-slot="popover-content"]')
    .getByRole("button", { name: /\b15\b/ })
    .click();
  await taskForm.getByLabel("Название", { exact: true }).click();
  await taskForm.getByRole("button", { name: "Создать задачу" }).click();
  await expect(page.getByRole("heading", { name: taskName })).toBeVisible();

  await page
    .getByRole("link", { name: "Календарь экзаменов", exact: true })
    .click();
  await expect(page).toHaveURL(/\/calendar\/?$/);
  const calendar = page.locator(".exam-calendar");
  const event = calendar.getByText(taskName, { exact: true });
  await expect(event).toBeVisible();
  await event.click();
  await expect(page).toHaveURL(subjectUrl);
  await expect(
    page.getByRole("heading", { name: subjectName, exact: true }),
  ).toBeVisible();
  const status = page.getByLabel(`Статус задачи «${taskName}»`);
  await status.selectOption("completed");
  await expect(status).toBeEnabled();
  await expect(status).toHaveValue("completed");
  await page
    .getByRole("link", { name: "Календарь экзаменов", exact: true })
    .click();
  await expect(page).toHaveURL(/\/calendar\/?$/);
  await expect(calendar.getByRole("button", { name: "Сегодня" })).toBeVisible();
  await expect(event).toHaveCount(0);
});

test("uses theme colors and keeps the password dialog usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page
    .locator("html")
    .evaluate((element) => element.classList.add("dark"));

  await page.getByRole("button", { name: "Забыли пароль?" }).click();
  const dialog = page.getByRole("dialog", { name: "Восстановление пароля" });
  const email = dialog.getByLabel("Эл. почта");
  await expect(email).toBeVisible();
  await expect(dialog).toHaveCSS("background-color", "oklch(0.205 0 0)");
  await expect(email).toHaveCSS("background-color", "oklch(0.145 0 0)");
  expect(
    await dialog.evaluate((element) => element.scrollWidth),
  ).toBeLessThanOrEqual(390);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Забыли пароль?" }),
  ).toBeFocused();
});
