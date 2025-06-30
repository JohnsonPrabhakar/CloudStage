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
import { ArrowRight, Calendar, Ticket, Play } from "lucide-react";

type EventCardProps = {
  event: Event;
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
    <Card className="flex flex-col overflow-hidden h-full transition-all hover:shadow-xl hover:-translate-y-1">
      <Link href={`/events/${event.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={event.bannerUrl}
            alt={event.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="concert crowd"
          />
          <Badge
            className="absolute top-2 right-2 capitalize"
            variant={event.status === "live" ? "destructive" : "secondary"}
          >
            {event.status}
          </Badge>
        </div>
      </Link>
      <CardHeader className="flex-grow">
        <Link href={`/events/${event.id}`} className="block">
          <CardTitle className="text-xl hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground">{event.artist}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{new Date(event.date).toLocaleDateString()}</span>
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
