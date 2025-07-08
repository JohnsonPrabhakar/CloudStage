import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link href="/contact" className="transition-colors hover:text-primary">
            Contact Us
          </Link>
          <span className="hidden md:inline">|</span>
          <Link href="/terms" className="transition-colors hover:text-primary">
            Terms & Conditions
          </Link>
          <span className="hidden md:inline">|</span>
          <Link href="/refund-policy" className="transition-colors hover:text-primary">
            Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
