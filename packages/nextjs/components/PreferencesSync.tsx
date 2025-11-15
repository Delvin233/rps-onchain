"use client";

import { useUserPreferences } from "~~/hooks/useUserPreferences";

export const PreferencesSync = () => {
  useUserPreferences();
  return null;
};
