import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

interface TotpContextType {
  qrCode: string;
  setQrCode: (value: string) => void;
  textKey: string;
  setTextKey: (value: string) => void;
}

export const TotpContext = createContext<TotpContextType | undefined>(
  undefined,
);

export function TotpProvider({ children }: { children: ReactNode }) {
  const [qrCode, setQrCode] = useState<string>("");
  const [textKey, setTextKey] = useState<string>("");

  const contextValue = useMemo(
    () => ({
      qrCode,
      setQrCode,
      textKey,
      setTextKey,
    }),
    [qrCode, textKey],
  );

  return (
    <TotpContext.Provider value={contextValue}>{children}</TotpContext.Provider>
  );
}

export function useTotp() {
  const context = useContext(TotpContext);

  if (context === undefined) {
    throw new Error("useTotp must be used within a TotpProvider");
  }

  return context;
}
