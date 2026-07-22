import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Pin } from "@/lib/types";

interface ReportSummaryProps {
  pins: Pin[];
}

export function ReportSummary({ pins }: ReportSummaryProps) {
  const approved = pins.filter((p) => p.status === "Approved");
  const counts = {
    1: approved.filter((p) => p.level === 1).length,
    2: approved.filter((p) => p.level === 2).length,
    3: approved.filter((p) => p.level === 3).length,
    Fixed: approved.filter((p) => p.level === "Fixed").length,
  };
  const active = counts[1] + counts[2] + counts[3];
  const pendingSync = pins.filter((p) => !p.synced).length;

  return (
    <Card className="w-full sm:w-72">
      <CardHeader>
        <CardTitle>Report Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryRow label="Level 3 — Urgent" value={counts[3]} colorClass="bg-red-950/50 text-red-300" />
        <SummaryRow label="Level 2 — Moderate" value={counts[2]} colorClass="bg-orange-950/50 text-orange-300" />
        <SummaryRow label="Level 1 — Low Risk" value={counts[1]} colorClass="bg-blue-950/50 text-blue-300" />
        <SummaryRow label="Fixed" value={counts.Fixed} colorClass="bg-green-950/50 text-green-300" />
        <div className="pt-2 text-xs text-slate-400">
          {active} active pin{active === 1 ? "" : "s"} on this floor set
        </div>
        {pendingSync > 0 && (
          <div className="rounded-md bg-amber-950/50 px-3 py-2 text-xs font-medium text-amber-300">
            {pendingSync} report{pendingSync === 1 ? "" : "s"} pending upload
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-md px-3 py-2 ${colorClass}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
