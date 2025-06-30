
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

        <div className="grid grid-cols-7 gap-2 text-center font-semibold text-muted-foreground">
          {dayNames.map(day => <div key={day}>{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2 mt-2">
          {Array.from({ length: startingDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="border rounded-md bg-muted/20 min-h-[120px]"></div>
          ))}

          {daysInMonth.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateKey] || [];
            
            return (
              <div
                key={day.toString()}
                className={`border rounded-md p-2 min-h-[120px] flex flex-col ${
                  isToday(day) ? "bg-primary/20 border-primary" : ""
                } ${!isSameMonth(day, currentDate) ? "bg-muted/30" : "bg-card"}`}
              >
                <time dateTime={format(day, "yyyy-MM-dd")} className={`font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                  {format(day, "d")}
                </time>
                <div className="flex-grow space-y-1 mt-1 overflow-y-auto">
                    {dayEvents.map(event => (
                        <Link key={event.id} href={`/events/${event.id}`}>
                           <Badge variant="secondary" className="w-full text-left truncate block hover:bg-primary/80 transition-colors">
                               {event.title}
                           </Badge>
                        </Link>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
