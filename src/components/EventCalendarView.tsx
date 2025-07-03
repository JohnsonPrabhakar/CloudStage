
"use client";

import { useState } from "react";
import { type Event } from "@/lib/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";

type EventCalendarViewProps = {
  events: Event[];
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventCalendarView({ events }: EventCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const eventsByDate = events.reduce((acc, event) => {
    const date = format(new Date(event.date), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  if (events.length === 0) {
    return null; // Don't render the calendar if there are no upcoming events
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground md:gap-2">
          {dayNames.map(day => <div key={day}>{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-2 md:gap-2">
          {Array.from({ length: startingDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="rounded-md bg-muted/20 min-h-[80px] md:min-h-[120px]"></div>
          ))}

          {daysInMonth.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateKey] || [];
            
            return (
              <div
                key={day.toString()}
                className={`border rounded-md p-1 min-h-[80px] flex flex-col transition-colors duration-300 md:p-2 md:min-h-[120px] ${
                  isToday(day) ? "bg-primary/20 border-primary" : "border-border/50"
                } ${!isSameMonth(day, currentDate) ? "bg-muted/30" : "bg-card"}`}
              >
                <time dateTime={format(day, "yyyy-MM-dd")} className={`text-xs font-bold md:text-sm ${isToday(day) ? 'text-primary' : ''}`}>
                  {format(day, "d")}
                </time>
                <div className="flex-grow space-y-1 mt-1 overflow-y-auto">
                    {dayEvents.slice(0, 2).map(event => (
                        <Link key={event.id} href={`/events/${event.id}`} title={event.title}>
                           <Badge variant="secondary" className="w-full text-left truncate block hover:bg-primary/80 transition-colors text-[10px] md:text-xs">
                               {event.title}
                           </Badge>
                        </Link>
                    ))}
                    {dayEvents.length > 2 && (
                        <p className="text-center text-muted-foreground text-[10px] md:text-xs">
                           + {dayEvents.length - 2} more
                        </p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
