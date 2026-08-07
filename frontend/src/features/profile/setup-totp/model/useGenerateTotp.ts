import { useState } from "react";
import { generateTotp } from "../api/generate-totp";

export function useGenerateTotp() {
  // Don't need a React-query for such rare state
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    const response = await generateTotp();
    setQrCode(response.qrCode);
  };

  return {
    handleGenerate,
    qrCode,
  };
}
