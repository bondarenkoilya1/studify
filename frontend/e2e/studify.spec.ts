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

test("shows work and deadline days in the current month and opens the task", async ({
  page,
}) => {
  await register(page);
  const subjectName = "Лабораторные по физике";
  const taskName = "Подготовить отчёт";
  const now = new Date();
  const firstOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const month = firstOfMonth.toISOString().slice(0, 7);
  const plannedDate = `${month}-05`;
  const deadlineDate = `${month}-08`;
  await page.clock.setFixedTime(firstOfMonth);

  await page.getByRole("button", { name: "Добавить предмет" }).click();
  const subjectForm = page.getByRole("dialog", { name: "Новый предмет" });
  await subjectForm
    .getByRole("textbox", { name: "Название", exact: true })
    .fill(subjectName);
  await subjectForm.getByRole("button", { name: "Создать предмет" }).click();
  await page.getByRole("link", { name: new RegExp(subjectName) }).click();
  await expect(page).toHaveURL(/\/subjects\/\d+\/?$/);
  const subjectPath = new URL(page.url()).pathname;
  const subjectId = Number(subjectPath.match(/\/subjects\/(\d+)/)?.[1]);
  const historicalTask = await page.request.post(`${apiUrl}/api/tasks/`, {
    data: {
      subject_id: subjectId,
      name: "Задача из старого семестра",
      type: "other",
      status: "not_completed",
      difficulty: "medium",
      priority: "medium",
      deadline_date: "2000-01-05",
    },
  });
  expect(historicalTask.ok()).toBe(true);

  await page.getByRole("button", { name: "Новая задача" }).click();
  const taskForm = page.getByRole("dialog", { name: "Новая задача" });
  await taskForm.getByLabel("Название", { exact: true }).fill(taskName);
  const calendarPopup = page.locator('[data-slot="popover-content"]');
  async function setDate(label: string, date: string) {
    await taskForm.getByLabel(label, { exact: true }).click();
    await calendarPopup
      .locator(`[data-day="${date}"]`)
      .getByRole("button")
      .click();
    await taskForm.getByLabel("Название", { exact: true }).click();
    await expect(calendarPopup).toHaveCount(0);
  }
  await setDate("Запланировано на", plannedDate);
  await setDate("Дедлайн", deadlineDate);
  await taskForm.getByRole("button", { name: "Создать задачу" }).click();
  const card = page.getByRole("article", { name: taskName });
  await expect(card.getByText(/План: 5/)).toBeVisible();
  await page.clock.setFixedTime(new Date());

  const calendarResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/calendar",
  );
  await page.getByRole("link", { name: "Календарь", exact: true }).click();
  await expect(page).toHaveURL(/\/calendar\/?$/);
  const visibleCalendar = await calendarResponse;
  expect(visibleCalendar.ok()).toBe(true);
  const range = new URL(visibleCalendar.url()).searchParams;
  expect(range.get("start_date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(range.get("end_date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const { tasks } = await visibleCalendar.json();
  expect(tasks.map((task: { name: string }) => task.name)).toEqual([taskName]);
  const calendar = page.locator(".exam-calendar");
  const planned = calendar.getByRole("link", {
    name: /План: Подготовить отчёт/,
  });
  const due = calendar.getByRole("link", {
    name: /Срок сдачи: Подготовить отчёт/,
  });
  await expect(planned).toBeVisible();
  await expect(due).toBeVisible();
  await expect(
    planned.locator("xpath=ancestor::*[@data-date][1]"),
  ).toHaveAttribute("data-date", plannedDate);
  await expect(due.locator("xpath=ancestor::*[@data-date][1]")).toHaveAttribute(
    "data-date",
    deadlineDate,
  );
  await expect(
    calendar.getByText("Задача из старого семестра", { exact: true }),
  ).toHaveCount(0);
  await due.focus();
  await due.press("Enter");
  await expect(page).toHaveURL(
    (url) => url.pathname === subjectPath && url.searchParams.has("task"),
  );
  await expect(card).toBeFocused();
  const taskUrl = page.url();

  await page.getByRole("link", { name: "План", exact: true }).click();
  const deadlineLink = page.getByRole("link", { name: /Подготовить отчёт/ });
  await expect(deadlineLink).toHaveAttribute(
    "href",
    new URL(taskUrl).pathname + new URL(taskUrl).search,
  );
  await deadlineLink.click();
  await expect(page).toHaveURL(taskUrl);
  await expect(card).toBeFocused();
  await page.reload();
  await expect(card).toBeFocused();

  const status = page.getByLabel(`Статус задачи «${taskName}»`);
  await status.selectOption("completed");
  await expect(status).toBeEnabled();
  await expect(status).toHaveValue("completed");
  await page.getByRole("link", { name: "Календарь", exact: true }).click();
  await expect(page).toHaveURL(/\/calendar\/?$/);
  await expect(calendar.getByRole("button", { name: "Сегодня" })).toBeVisible();
  await expect(planned).toHaveCount(0);
  await expect(due).toHaveCount(0);

  const otherOverdue = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      page.request.post(`${apiUrl}/api/tasks/`, {
        data: {
          subject_id: subjectId,
          name: `Архивное задание ${index + 1}`,
          type: "other",
          status: "not_completed",
          difficulty: "medium",
          priority: "medium",
          deadline_date: `2001-01-${String(index + 1).padStart(2, "0")}`,
        },
      }),
    ),
  );
  expect(otherOverdue.every((response) => response.ok())).toBe(true);
  await page.goto("/dashboard");
  const overdue = page.getByRole("region", { name: "Просрочено" });
  await expect(overdue.getByRole("link")).toHaveCount(10);
  await expect(overdue.getByText("1–10 из 11", { exact: true })).toBeVisible();
  await overdue.getByRole("button", { name: "Дальше" }).click();
  await expect(
    overdue.getByRole("link", { name: /Архивное задание 10/ }),
  ).toBeVisible();
  await expect(overdue.getByRole("link")).toHaveCount(1);
  await expect(deadlineLink).toHaveCount(0);
});

