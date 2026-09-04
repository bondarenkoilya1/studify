import { generateTotp } from "../api/generate-totp";
import { useTotp } from "..";

export function useGenerateTotp() {
  const { qrCode, textKey, setTextKey, setQrCode } = useTotp();

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
