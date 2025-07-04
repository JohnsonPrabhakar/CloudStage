"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { type VerificationRequest } from "@/lib/types";
import { getPendingVerificationRequestsListener, approveVerificationRequest, rejectVerificationRequest } from "@/lib/firebase-service";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { format } from "date-fns";
import { Loader2, Check, X, Youtube, Instagram, Video, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";

type ArtistVerificationRequestsProps = {
  adminId: string;
};

export default function ArtistVerificationRequests({ adminId }: ArtistVerificationRequestsProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = getPendingVerificationRequestsListener((newRequests) => {
      setRequests(newRequests);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (request: VerificationRequest) => {
    setProcessingId(request.id);
    try {
      await approveVerificationRequest(request.id, request.artistId, adminId);
      toast({ title: "Artist Verified", description: `${request.artistName} has been successfully verified.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Verification Failed", description: "Could not approve the request." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: VerificationRequest) => {
    setProcessingId(request.id);
    try {
      await rejectVerificationRequest(request.id, adminId);
      toast({ title: "Request Rejected", description: `The verification request for ${request.artistName} has been rejected.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not reject the request." });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-12"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading requests...</span></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artist Verification Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {requests.map((request) => (
              <AccordionItem key={request.id} value={request.id}>
                <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                        <span className="font-bold">{request.artistName}</span>
                        <span className="text-sm text-muted-foreground">{format(new Date(request.submittedAt), "PPP")}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/20 rounded-md">
                  <div className="space-y-4">
                     <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><MessageSquare/> Message from Artist</h4>
                        <p className="text-sm text-muted-foreground p-2 bg-background rounded">{request.messageToAdmin}</p>
                     </div>
                     <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Youtube/> YouTube Links</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            {request.youtubeLinks.map((link, i) => <li key={i}><Link href={link} target="_blank" className="text-primary hover:underline">{link}</Link></li>)}
                        </ul>
                     </div>
                      {request.instagramLinks.length > 0 && (
                         <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><Instagram/> Instagram Links</h4>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                                {request.instagramLinks.map((link, i) => <li key={i}><Link href={link} target="_blank" className="text-primary hover:underline">{link}</Link></li>)}
                            </ul>
                        </div>
                      )}
                      {request.sampleVideoUrl && (
                         <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><Video/> Sample Video</h4>
                             <video src={request.sampleVideoUrl} controls className="w-full max-w-sm rounded-md"/>
                        </div>
                      )}
                     <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleReject(request)} disabled={processingId === request.id}>
                            {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><X className="mr-2 h-4 w-4"/> Reject</>}
                        </Button>
                        <Button variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleApprove(request)} disabled={processingId === request.id}>
                            {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Check className="mr-2 h-4 w-4"/> Approve</>}
                        </Button>
                     </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-muted-foreground py-12">No pending verification requests.</p>
        )}
      </CardContent>
    </Card>
  );
}
