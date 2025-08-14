'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Send, Phone, MessageSquare } from 'lucide-react';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
  status?: string;
}

export default function TestTwilioPage() {
  const [phone, setPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [testType, setTestType] = useState<'confirmation' | 'reminder' | 'completion' | 'custom'>('confirmation');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; missing: string[] } | null>(null);

  // Check configuration status on component mount
  useEffect(() => {
    checkConfigStatus();
  }, []);

  const checkConfigStatus = async () => {
    try {
      const response = await fetch('/api/test-twilio');
      const data = await response.json();
      setConfigStatus({
        configured: data.configured,
        missing: data.missing || []
      });
    } catch (error) {
      console.error('Failed to check config status:', error);
    }
  };

  const sendTestSMS = async () => {
    if (!phone) {
      setResult({ success: false, error: 'Please enter a phone number' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const payload: any = {
        phone,
        testType
      };

      if (testType === 'custom') {
        if (!customMessage.trim()) {
          setResult({ success: false, error: 'Please enter a custom message' });
          setIsLoading(false);
          return;
        }
        payload.message = customMessage;
      }

      const response = await fetch('/api/test-twilio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          messageId: data.messageId,
          status: data.status
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to send SMS'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case 'confirmation': return 'Test Ride Confirmation';
      case 'reminder': return 'Test Ride Reminder';
      case 'completion': return 'Test Ride Completion';
      case 'custom': return 'Custom Message';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Twilio SMS Testing</h1>
          <p className="text-gray-600">Test the SMS functionality for SDEBIKE test rides</p>
        </div>

        {/* Configuration Status */}
        {configStatus && (
          <Card className={configStatus.configured ? 'border-green-200' : 'border-red-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {configStatus.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Twilio Configuration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {configStatus.configured ? (
                <p className="text-green-700">✅ Twilio is properly configured and ready to send SMS messages.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-700">❌ Twilio is not configured. Missing environment variables:</p>
                  <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                    {configStatus.missing.map((varName) => (
                      <li key={varName}>{varName}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">
                    Please create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file with the required variables.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-gray-500">
                Enter the phone number where you want to receive the test SMS
              </p>
            </div>

            {/* Test Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Test Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['confirmation', 'reminder', 'completion', 'custom'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={testType === type ? 'default' : 'outline'}
                    onClick={() => setTestType(type)}
                    className="h-10"
                  >
                    {getTestTypeLabel(type)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Message Input */}
            {testType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customMessage" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Custom Message
                </Label>
                <Input
                  id="customMessage"
                  placeholder="Enter your custom message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="h-10"
                />
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={sendTestSMS}
              disabled={isLoading || !configStatus?.configured}
              className="w-full h-12 text-lg"
            >
              {isLoading ? 'Sending...' : 'Send Test SMS'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {result.message}
                    </AlertDescription>
                  </Alert>
                  {result.messageId && (
                    <p className="text-sm text-gray-600">
                      <strong>Message ID:</strong> {result.messageId}
                    </p>
                  )}
                  {result.status && (
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> {result.status}
                    </p>
                  )}
                </div>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {result.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>To use Twilio SMS functionality, you need to:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Create a Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">twilio.com</a></li>
              <li>Get your Account SID and Auth Token from the Twilio Console</li>
              <li>Purchase a phone number or use a trial number</li>
              <li>Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file with:</li>
            </ol>
            <div className="bg-gray-100 p-3 rounded font-mono text-xs">
              TWILIO_ACCOUNT_SID=your_account_sid_here<br/>
              TWILIO_AUTH_TOKEN=your_auth_token_here<br/>
              TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
            </div>
            <p className="text-xs text-gray-600 mt-2">
              <strong>Note:</strong> For testing, you can only send SMS to verified numbers in your Twilio trial account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
