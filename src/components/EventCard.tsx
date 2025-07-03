import Image from "next/image";
import Link from "next/link";
import { type Event } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Ticket, Play, Sparkles } from "lucide-react";
import { format } from "date-fns";

type EventCardProps = {
  event: Event;
};

const getEventHint = (category: Event['category']): string => {
    switch (category) {
        case 'Music':
            return 'concert stage';
        case 'Stand-up Comedy':
            return 'comedy club';
        case 'Meditation / Yoga':
            return 'yoga meditation';
        case 'Magic Show':
            return 'magician stage';
        case 'Talk':
            return 'panel discussion';
        case 'Devotional / Bhajan / Satsang':
            return 'devotional music';
        case 'Workshop':
            return 'workshop class';
        default:
            return 'live event';
    }
};

export function EventCard({ event }: EventCardProps) {
  const getAction = () => {
    switch (event.status) {
      case "live":
        return {
          text: "Watch Live",
          icon: <Play className="mr-2 h-4 w-4" />,
          href: `/play/${event.id}`,
        };
      case "upcoming":
        return {
          text: "Get Tickets",
          icon: <Ticket className="mr-2 h-4 w-4" />,
          href: `/events/${event.id}`,
        };
      case "past":
        return {
          text: "View Details",
          icon: <ArrowRight className="mr-2 h-4 w-4" />,
          href: `/events/${event.id}`,
        };
    }
  };

  const action = getAction();

  return (
    <Card className="flex flex-col overflow-hidden h-full group">
      <Link href={`/events/${event.id}`} className="block overflow-hidden rounded-t-lg">
        <div className="relative h-48 w-full">
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            data-ai-hint={getEventHint(event.category)}
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           <div className="absolute top-2 right-2 flex gap-2">
            {event.isBoosted && (
                <Badge className="bg-amber-500 text-white shadow-md">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Boosted
                </Badge>
            )}
            <Badge
                className="capitalize shadow-md"
                variant={event.status === "live" ? "destructive" : "secondary"}
            >
                {event.status}
            </Badge>
           </div>
        </div>
      </Link>
      <CardHeader className="flex-grow">
        <Badge variant="outline" className="w-fit mb-2">{event.category}</Badge>
        <Link href={`/events/${event.id}`} className="block">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground">{event.artist}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{format(new Date(event.date), "PPP")}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={action.href}>
            {action.icon}
            {action.text}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
