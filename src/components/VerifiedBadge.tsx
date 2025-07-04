import { BadgeCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function VerifiedBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <BadgeCheck className="h-6 w-6 text-green-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Artist</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
