import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
            Welcome to CloudStage. These terms and conditions outline the rules and regulations for the use of CloudStage's Website, located at cloudstage.in.
          </p>
          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use CloudStage if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          <h4 className="font-bold text-foreground pt-4">License</h4>
          <p>
            Unless otherwise stated, CloudStage and/or its licensors own the intellectual property rights for all material on CloudStage. All intellectual property rights are reserved. You may access this from CloudStage for your own personal use subjected to restrictions set in these terms and conditions.
          </p>
          <h4 className="font-bold text-foreground pt-4">User Comments</h4>
           <p>
            This Agreement shall begin on the date hereof. Certain parts of this website offer an opportunity for users to post and exchange opinions and information. CloudStage does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of CloudStage, its agents and/or affiliates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
