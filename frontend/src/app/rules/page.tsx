import type { Metadata } from "next";
import { Suspense } from "react";
import { RulesView } from "@/components/rules/rules-view";
import { Card, Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Rules",
  description: "Create, edit, and toggle distributed rate limit policies.",
};

export default function RulesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-16 w-full" />
          <Card className="p-4">
            <Skeleton className="h-10 w-full" />
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-14 w-full" />
              ))}
            </div>
          </Card>
        </div>
      }
    >
      <RulesView />
    </Suspense>
  );
}
