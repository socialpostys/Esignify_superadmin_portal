"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Copy, Globe } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DomainPage() {
  const [domain, setDomain] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const generateVerificationCode = () => {
    const code = `signify-verify-${Math.random().toString(36).substring(2, 15)}`
    setVerificationCode(code)
  }

  const verifyDomain = async () => {
    setIsLoading(true)
    // Simulate verification process
    setTimeout(() => {
      setIsVerified(true)
      setIsLoading(false)
    }, 2000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <DashboardLayout userRole="org-admin" orgName="Your Organization">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Domain Configuration</h1>
          <p className="text-slate-600">Connect and verify your organization's domain</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Setup
            </CardTitle>
            <CardDescription>Enter your organization's domain to begin the verification process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="yourcompany.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>

            {!verificationCode && (
              <Button onClick={generateVerificationCode} disabled={!domain}>
                Generate Verification Code
              </Button>
            )}

            {verificationCode && !isVerified && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">DNS Verification Required</h3>
                  <p className="text-sm text-slate-600 mb-3">Add the following TXT record to your DNS settings:</p>
                  <div className="bg-white p-3 rounded border font-mono text-sm">
                    <div className="flex justify-between items-center">
                      <span>Host: @</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard("@")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span>Value: {verificationCode}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(verificationCode)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={verifyDomain} disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Domain"}
                </Button>
              </div>
            )}

            {isVerified && (
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">Domain verified successfully!</span>
                <Badge variant="secondary" className="ml-auto">
                  Verified
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain Status</CardTitle>
            <CardDescription>Current status of your domain configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Domain Ownership</span>
                {isVerified ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Email Integration</span>
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Signature Deployment</span>
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Ready
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
