
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function EventAnalyticsDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Dashboard</CardTitle>
        <CardDescription>
          The analytics dashboard is temporarily disabled to resolve a build issue.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center py-12">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading analytics...</p>
      </CardContent>
    </Card>
  );
}
