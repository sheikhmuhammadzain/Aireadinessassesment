"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle, AlertCircle, Search, ExternalLink, ChevronRight } from "lucide-react";
import { CompanyVerificationInfo } from "@/types";
import { fetchCompanyDetails } from "@/lib/openai";

interface CompanyVerificationProps {
  companyName: string;
  onVerify: (verificationInfo: CompanyVerificationInfo) => void;
  onSkip: () => void;
}

export default function CompanyVerification({ companyName, onVerify, onSkip }: CompanyVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationInfo, setVerificationInfo] = useState<CompanyVerificationInfo | null>(null);

  const searchCompany = async () => {
    if (!companyName.trim()) {
      setError("Please enter a company name to verify");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the fetchCompanyDetails function from openai.ts
      const companyDetails = await fetchCompanyDetails(companyName);
      
      const newVerificationInfo: CompanyVerificationInfo = {
        ...companyDetails,
        isVerified: false
      };
      
      setVerificationInfo(newVerificationInfo);
    } catch (err) {
      console.error("Error verifying company:", err);
      setError("Failed to verify company. Please try again or skip verification.");
    } finally {
      setLoading(false);
    }
  };

  const confirmVerification = () => {
    if (verificationInfo) {
      const updatedInfo = {
        ...verificationInfo,
        isVerified: true
      };
      onVerify(updatedInfo);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Verify Company Information</CardTitle>
          <CardDescription>
            We'll search for information about {companyName} to verify its details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!verificationInfo ? (
            <div className="space-y-4">
              <Button 
                onClick={searchCompany}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    Search for "{companyName}"
                  </span>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onSkip}
                disabled={loading}
                className="w-full"
              >
                Skip Verification
              </Button>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{verificationInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">{verificationInfo.industry} · {verificationInfo.size}</p>
                  </div>
                </div>
                
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">{verificationInfo.description}</p>
                </div>
                
                {verificationInfo.sources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Sources:</h4>
                    <ul className="space-y-2">
                      {verificationInfo.sources.map((source, index) => (
                        <li key={index} className="text-sm">
                          <a 
                            href={source.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            {source.title}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button onClick={confirmVerification} className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm This is Correct
                </Button>
                <Button variant="outline" onClick={searchCompany} className="w-full">
                  Search Again
                </Button>
                <Button variant="ghost" onClick={onSkip} className="w-full">
                  Skip Verification
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 