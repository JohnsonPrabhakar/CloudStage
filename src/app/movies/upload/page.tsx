
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { MovieForm } from "@/components/MovieForm";

export const dynamic = 'force-dynamic';

export default function UploadMoviePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@cloudstage.in') {
        setIsAuthenticated(true);
      } else {
        toast({ variant: 'destructive', title: 'Access Denied' });
        router.push("/admin");
      }
    });
    return () => unsubscribe();
  }, [router, toast]);
  
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
         <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  return (
    <MovieForm mode="create" />
  );
}
