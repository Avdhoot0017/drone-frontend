'use client';

/**
 * Coming Soon Component - Shown for features under development
 */

import { Construction, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  role?: string;
  description?: string;
  showBackButton?: boolean;
}

export function ComingSoon({
  title,
  role,
  description,
  showBackButton = true,
}: ComingSoonProps) {
  const roleDescriptions: Record<string, string> = {
    operator: 'Operator dashboard for managing daily drone operations, flight logs, and field data entry.',
    acf: 'Assistant Commissioner of Fisheries dashboard for reviewing cases, approvals, and regional oversight.',
    commissioner: 'Commissioner dashboard for high-level analytics, policy decisions, and departmental overview.',
  };

  const displayDescription = description || (role ? roleDescriptions[role] : 'This feature is currently under development.');

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="max-w-lg w-full mx-4 border-2 border-dashed border-gray-300">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                <Construction className="h-10 w-10 text-amber-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h1>

          {/* Role Badge */}
          {role && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                {role === 'acf' ? 'ACF' : role.charAt(0).toUpperCase() + role.slice(1)} Portal
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {displayDescription}
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-sm font-medium text-amber-700">Coming Soon</span>
          </div>

          {/* Features Preview */}
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Upcoming Features
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Role-specific dashboard
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Customized workflow management
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Dedicated reporting tools
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Permission-based access control
              </li>
            </ul>
          </div>

          {/* Back Button */}
          {showBackButton && (
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/settings">
                <ArrowLeft className="h-4 w-4" />
                Go to Settings
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
