import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Search, Filter, Plus } from "lucide-react"

const permits = [
  {
    id: "PRM-2024-001",
    name: "Business License - Food Truck",
    department: "Business Licensing",
    status: "pending",
    submittedDate: "2024-01-28",
    lastUpdated: "2024-01-28",
  },
  {
    id: "PRM-2024-002",
    name: "Building Permit - Deck Construction",
    department: "Building & Safety",
    status: "approved",
    submittedDate: "2024-01-15",
    lastUpdated: "2024-01-20",
  },
  {
    id: "PRM-2024-003",
    name: "Electrical Permit - Kitchen Renovation",
    department: "Electrical Division",
    status: "under-review",
    submittedDate: "2024-01-22",
    lastUpdated: "2024-01-25",
  },
  {
    id: "PRM-2024-004",
    name: "Plumbing Permit - Bathroom Remodel",
    department: "Plumbing Division",
    status: "rejected",
    submittedDate: "2024-01-10",
    lastUpdated: "2024-01-18",
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800"
    case "under-review":
      return "bg-yellow-100 text-yellow-800"
    case "pending":
      return "bg-blue-100 text-blue-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function PermitsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Permits</h1>
            <p className="text-gray-600 mt-2">Track and manage all your permit applications</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Permit</span>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search permits..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {permits.map((permit) => (
          <Card key={permit.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{permit.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">ID: {permit.id}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(permit.status)}>{permit.status.replace("-", " ").toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Department</p>
                  <p className="text-gray-600">{permit.department}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Submitted</p>
                  <p className="text-gray-600">{new Date(permit.submittedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Last Updated</p>
                  <p className="text-gray-600">{new Date(permit.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {permits.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No permits found</h3>
          <p className="text-gray-600 mb-4">{"You haven't submitted any permit applications yet."}</p>
          <Button>Apply for Your First Permit</Button>
        </div>
      )}
    </div>
  )
}
