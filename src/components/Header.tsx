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
    viewBox="0 0 320 120"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ fontFamily: "'Permanent Marker', cursive", height: "50px", width: "auto" }}
  >
    <defs>
      <path id="curve" d="M 10,90 C 40,30 140,30 170,90" fill="transparent" />
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
      </filter>
    </defs>

    {/* Megaphone */}
    <g transform="translate(180, -10) scale(0.7)">
      <path d="M43.27,34.18,25.4,52.05a2.5,2.5,0,0,1-3.54,0l-5.3-5.3a2.5,2.5,0,0,1,0-3.54L34.43,25.34" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M53.7,1.32,38.14,16.88a5,5,0,0,0,0,7.07l11.49,11.49a5,5,0,0,0,7.07,0L72.26,20A2.5,2.5,0,0,0,72.26,16.5L57.24,1.48A2.5,2.5,0,0,0,53.7,1.32Z" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="75.9" y1="2.76" x2="79.9" y2="6.76" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="82.46" y1="13.31" x2="85.79" y2="16.64" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="84.28" y1="24.46" x2="86.64" y2="26.82" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </g>

    {/* Arced Text */}
    <text fill="white" fontSize="20" letterSpacing="1">
      <textPath href="#curve">
        LIVE ! LOUD ! LIMITLESS
      </textPath>
    </text>

    {/* Main Text */}
    <g filter="url(#shadow)">
      <text x="10" y="75" fill="#95C83D" stroke="#2a2a2a" strokeWidth="3" fontSize="60">CLOUD</text>
      <text x="70" y="115" fill="#F48144" stroke="#2a2a2a" strokeWidth="3" fontSize="60">STAGE</text>
    </g>
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
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
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
                      className="flex items-center space-x-2"
                    >
                      <Logo />
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
            <Link href="/" className="flex items-center justify-center space-x-2">
                  <Logo />
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
