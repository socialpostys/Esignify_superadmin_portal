"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, RefreshCw, Server, Globe } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DNSPage() {
  const [nameservers, setNameservers] = useState<string[]>([])
  const [dnsProvider, setDnsProvider] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const checkNameservers = async () => {
    setIsLoading(true)
    // Simulate DNS lookup
    setTimeout(() => {
      setNameservers(["ns1.cloudflare.com", "ns2.cloudflare.com"])
      setDnsProvider("Cloudflare")
      setIsLoading(false)
    }, 1500)
  }

  useEffect(() => {
    checkNameservers()
  }, [])

  const dnsProviders = [
    {
      name: "Cloudflare",
      nameservers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
      features: ["Free tier", "Fast global network", "Easy management"],
      recommended: true,
    },
    {
      name: "AWS Route 53",
      nameservers: ["ns-xxx.awsdns-xx.com", "ns-xxx.awsdns-xx.net"],
      features: ["Enterprise reliability", "Advanced routing", "AWS integration"],
      recommended: false,
    },
    {
      name: "Google Cloud DNS",
      nameservers: ["ns-cloud-xx.googledomains.com"],
      features: ["Google infrastructure", "Good performance", "Simple setup"],
      recommended: false,
    },
  ]

  return (
    <DashboardLayout userRole="org-admin" orgName="Your Organization">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DNS Configuration</h1>
          <p className="text-slate-600">Manage your domain's DNS settings and nameservers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Current Nameservers
            </CardTitle>
            <CardDescription>Your domain's current DNS configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">DNS Provider</span>
                <Badge variant={dnsProvider ? "default" : "secondary"}>{dnsProvider || "Unknown"}</Badge>
              </div>

              <div className="space-y-2">
                <span className="font-medium">Nameservers:</span>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Checking nameservers...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {nameservers.map((ns, index) => (
                      <div key={index} className="font-mono text-sm bg-slate-100 p-2 rounded">
                        {ns}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={checkNameservers} disabled={isLoading} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="providers">DNS Providers</TabsTrigger>
            <TabsTrigger value="records">DNS Records</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <div className="grid gap-4">
              {dnsProviders.map((provider) => (
                <Card key={provider.name} className={provider.recommended ? "border-blue-200" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {provider.name}
                      {provider.recommended && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          Recommended
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium">Nameservers:</span>
                        <div className="mt-1 space-y-1">
                          {provider.nameservers.map((ns, index) => (
                            <div key={index} className="font-mono text-sm bg-slate-100 p-2 rounded">
                              {ns}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Features:</span>
                        <ul className="mt-1 space-y-1">
                          {provider.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Required DNS Records</CardTitle>
                <CardDescription>DNS records needed for the Email Signature Platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Domain Verification</span>
                      <Badge variant="secondary">TXT Record</Badge>
                    </div>
                    <div className="font-mono text-sm bg-slate-100 p-2 rounded">
                      Host: @ <br />
                      Value: signify-verify-[your-code]
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Signature Hosting (Optional)</span>
                      <Badge variant="secondary">CNAME Record</Badge>
                    </div>
                    <div className="font-mono text-sm bg-slate-100 p-2 rounded">
                      Host: signatures <br />
                      Value: signatures.signifyplatform.com
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
                <CardDescription>Solutions for common DNS configuration problems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">DNS Propagation Delays</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      DNS changes can take 24-48 hours to propagate globally.
                    </p>
                    <Badge variant="outline">Solution: Wait and check again later</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">TXT Record Not Found</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      The verification TXT record cannot be found in your DNS.
                    </p>
                    <Badge variant="outline">Solution: Double-check record format and host</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Multiple DNS Providers</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Your domain might be using different nameservers than expected.
                    </p>
                    <Badge variant="outline">Solution: Verify nameservers at your registrar</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
