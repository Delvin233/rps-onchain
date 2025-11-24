// Lazy-loaded stats card component
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  index: number;
}

export function StatsCard({ title, value, subtitle, icon: Icon, index }: StatsCardProps) {
  return (
    <div
      className="bg-card/50 border border-border rounded-xl p-3 hover:border-primary/50 transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base-content/60 text-xs mb-1">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-base-content/60 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="text-primary" size={20} />
        </div>
      </div>
    </div>
  );
}
