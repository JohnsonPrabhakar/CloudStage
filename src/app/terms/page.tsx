import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
          <CardDescription>Last updated: July 8, 2024</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Welcome to CloudStage. By accessing or using our platform, you agree to be bound by the following terms:
          </p>
          
          <h4 className="font-bold text-foreground pt-4">1. Embedded Content Usage:</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              CloudStage currently uses <strong>YouTube embedded videos</strong> in the Movies section purely for viewership.
            </li>
            <li>
              All rights and ownership of such videos remain with YouTube or the original content owners.
            </li>
            <li>
              CloudStage does not claim ownership or control over any embedded video content and is not liable for any copyright issues associated with such third-party content.
            </li>
          </ul>

          <h4 className="font-bold text-foreground pt-4">2. Live Events:</h4>
           <ul className="list-disc pl-6 space-y-2">
              <li>
                All events hosted on CloudStage are streamed and organized by registered users (artists or performers).
              </li>
              <li>
                CloudStage serves only as a technology platform to host and distribute live content.
              </li>
              <li>
                CloudStage shall not be held responsible for the accuracy, appropriateness, or legality of any live content streamed by users.
              </li>
            </ul>

          <h4 className="font-bold text-foreground pt-4">3. User Conduct:</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Users agree to use the platform in a respectful and lawful manner.
            </li>
            <li>
              Any abusive, harmful, or illegal behavior (including in chat, comments, or uploads) will result in account suspension.
            </li>
            <li>
              Users are fully responsible for their actions and interactions on the platform.
            </li>
          </ul>

          <h4 className="font-bold text-foreground pt-4">4. Service Modifications:</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              CloudStage is currently in a testing phase. Features may change or evolve over time.
            </li>
            <li>
              CloudStage reserves the right to modify or discontinue any part of the service temporarily or permanently without prior notice.
            </li>
          </ul>

          <h4 className="font-bold text-foreground pt-4">5. Disclaimers:</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              The CloudStage platform is provided "as is" and "as available" without warranties of any kind.
            </li>
            <li>
              We do not guarantee uninterrupted service or platform uptime during the testing phase.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
