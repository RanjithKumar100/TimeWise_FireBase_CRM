'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, X, Download, Filter } from 'lucide-react';
import { ComplianceCalendarView } from './compliance-calendar-view';
import { cn } from '@/lib/utils/helpers';
import type { Employee } from '@/lib/types';

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: Employee[];
  selectedUser: Employee | null;
  onUserSelect: (user: Employee | null) => void;
  complianceFilter?: string;
  filteredUsers?: Employee[];
}

export function UserSearchDialog({
  open,
  onOpenChange,
  users,
  selectedUser,
  onUserSelect,
  complianceFilter = 'all',
  filteredUsers = users
}: UserSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Use filtered users from compliance filter if provided, otherwise use all users
  const usersToShow = complianceFilter !== 'all' && filteredUsers ? filteredUsers : users;

  const filteredUsersSearch = usersToShow.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUserSelect = (user: Employee) => {
    onUserSelect(user);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
  };

  const downloadCalendarSnapshot = async () => {
    if (!selectedUser || !calendarRef.current) return;

    setIsDownloading(true);
    try {
      // Import html2canvas dynamically to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#ffffff',
        width: calendarRef.current.offsetWidth * 2,
        height: calendarRef.current.offsetHeight * 2,
        logging: false,
        useCORS: true,
        allowTaint: false
      } as any);

      // Create download link
      const link = document.createElement('a');
      link.download = `${selectedUser.name}_timesheet_calendar_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download calendar snapshot:', error);
      alert('Failed to download calendar snapshot. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getComplianceLabel = (filter: string) => {
    switch (filter) {
      case 'high': return 'High Compliance (≥90%)';
      case 'medium': return 'Medium Compliance (70-89%)';
      case 'low': return 'Low Compliance (<70%)';
      default: return 'All Users';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Calendar Inspection
            {complianceFilter !== 'all' && (
              <Badge variant="outline" className="ml-2">
                <Filter className="h-3 w-3 mr-1" />
                {getComplianceLabel(complianceFilter)}
              </Badge>
            )}
          </DialogTitle>
          {selectedUser && (
            <div className="flex justify-start mt-4">
              <Button
                onClick={downloadCalendarSnapshot}
                disabled={isDownloading}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download Calendar'}
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* User Selection Panel */}
          <div className="w-80 flex flex-col border-r pr-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {complianceFilter !== 'all' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing {filteredUsersSearch.length} users in {getComplianceLabel(complianceFilter).toLowerCase()} category
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredUsersSearch.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {complianceFilter !== 'all'
                      ? `No users found in ${getComplianceLabel(complianceFilter).toLowerCase()} category`
                      : 'No users found'}
                  </p>
                </div>
              ) : (
                filteredUsersSearch.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                      selectedUser?.id === user.id && "bg-primary/10 border-primary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        {user.email && (
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          {/* Calendar View Panel */}
          <div className="flex-1 overflow-y-auto">
            {selectedUser ? (
              <div ref={calendarRef}>
                <ComplianceCalendarView
                  user={selectedUser}
                  className="border-0 shadow-none"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Select a User</p>
                  <p className="text-muted-foreground">
                    Choose a user from the list to view their timesheet calendar
                  </p>
                  {complianceFilter !== 'all' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Currently filtering: {getComplianceLabel(complianceFilter)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}