test("classifies calendar dates in the requested zone and retains legacy instants", async ({
  page,
}) => {
  await register(page);
  const subjectResponse = await page.request.post(`${apiUrl}/api/subjects/`, {
    data: { name: "Проверка часовых поясов" },
  });
  expect(subjectResponse.ok()).toBe(true);
  const { id: subjectId } = await subjectResponse.json();
  const now = new Date();
  const todayIn = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  const west = "Pacific/Pago_Pago";
  const east = "Pacific/Kiritimati";
  const deadlineDate = todayIn(west);
  expect(todayIn(east)).not.toBe(deadlineDate);
  const elapsed = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const defaults = {
    subject_id: subjectId,
    type: "other",
    status: "not_completed",
    difficulty: "medium",
    priority: "medium",
  };
  const datedResponse = await page.request.post(`${apiUrl}/api/tasks/`, {
    data: {
      ...defaults,
      name: "Сдача до конца дня",
      deadline_date: deadlineDate,
      deadline: elapsed,
    },
  });
  expect(datedResponse.ok()).toBe(true);
  const dated = await datedResponse.json();
  const legacyResponse = await page.request.post(`${apiUrl}/api/tasks/`, {
    data: { ...defaults, name: "Сдача в точное время", deadline: elapsed },
  });
  expect(legacyResponse.ok()).toBe(true);
  const legacy = await legacyResponse.json();
  const dashboard = async (timeZone: string) => {
    const r = await page.request.get(`${apiUrl}/api/dashboard`, {
      params: { time_zone: timeZone },
    });
    expect(r.ok()).toBe(true);
    return r.json();
  };

  const western = await dashboard(west);
  expect(western.nearest_deadline_task.id).toBe(dated.id);
  expect(western.overdue_tasks.map((task: { id: number }) => task.id)).toEqual([
    legacy.id,
  ]);
  const eastern = await dashboard(east);
  expect(eastern.nearest_deadline_task).toBeNull();
  expect(
    eastern.overdue_tasks.map((task: { id: number }) => task.id).toSorted(),
  ).toEqual([dated.id, legacy.id].toSorted());

  const invalidZone = await page.request.get(`${apiUrl}/api/dashboard`, {
    params: { time_zone: "Unknown/Study" },
  });
  expect(invalidZone.status()).toBe(400);
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

async function expectNoHorizontalOverflow(page: Page) {
  const { contentWidth, viewportWidth } = await page.evaluate(() => ({
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(
    contentWidth,
    `horizontal overflow on ${new URL(page.url()).pathname}`,
  ).toBeLessThanOrEqual(viewportWidth);
}

test("gives guests a useful home page and sends signed-in visitors to the dashboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Спланируйте учёбу на неделю" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Пример учебной недели" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "К основному содержимому" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  await page.getByRole("link", { name: "Начать", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Создать аккаунт" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await register(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(
    page.getByRole("heading", { name: "План", exact: true }),
  ).toBeVisible();
});

test("keeps navigation and long content usable at 320, 390 and 768 pixels", async ({
  page,
}) => {
  const email = await register(page);
  const subjectName = "Длинноеназвание".repeat(7).slice(0, 100);
  const taskName = "Продолжительнаязадача".repeat(7);
  const subjectResponse = await page.request.post(`${apiUrl}/api/subjects/`, {
    data: { name: subjectName },
  });
  expect(subjectResponse.ok()).toBe(true);
  const { id: subjectId } = await subjectResponse.json();

  const taskResponse = await page.request.post(`${apiUrl}/api/tasks/`, {
    data: {
      subject_id: subjectId,
      name: taskName,
      type: "other",
      status: "not_completed",
      difficulty: "medium",
      priority: "medium",
      deadline_date: "2000-01-01",
    },
  });
  expect(taskResponse.ok()).toBe(true);

  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/subjects");
  const trigger = page.getByRole("button", { name: "Открыть навигацию" });
  await trigger.focus();
  await trigger.press("Enter");
  const navigation = page.getByRole("navigation", { name: "Разделы Studify" });
  const subjectsLink = navigation.getByRole("link", { name: "Предметы" });
  await expect(subjectsLink).toBeFocused();
  await expect(subjectsLink).toHaveAttribute("aria-current", "page");
  await expect(
    navigation.getByRole("link", { name: "Поиск", exact: true }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Общие предметы" }),
  ).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(navigation).toBeHidden();

  await trigger.press("Enter");
  await expect(subjectsLink).toBeFocused();
  await page.keyboard.press("Tab");
  const dashboardLink = navigation.getByRole("link", { name: "План" });
  await expect(dashboardLink).toBeFocused();
  await dashboardLink.press("Enter");
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(navigation).toBeHidden();

  const profile = page.getByRole("button", { name: `Меню аккаунта ${email}` });
  await expect(profile).toBeVisible();
  await expect(profile).not.toContainText(email, { useInnerText: true });
  await profile.focus();
  await profile.press("Enter");
  const account = page.getByRole("dialog", { name: "Настройки аккаунта" });
  await expect(account.getByText(email, { exact: true })).toBeVisible();
  await expect(account.getByRole("link", { name: "Профиль" })).toBeFocused();
  await expect(
    account.getByRole("link", { name: "Общие предметы" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Escape");
  await expect(profile).toBeFocused();

  const screens = [
    ["/subjects", "Предметы"],
    [`/subjects/${subjectId}`, subjectName],
    ["/dashboard", "План"],
    ["/calendar", "Календарь"],
    ["/search", "Поиск"],
    ["/share", "Общие предметы"],
    ["/settings/profile", "Настройки"],
    ["/settings/security", "Настройки"],
    ["/settings/sessions", "Настройки"],
  ] as const;

  /* oxlint-disable eslint/no-await-in-loop -- Each viewport and route reuses the same browser page. */
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 960 });
    for (const [path, heading] of screens) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1, name: heading, exact: true }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  }
  /* oxlint-enable eslint/no-await-in-loop */

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Открыть навигацию" }),
  ).toBeHidden();
  await expect(dashboardLink).toHaveAttribute("aria-current", "page");
  await expect(profile.getByText(email, { exact: true })).toBeVisible();
});

test("recovers a quick draft, adds the first subject and opens a saved task on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page);
  await page.goto("/dashboard");

  const newTask = page.getByRole("button", {
    name: "Новая задача",
    exact: true,
  });
  const form = page.getByRole("dialog", { name: "Новая задача", exact: true });
  const name = form.getByLabel("Название", { exact: true });
  const details = form.getByRole("button", {
    name: "Дополнительные параметры",
  });
  const draftName = "Разобрать материалы";
  const draftNote = "Прочитать главу и составить список вопросов.";

  await newTask.click();
  await expect(form.getByLabel("Описание", { exact: true })).toBeHidden();
  await name.fill(draftName);
  await details.click();
  await form.getByLabel("Описание", { exact: true }).fill(draftNote);
  await page.keyboard.press("Escape");
  await expect(form).toBeHidden();

  await page.reload();
  await newTask.click();
  await expect(name).toHaveValue(draftName);
  await details.click();
  await expect(form.getByLabel("Описание", { exact: true })).toHaveValue(
    draftNote,
  );

  await form.getByRole("button", { name: "Добавить предмет" }).click();
  const subjectDialog = page.getByRole("dialog", {
    name: "Новый предмет",
    exact: true,
  });
  await subjectDialog
    .getByRole("textbox", { name: "Название", exact: true })
    .fill("Физика");
  await subjectDialog
    .getByRole("button", { name: "Создать предмет", exact: true })
    .click();

  const subject = form.getByLabel("Предмет", { exact: true });
  await expect(subject).toHaveValue(/^\d+$/);
  await expect(subject).not.toHaveValue("0");
  await expect(name).toHaveValue(draftName);
  await form
    .getByRole("button", { name: "Создать задачу", exact: true })
    .click();
  await expect(form).toBeHidden();

  const later = page.getByRole("region", { name: "Позже и без даты" });
  const savedTask = later.getByRole("link", { name: /Разобрать материалы/ });
  await expect(savedTask).toBeInViewport();
  await expect(savedTask).toContainText("Физика");
  await expect(savedTask).toContainText("Без даты");
  await expectNoHorizontalOverflow(page);
  await page.reload();
  await savedTask.click();
  await expect(
    page.getByRole("article", { name: draftName, exact: true }),
  ).toBeFocused();
  await expect(page.getByText(draftNote, { exact: true })).toBeVisible();

  await page.goto("/dashboard");
  await newTask.click();
  await expect(name).toHaveValue("");
  const todayName = "Проверить конспект";
  const todayDate = new Date().toISOString().slice(0, 10);
  await name.fill(todayName);
  await form.getByLabel("Дедлайн", { exact: true }).click();
  await page
    .locator('[data-slot="popover-content"]')
    .locator(`[data-day="${todayDate}"]`)
    .getByRole("button")
    .click();
  await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
  await form
    .getByRole("button", { name: "Создать задачу", exact: true })
    .click();
  await expect(form).toBeHidden();
  const today = page.getByRole("region", { name: "Сегодня", exact: true });
  await expect(
    today.getByRole("link", { name: /Проверить конспект/ }),
  ).toBeVisible();

  await page.goto("/calendar");
  const list = page.getByRole("button", { name: "Список", exact: true });
  await expect(list).toHaveAttribute("aria-pressed", "true");
  const due = page.getByRole("link", {
    name: /Срок сдачи:.*Проверить конспект/,
  });
  await expect(due).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Следующий период" }).click();
  await expect(due).toBeHidden();
  await page.getByRole("button", { name: "Сегодня", exact: true }).click();
  await expect(due).toBeVisible();
  const month = page.getByRole("button", { name: "Месяц", exact: true });
  await month.click();
  await expect(month).toHaveAttribute("aria-pressed", "true");
  await expect(due.locator("xpath=ancestor::*[@data-date][1]")).toHaveAttribute(
    "data-date",
    todayDate,
  );
  await list.click();
  await expect(due).toBeVisible();
  await due.click();
  await expect(
    page.getByRole("article", { name: todayName, exact: true }),
  ).toBeFocused();
});

test("searches and sorts owned study work, then edits its reminder and reopens the task after sign-in", async ({
  page,
  browser,
  request,
}) => {
  const email = await register(page);
  await page.goto(await confirmationLink(request, email));
  await expect(
    page.getByRole("heading", { name: "Почта подтверждена" }),
  ).toBeVisible();

  const subjectResponse = await page.request.post(`${apiUrl}/api/subjects/`, {
    data: {
      name: "Практическая физика",
      exam_date: new Date(Date.now() + 86400_000).toISOString(),
    },
  });
  expect(subjectResponse.ok()).toBe(true);
  const { id: subject } = await subjectResponse.json();
  const titles = ["Расчёт тока", "Расчёт нагрузки", "Расчёт в архиве"];
  const taskResponses = await Promise.all(
    titles.map((name, index) =>
      page.request.post(`${apiUrl}/api/tasks/`, {
        data: {
          subject_id: subject,
          name,
          type: "other",
          status: index === 2 ? "completed" : "ongoing",
          difficulty: "medium",
          priority: "medium",
          deadline: new Date(
            Date.now() + (index + 1) * 86400_000,
          ).toISOString(),
        },
      }),
    ),
  );
  expect(taskResponses.every((response) => response.ok())).toBe(true);
  const { id: task } = await taskResponses[0]!.json();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/search?subject=${subject}`);
  await page.getByLabel("Название или описание").fill("РАСЧЁТ");
  await page.getByLabel("Статус задачи").selectOption("ongoing");
  await page.getByLabel("Срок сдачи").selectOption("week");
  await page.getByLabel("Сортировка").selectOption("due");
  await page.getByRole("button", { name: "Найти", exact: true }).click();
  const results = page.getByRole("region", { name: "Результаты поиска" });
  await expect(results.getByRole("link")).toHaveCount(2);
  await expect(results.getByRole("link").first()).toContainText(titles[0]!);
  await expect(results.getByRole("link", { name: /в архиве/ })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await results.getByRole("link").first().click();

  const taskUrl = `/subjects/${subject}?task=${task}`;
  await expect(page).toHaveURL((url) => url.pathname + url.search === taskUrl);
  const card = page.getByRole("article", { name: titles[0], exact: true });
  await expect(card).toBeFocused();
  const reminder = card.getByRole("button", {
    name: `Напоминание «${titles[0]}»`,
  });
  const dialog = page.getByRole("dialog", { name: "Напоминание по почте" });
  await reminder.click();
  const timing = dialog.getByLabel("Когда напомнить до сдачи");
  await timing.selectOption("30");
  await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(dialog.getByText(/Запланировано на/)).toBeVisible();
  await page.reload();
  await reminder.click();
  await expect(timing).toHaveValue("30");
  await dialog.getByRole("button", { name: "Выключить напоминание" }).click();
  await expect(
    dialog.getByRole("button", { name: "Выключить напоминание" }),
  ).toBeHidden();

  const guest = await browser.newPage();
  try {
    await guest.goto(new URL(taskUrl, page.url()).href);
    await expect(guest).toHaveURL(/\/login\?/);
    await signIn(guest, email);
    await expect(guest).toHaveURL(
      (url) => url.pathname + url.search === taskUrl,
    );
    await expect(
      guest.getByRole("article", { name: titles[0], exact: true }),
    ).toBeFocused();
    await guest.goto(
      new URL(`/subjects/${subject}?event=true`, page.url()).href,
    );
    await expect(
      guest.getByRole("region", { name: "Событие предмета" }),
    ).toBeFocused();
  } finally {
    await guest.close();
  }
});
