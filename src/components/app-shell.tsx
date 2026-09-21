import Link from "next/link";
import {
  Home,
  TrendingUp,
  Star,
  Users,
  Trophy,
  Swords,
  GraduationCap,
  Map,
  Backpack,
  User,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Portfolio", href: "/portfolio", icon: TrendingUp },
  { name: "Team", href: "/team", icon: Users },
  { name: "Rangliste", href: "/leaderboard", icon: Trophy },
  { name: "Wettbewerbe", href: "/competitions", icon: Swords },
  { name: "Lernen", href: "/learn", icon: GraduationCap },
  { name: "Quests", href: "/quests", icon: Map },
  { name: "Sammlung", href: "/collection", icon: Backpack },
  { name: "Profil", href: "/profile", icon: User },
  { name: "Watchlist", href: "/watchlist", icon: Star },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[#0d0d11] lg:block">
        <div className="flex h-20 items-center px-6">
          <Link href="/dashboard" className="text-2xl font-bold">
            Trade
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Verse
            </span>
          </Link>
        </div>

        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <Icon size={19} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-screen pb-24 lg:ml-64 lg:pb-0">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0d0d11]/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 py-3 text-xs text-zinc-400">
            <Home size={20} />
            Home
          </Link>

          <Link href="/portfolio" className="flex flex-col items-center gap-1 py-3 text-xs text-zinc-400">
            <TrendingUp size={20} />
            Portfolio
          </Link>

          <Link href="/competitions" className="flex flex-col items-center gap-1 py-3 text-xs text-zinc-400">
            <Swords size={20} />
            Events
          </Link>

          <Link href="/learn" className="flex flex-col items-center gap-1 py-3 text-xs text-zinc-400">
            <GraduationCap size={20} />
            Lernen
          </Link>

          <Link href="/profile" className="flex flex-col items-center gap-1 py-3 text-xs text-zinc-400">
            <User size={20} />
            Profil
          </Link>
        </div>
      </nav>
    </div>
  );
}