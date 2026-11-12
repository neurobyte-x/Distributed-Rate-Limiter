"use client";

import type { ReactNode } from "react";
import { ActivityProvider } from "./activity-provider";
import { HealthProvider } from "./health-provider";
import { RulesProvider } from "./rules-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <HealthProvider>
          <RulesProvider>
            <ActivityProvider>{children}</ActivityProvider>
          </RulesProvider>
        </HealthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
