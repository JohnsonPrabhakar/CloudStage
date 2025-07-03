
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Ticket, Film } from "lucide-react";

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies", icon: <Film className="h-4 w-4" /> },
    {
      label: "My Tickets",
      href: "/my-tickets",
      icon: <Ticket className="h-4 w-4" />,
    },
    { label: "Artist Dashboard", href: "/artist/dashboard" },
    { label: "Admin", href: "/admin" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="container flex h-16 items-center">
        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex flex-1">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/logo.png" alt="CloudStage Logo" width={32} height={32} />
            <span className="text-xl font-bold">CloudStage</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-primary flex items-center gap-2"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-r-border/50 bg-background/80 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle>
                    <Link
                      href="/"
                      className="flex items-center space-x-2"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <Image src="/logo.png" alt="CloudStage Logo" width={28} height={28} />
                      <span className="text-xl font-bold">CloudStage</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-4 py-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="transition-colors hover:text-primary flex items-center gap-2 text-lg"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 md:hidden">
            <Link href="/" className="flex items-center justify-center space-x-2">
                  <Image src="/logo.png" alt="CloudStage Logo" width={28} height={28} />
                  <span className="text-xl font-bold">CloudStage</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}

    