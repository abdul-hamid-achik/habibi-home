import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Loading Card */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Animated Spinner */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-pulse"></div>
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
              </div>

              {/* Loading Text */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Loading...
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Please wait while we prepare your content
                </p>
              </div>

              {/* Loading Skeleton */}
              <div className="w-full space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="animate-pulse">
                  Processing
                </Badge>
                <Badge variant="outline" className="animate-pulse delay-150">
                  Optimizing
                </Badge>
                <Badge variant="outline" className="animate-pulse delay-300">
                  Loading
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 dark:bg-purple-900/20 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
