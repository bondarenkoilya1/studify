import { generateTotp } from "../api/generate-totp";
import { useTotp } from "@/features/profile/manage-totp";

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
