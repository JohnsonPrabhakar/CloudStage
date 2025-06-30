"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { type Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  ThumbsUp,
  Heart,
  Clapperboard,
  Globe,
  X,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const AdOverlay = ({
  onClose,
  showSkip,
  ctaLink,
  ctaText,
  adImageUrl,
  adImageAlt,
  adAiHint,
}: {
  onClose: () => void;
  showSkip: boolean;
  ctaLink?: string;
  ctaText?: string;
  adImageUrl: string;
  adImageAlt: string;
  adAiHint: string;
}) => (
  <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
    <div className="relative bg-card p-4 rounded-lg shadow-2xl text-center">
      <p className="text-sm text-muted-foreground mb-2">Advertisement</p>
      <Image
        src={adImageUrl}
        width={728}
        height={90}
        alt={adImageAlt}
        className="rounded"
        data-ai-hint={adAiHint}
      />
      {ctaLink && ctaText && (
        <Button asChild className="mt-4">
          <Link href={ctaLink} target="_blank">
            {ctaText}
          </Link>
        </Button>
      )}
      {showSkip && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          Skip Ad <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
);

const initialMessages = [
    { name: 'Fan123', message: 'This is amazing! 🔥' },
    { name: 'MusicLover', message: 'Playing my favorite song!' },
    { name: 'Rocker', message: 'Turn it up! 🤘' },
];

export default function EventPlayer({ event }: { event: Event }) {
  const router = useRouter();
  const videoId = event.streamUrl.split("v=")[1]?.split("&")[0];

  const [showMidRollAd, setShowMidRollAd] = useState(false);
  const [showEndRollAd, setShowEndRollAd] = useState(false);
  const [canSkipAd, setCanSkipAd] = useState(false);
  
  const [chatName, setChatName] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(initialMessages);
  const chatContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Simulate mid-roll ad after 1 minute
    const midRollTimer = setTimeout(() => {
      setShowMidRollAd(true);
    }, 60 * 1000); // 1 minute

    return () => clearTimeout(midRollTimer);
  }, []);

  useEffect(() => {
    if (showMidRollAd) {
      const skipTimer = setTimeout(() => {
        setCanSkipAd(true);
      }, 5000); // 5 seconds
      return () => clearTimeout(skipTimer);
    }
  }, [showMidRollAd]);
  
  useEffect(() => {
    // Auto-scroll chat
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleLeaveEvent = () => {
    setShowEndRollAd(true);
    setTimeout(() => {
      router.back();
    }, 5000); // Show ad for 5 seconds before navigating
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && chatName.trim()) {
        setChatHistory([...chatHistory, { name: chatName, message: chatMessage}]);
        setChatMessage("");
    }
  }

  return (
    <>
      {showMidRollAd && (
        <AdOverlay
          adImageUrl="https://placehold.co/728x90.png"
          adImageAlt="Mid-roll ad"
          adAiHint="advertisement banner"
          onClose={() => setShowMidRollAd(false)}
          showSkip={canSkipAd}
        />
      )}
      {showEndRollAd && (
        <AdOverlay
          adImageUrl="https://placehold.co/800x600.png"
          adImageAlt="End-roll ad"
          adAiHint="product placement"
          onClose={() => {}}
          showSkip={false}
          ctaLink="#"
          ctaText="Visit Sponsor Site"
        />
      )}

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
          <div className="py-4 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <p className="text-lg text-muted-foreground">by {event.artist}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  <Clapperboard className="mr-1 h-3 w-3" />
                  {event.category}
                </Badge>
                <Badge variant="outline">
                  <Globe className="mr-1 h-3 w-3" />
                  {event.language}
                </Badge>
              </div>
            </div>
            <Button variant="destructive" onClick={handleLeaveEvent}>
                <LogOut className="mr-2 h-4 w-4" /> Leave Event
            </Button>
          </div>
        </div>
        <div className="lg:w-1/4 bg-card border-l flex flex-col h-full">
          <CardHeader>
            <CardTitle>Live Chat</CardTitle>
          </CardHeader>
          <CardContent ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-4">
             {chatHistory.map((chat, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={`https://i.pravatar.cc/40?u=${chat.name}`} alt={chat.name} />
                    <AvatarFallback>{chat.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{chat.name}</p>
                    <p className="text-sm bg-muted p-2 rounded-lg max-w-full break-words">
                      {chat.message}
                    </p>
                  </div>
                </div>
             ))}
          </CardContent>
          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2 mb-2">
              <Button variant="outline" size="icon">
                <ThumbsUp className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleSendMessage} className="space-y-2">
                <Input 
                    placeholder="Your name" 
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                />
                <div className="flex gap-2">
                    <Input 
                        placeholder="Say something..." 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <Button type="submit">
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
