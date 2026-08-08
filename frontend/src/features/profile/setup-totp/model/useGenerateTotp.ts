import { useState } from "react";
import { generateTotp } from "../api/generate-totp";

export function useGenerateTotp() {
  // Don't need a React-query for such rare state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [textKey, setTextKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    const response = await generateTotp();
    setQrCode(response.qrCode);
    setTextKey(response.textKey);
  };

  return {
    handleGenerate,
    qrCode,
    textKey,
  };
}
