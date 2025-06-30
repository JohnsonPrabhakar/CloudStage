"use client";

import { type Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ThumbsUp, Heart, Clapperboard, Globe } from "lucide-react";
import Image from "next/image";

export default function EventPlayer({ event }: { event: Event }) {
  const videoId = event.streamUrl.split("v=")[1]?.split("&")[0];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] bg-background">
      <div className="flex-grow lg:w-3/4 flex flex-col p-4">
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
          {videoId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              Invalid Video URL
            </div>
          )}
        </div>
        <div className="py-4">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-lg text-muted-foreground">by {event.artist}</p>
            <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline"><Clapperboard className="mr-1 h-3 w-3"/>{event.category}</Badge>
                <Badge variant="outline"><Globe className="mr-1 h-3 w-3"/>{event.language}</Badge>
            </div>
        </div>
      </div>
      <div className="lg:w-1/4 bg-card border-l flex flex-col h-full">
        <CardHeader>
          <CardTitle>Live Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto space-y-4">
            {/* Chat messages placeholder */}
            <div className="flex items-start gap-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <Image src="https://placehold.co/40x40.png" alt="User" fill data-ai-hint="person avatar"/>
                </div>
                <div>
                    <p className="font-bold text-sm">Fan123</p>
                    <p className="text-sm bg-muted p-2 rounded-lg">This is amazing! 🔥</p>
                </div>
            </div>
             <div className="flex items-start gap-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <Image src="https://placehold.co/40x40.png" alt="User" fill data-ai-hint="person avatar"/>
                </div>
                <div>
                    <p className="font-bold text-sm">MusicLover</p>
                    <p className="text-sm bg-muted p-2 rounded-lg">Playing my favorite song!</p>
                </div>
            </div>
             <div className="flex items-start gap-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <Image src="https://placehold.co/40x40.png" alt="User" fill data-ai-hint="person avatar"/>
                </div>
                <div>
                    <p className="font-bold text-sm">Rocker</p>
                    <p className="text-sm bg-muted p-2 rounded-lg">Turn it up! 🤘</p>
                </div>
            </div>
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="icon">
              <ThumbsUp className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Say something..." />
            <Button>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
