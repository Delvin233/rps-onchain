import { useState } from "react";

export const useCopyToClipboard = () => {
  const [isCopiedToClipboard, setIsCopiedToClipboard] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopiedToClipboard(true);
      setTimeout(() => {
        setIsCopiedToClipboard(false);
      }, 800);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to copy text:", err);
      }
    }
  };

  return { copyToClipboard, isCopiedToClipboard };
};
