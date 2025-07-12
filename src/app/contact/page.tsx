import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            If you have any questions or need assistance, please feel free to reach out to us.
          </p>
          <p>
            <strong>Name:</strong> Johnson Prabhakar J
          </p>
          <p>
            <strong>Email:</strong> support@cloudstage.in
          </p>
          <p>
            <strong>Phone:</strong> +91 8217659321
          </p>
          <p>
            Our support team is available from 9 AM to 6 PM IST, Monday to Friday.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
