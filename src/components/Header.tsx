"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Ticket, Film } from "lucide-react";

const Logo = ({ className }: { className?: string }) => (
  <svg
    width="35"
    height="35"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="20" fill="hsl(var(--primary))" />
    <path
      d="M30 70L50 30L70 70"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M40 60H60"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="10"
      strokeLinecap="round"
    />
  </svg>
);


export function Header() {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center gap-2">
            <Logo className="rounded-md" />
            <span className="font-bold text-lg">CloudStage</span>
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>
                    <Link
                      href="/"
                      className="flex items-center gap-2"
                    >
                      <Logo className="rounded-md" />
                       <span className="font-bold text-lg">CloudStage</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-4 py-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="transition-colors hover:text-primary flex items-center gap-2 text-lg"
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
            <Link href="/" className="flex items-center justify-center gap-2">
                <Logo className="h-9 w-auto object-contain rounded-md" />
                <span className="font-bold text-lg">CloudStage</span>
            </Link>
          </div>
          
          <div className="hidden md:flex">
            <nav className="flex items-center">
                <Button asChild>
                    <Link href="/artist/register">Get Started</Link>
                </Button>
            </nav>
          </div>

        </div>
      </div>
    </header>
  );
}
