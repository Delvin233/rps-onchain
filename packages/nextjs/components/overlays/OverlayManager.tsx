"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import { X } from "lucide-react";

type OverlayType = "home" | "history" | "profile" | null;

interface OverlayContextType {
  activeOverlay: OverlayType;
  openOverlay: (type: OverlayType) => void;
  closeOverlay: () => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("useOverlay must be used within OverlayProvider");
  return context;
};

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null);

  const openOverlay = (type: OverlayType) => setActiveOverlay(type);
  const closeOverlay = () => setActiveOverlay(null);

  return (
    <OverlayContext.Provider value={{ activeOverlay, openOverlay, closeOverlay }}>{children}</OverlayContext.Provider>
  );
};

export const OverlayContainer = ({ type, children }: { type: OverlayType; children: ReactNode }) => {
  const { activeOverlay, closeOverlay } = useOverlay();
  const isOpen = activeOverlay === type;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0 bottom-16 bg-base-200 rounded-t-3xl shadow-2xl animate-slide-up overflow-y-auto">
        <button onClick={closeOverlay} className="absolute top-4 right-4 z-10 btn btn-sm btn-circle btn-ghost">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};
