"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, TestTube } from "lucide-react";

export function EmailConfigForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Email Configuration</h3>
        <p className="text-gray-600">Configure email service provider and templates.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email_provider">Email Provider</Label>
            <Select defaultValue="smtp">
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="aws-ses">AWS SES</SelectItem>
                <SelectItem value="mailgun">Mailgun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input
              id="smtp_host"
              placeholder="smtp.gmail.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="number"
              defaultValue="587"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_user">SMTP Username</Label>
            <Input
              id="smtp_user"
              type="email"
              placeholder="your-email@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_password">SMTP Password</Label>
            <Input
              id="smtp_password"
              type="password"
              placeholder="Enter password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_email">From Email</Label>
            <Input
              id="from_email"
              type="email"
              defaultValue="noreply@quickcourt.com"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enable_ssl">Enable SSL/TLS</Label>
            <p className="text-sm text-gray-500">Use secure connection for email sending</p>
          </div>
          <Switch id="enable_ssl" defaultChecked />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline">
          <TestTube className="w-4 h-4 mr-2" />
          Test Email
        </Button>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
