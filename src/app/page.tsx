import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeIcon, RulerIcon, PackageIcon, UsersIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@stackframe/stack";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Habibi Home</span>
            </div>
            <div className="flex items-center">
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Stop Guessing.
            <span className="text-blue-600"> Plan Perfectly.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Moving into a new home? Don&apos;t buy furniture you&apos;ll regret. Test layouts, measure twice, and create rooms you&apos;ll love living in.
          </p>
          <Link href="/editor">
            <Button size="lg" className="text-lg px-12 py-4 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
              <RulerIcon className="w-5 h-5 mr-2" />
              Start Planning Your Space
            </Button>
          </Link>
        </div>

        {/* Pain Points & Solutions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Before Habibi Home
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-red-700 space-y-2">
                <li>• Bought a couch that was too big for the living room</li>
                <li>• Spent hours moving heavy furniture around</li>
                <li>• Wasted money on items that didn&apos;t fit</li>
                <li>• Argued with your partner about room layouts</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                With Habibi Home
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-green-700 space-y-2">
                <li>• Test furniture layouts before buying</li>
                <li>• Measure once, place perfectly</li>
                <li>• Save money on returns and regrets</li>
                <li>• Make decisions together with ease</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <RulerIcon className="w-5 h-5 text-blue-600" />
                </div>
                Real Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Every piece of furniture uses actual dimensions. No more surprises when your &quot;perfect&quot; sofa arrives and doesn&apos;t fit.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <PackageIcon className="w-5 h-5 text-green-600" />
                </div>
                Smart Furniture Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                From IKEA basics to luxury pieces - find furniture that matches your style and budget, all with accurate sizing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <UsersIcon className="w-5 h-5 text-purple-600" />
                </div>
                Collaborate Easily
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share your floor plans with family, roommates, or your interior designer. Make decisions together, not arguments.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
