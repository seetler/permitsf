import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function DisclaimerPage() {
  return (
    <div className="p-6 pt-16 md:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Disclaimer</h1>
        <p className="text-gray-600 mt-2">Important information about using this service</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>General Disclaimer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              The information provided by Permit Tracker is for general informational purposes only.
              All information on the site is provided in good faith, however we make no representation
              or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity,
              reliability, availability, or completeness of any information on the site.
            </p>
            <p>
              Under no circumstance shall we have any liability to you for any loss or damage of any
              kind incurred as a result of the use of the site or reliance on any information provided
              on the site. Your use of the site and your reliance on any information on the site is
              solely at your own risk.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not Professional Advice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              The site cannot and does not contain legal, financial, or professional advice. The
              information is provided for general informational and educational purposes only and is
              not a substitute for professional advice.
            </p>
            <p>
              Accordingly, before taking any actions based upon such information, we encourage you to
              consult with the appropriate professionals. We do not provide any kind of legal,
              financial, or professional advice. The use or reliance of any information contained on
              this site is solely at your own risk.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Permit information displayed on this platform is sourced from public records and
              third-party data providers. While we strive to maintain accurate and up-to-date
              information, we cannot guarantee the accuracy, completeness, or timeliness of permit
              data.
            </p>
            <p>
              For official permit status and requirements, please contact the relevant government
              agencies directly. This service should be used as a supplementary tool and not as the
              sole source of permit information for decision-making purposes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Assistant (Hugo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Hugo, our AI assistant, is designed to help answer questions about permits and provide
              general guidance. However, Hugo is an artificial intelligence system and may occasionally
              provide inaccurate or incomplete information.
            </p>
            <p>
              Responses from Hugo should not be considered as official guidance or professional advice.
              Always verify important information with official sources and consult with qualified
              professionals when making decisions related to permits, construction, or compliance matters.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
