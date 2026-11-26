import { expect, it } from "vitest";
import { resetPasswordSchema } from "@/features/auth/login-by-email/model/reset-password/reset-password.schema";
import { RegisterByEmailSchema } from "@/features/auth/register-by-email/model/schema";
import { ChangePasswordSchema } from "@/features/profile/change-password/model/schema";
import { ChangeEmailSchema } from "@/features/profile/change-email/model/schema";

it.each([
  ["я".repeat(7), false],
  ["я".repeat(8), true],
  ["я".repeat(36), true],
  ["я".repeat(36) + "a", false],
  ["😀".repeat(7), false],
] as const)(
  "uses the same Unicode and byte rules on all password forms",
  (password, accepted) => {
    expect(
      RegisterByEmailSchema.safeParse({
        email: "student@example.com",
        password,
      }).success,
    ).toBe(accepted);
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: "oldPassword",
        newPassword: password,
      }).success,
    ).toBe(accepted);
    expect(
      resetPasswordSchema.safeParse({
        new_password: password,
        new_password_confirmed: password,
      }).success,
    ).toBe(accepted);
  },
);

it("requires the current password to change the email", () => {
  expect(
    ChangeEmailSchema.safeParse({
      newEmail: "student@example.com",
      currentPassword: "",
    }).success,
  ).toBe(false);
});
