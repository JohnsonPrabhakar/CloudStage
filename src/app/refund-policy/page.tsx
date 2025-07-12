import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Refund Policy</CardTitle>
          <CardDescription>Last updated: July 8, 2024</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Thank you for purchasing a ticket on CloudStage. We appreciate your support for the artists on our platform.
          </p>
          <h4 className="font-bold text-foreground pt-4">Cancellations & Refunds</h4>
          <p>
            All ticket sales are final. We do not offer refunds or exchanges for purchased tickets, including for events that are rescheduled.
          </p>
          <p>
            If an event is cancelled by the artist or CloudStage, a full refund will be automatically processed to your original payment method within 5-7 business days. You will be notified via email if an event you have a ticket for is cancelled.
          </p>
          <h4 className="font-bold text-foreground pt-4">Contact Us</h4>
          <p>
            If you have any questions about our Refund Policy, please contact us at support@cloudstage.in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
