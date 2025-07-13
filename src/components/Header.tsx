
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, Ticket, Film, User as UserIcon, LogOut, UserCircle, LayoutDashboard } from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getArtistProfile } from "@/lib/firebase-service";

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Only check for an artist profile if the user's email is not the admin email.
        // This prevents unnecessary reads for general users. A better check might be
        // a custom claim, but for this app structure, we assume non-admins might be artists.
        if (user.email !== 'admin@cloudstage.in') {
            const artistProfile = await getArtistProfile(user.uid);
            setIsArtist(!!artistProfile);
        } else {
            setIsArtist(false); // Admin is not an artist
        }
      } else {
        setCurrentUser(null);
        setIsArtist(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push("/");
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies", icon: <Film className="h-4 w-4" /> },
  ];
  
  const ArtistDashboardLink = () => (
    <Link
      href="/artist/dashboard"
      className="transition-colors hover:text-primary flex items-center gap-2"
    >
      <LayoutDashboard className="h-4 w-4" />
      Artist Dashboard
    </Link>
  );
  
   const ArtistLoginLink = () => (
     <Link
        href="/artist/login"
        className="transition-colors hover:text-primary flex items-center gap-2"
      >
        Artist Login
      </Link>
   );


  const UserMenu = () => {
    if (loading) {
      return <Button variant="ghost" size="icon" className="w-24 h-9 rounded-md animate-pulse bg-muted"></Button>;
    }

    if (currentUser) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                 <AvatarImage src={currentUser.photoURL || `https://i.pravatar.cc/40?u=${currentUser.uid}`} alt={currentUser.displayName || currentUser.email || 'User'}/>
                 <AvatarFallback>{currentUser.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{currentUser.displayName || currentUser.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/my-tickets"><Ticket className="mr-2"/> My Tickets</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/user/profile"><UserCircle className="mr-2"/> Edit Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2"/> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
       <Button asChild>
          <Link href="/user/login">
            <UserIcon className="mr-2" />
            User Login
          </Link>
        </Button>
    )
  };
  
  const MobileUserMenu = () => {
     if (loading) {
      return <div className="h-10 bg-muted rounded w-full animate-pulse"></div>;
    }
    if (currentUser) {
      return (
        <>
          <Link href="/my-tickets" className="transition-colors hover:text-primary flex items-center gap-2 text-lg" onClick={() => setIsSheetOpen(false)}>
            <Ticket/> My Tickets
          </Link>
          <Link href="/user/profile" className="transition-colors hover:text-primary flex items-center gap-2 text-lg" onClick={() => setIsSheetOpen(false)}>
            <UserCircle/> Edit Profile
          </Link>
          <button onClick={() => { handleLogout(); setIsSheetOpen(false); }} className="transition-colors text-destructive hover:text-primary flex items-center gap-2 text-lg">
            <LogOut/> Logout
          </button>
        </>
      )
    }
     return (
        <Link href="/user/login" className="transition-colors hover:text-primary flex items-center gap-2 text-lg" onClick={() => setIsSheetOpen(false)}>
            <UserIcon/> User Login
        </Link>
      )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="container flex h-20 items-center">
        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex flex-1">
          <Link href="/" className="mr-6 flex items-center space-x-3">
            <Image src="/logo.png" alt="CloudStage Logo" width={40} height={40} />
            <span className="text-2xl font-bold">CloudStage</span>
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
            {/* Conditionally render artist link only on client after auth check */}
            {!loading && (isArtist ? <ArtistDashboardLink /> : <ArtistLoginLink />)}
          </nav>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <UserMenu />
        </div>


        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:hidden">
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
                      <Image src="/logo.png" alt="CloudStage Logo" width={32} height={32} />
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
                  {!loading && (
                    <Link
                      href={isArtist ? "/artist/dashboard" : "/artist/login"}
                      className="transition-colors hover:text-primary flex items-center gap-2 text-lg"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {isArtist ? <LayoutDashboard/> : <UserIcon />}
                      {isArtist ? 'Artist Dashboard' : 'Artist Login'}
                    </Link>
                  )}
                  <hr className="my-2" />
                  <MobileUserMenu />
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 md:hidden">
            <Link href="/" className="flex items-center justify-center space-x-2">
                  <Image src="/logo.png" alt="CloudStage Logo" width={32} height={32} />
                  <span className="text-xl font-bold">CloudStage</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
