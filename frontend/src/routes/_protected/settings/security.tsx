import { createFileRoute } from "@tanstack/react-router";
import { ChangePasswordSection } from "@/features/profile/change-password";
import { Button } from "@/shared/ui/button";
import { httpClient } from "@/shared/api";
import { useState } from "react";

export const Route = createFileRoute("/_protected/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  const [qrCode, setQrCode] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="min-w-0 flex-1 rounded-2xl border bg-card p-6 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Security settings
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your password and account security.
          </p>
        </div>

        <div className="my-6 border-t" />

        <div className="space-y-6">
          <ChangePasswordSection />
        </div>
        <div className="my-6 ">
          <Button
            className="w-full bg-amber-500! hover:bg-amber-600! text-white"
            onClick={async () => {
              const response = await httpClient.get<{ qrCode: string }>(
                "/api/auth/totp",
              );
              setQrCode(response.qrCode);
            }}
          >
            Generate TOTP
          </Button>
          {qrCode && (
            <img alt="TOTP QR Code" src={`data:image/png;base64,${qrCode}`} />
          )}
        </div>
      </div>
    </div>
  );
}
