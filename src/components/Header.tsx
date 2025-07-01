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
    width="150"
    height="55"
    viewBox="0 0 200 75"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');
        .logo-font { font-family: 'Bangers', cursive; letter-spacing: 1px; }
        .live-text { font-family: 'Roboto', sans-serif; font-size: 11px; fill: white; font-weight: 500; letter-spacing: 1.5px; }
      `}
    </style>
    
    <defs>
      <path id="text-arc" d="M 5 70 A 90 90 0 0 1 115 15" fill="none" />
    </defs>
    <text className="live-text">
      <textPath href="#text-arc">LIVE ! LOUD ! LIMITLESS</textPath>
    </text>

    <g transform="translate(110, -5) scale(1.2)">
      <path
        d="M23.94,6.21l18.56,9.52a4,4,0,0,1,0,7.22L23.94,32.47a4,4,0,0,1-6-3.61V9.82A4,4,0,0,1,23.94,6.21Z"
        fill="none"
        stroke="white"
        strokeMiterlimit="10"
        strokeWidth="1.5"
      />
      <line
        x1="17.94"
        y1="19.34"
        x2="5.94"
        y2="19.34"
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
      />
      <path
        d="M48.94,13.34a12,12,0,0,1,0,12"
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
      />
       <path
        d="M44.94,16.34a6,6,0,0,1,0,6"
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
      />
    </g>
    
    <text
      x="15"
      y="55"
      className="logo-font"
      fontSize="42"
      fill="#97c03d"
      stroke="#2d2d2d"
      strokeWidth="3"
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      CLOUD
    </text>
    
    <text
      x="65"
      y="72"
      className="logo-font"
      fontSize="42"
      fill="#f28527"
      stroke="#2d2d2d"
      strokeWidth="3"
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      STAGE
    </text>
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
          <Link href="/" className="mr-6 flex items-center">
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
                      className="flex items-center"
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
            <Link href="/" className="flex items-center justify-center">
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
