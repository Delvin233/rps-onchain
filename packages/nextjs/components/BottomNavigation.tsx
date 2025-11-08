"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Play, History, User } from "lucide-react";

export const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/play", icon: Play, label: "Play" },
    { path: "/history", icon: History, label: "History" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-lg border-t border-base-300" style={{ maxWidth: '448px', margin: '0 auto' }}>
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center p-2 min-w-0 touch-target transition-all duration-200 ${
                active ? "text-primary shadow-glow-primary" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <Icon size={24} className={`mb-1 transition-transform duration-200 ${active && "scale-110"}`} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
