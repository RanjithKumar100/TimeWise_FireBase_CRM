'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Activity,
  Search, 
  RefreshCw,
  Eye,
  Calendar,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  logId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'STATUS_CHANGE';
  entityType: 'User' | 'WorkLog' | 'System';
  entityId: string;
  performedBy: string;
  performedByName: string;
  performedByRole: 'Admin' | 'User';
  details: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    additionalInfo?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const actionColors = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  PASSWORD_CHANGE: 'bg-orange-100 text-orange-800',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-800'
};

const mockAuditLogs: AuditLog[] = [
  {
    logId: '1',
    action: 'CREATE',
    entityType: 'User',
    entityId: 'user123',
    performedBy: 'admin1',
    performedByName: 'Alex Johnson',
    performedByRole: 'Admin',
    details: {
      newValues: {
        name: 'John Doe',
        email: 'john.doe@timewise.com',
        role: 'User'
      },
      additionalInfo: 'User created via admin panel'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Chrome',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
  },
  {
    logId: '2',
    action: 'UPDATE',
    entityType: 'User',
    entityId: 'user456',
    performedBy: 'admin1',
    performedByName: 'Alex Johnson',
    performedByRole: 'Admin',
    details: {
      oldValues: {
        role: 'User',
        isActive: true
      },
      newValues: {
        role: 'Admin',
        isActive: true
      },
      additionalInfo: 'Role updated from User to Admin'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Chrome',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  },
  {
    logId: '3',
    action: 'LOGIN',
    entityType: 'User',
    entityId: 'user789',
    performedBy: 'user789',
    performedByName: 'Maria Garcia',
    performedByRole: 'User',
    details: {
      additionalInfo: 'Successful login'
    },
    ipAddress: '192.168.1.150',
    userAgent: 'Mozilla/5.0 Safari',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
  },
  {
    logId: '4',
    action: 'DELETE',
    entityType: 'WorkLog',
    entityId: 'worklog123',
    performedBy: 'admin1',
    performedByName: 'Alex Johnson',
    performedByRole: 'Admin',
    details: {
      oldValues: {
        task: 'Video Editing',
        hoursSpent: 8,
        date: '2024-01-15'
      },
      additionalInfo: 'Work log deleted by admin override'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Chrome',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  },
  {
    logId: '5',
    action: 'PASSWORD_CHANGE',
    entityType: 'User',
    entityId: 'user456',
    performedBy: 'user456',
    performedByName: 'James Smith',
    performedByRole: 'User',
    details: {
      additionalInfo: 'Password changed by user'
    },
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 Firefox',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
  }
];

export default function AuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const result = await response.json();
      setLogs(result.data.auditLogs || []);
      toast({
        title: "Success",
        description: "Audit logs refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.additionalInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress?.includes(searchTerm)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Entity type filter
    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.entityType === entityTypeFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(log => log.performedByRole === roleFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (dateRange) {
        case '1h':
          cutoffDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(log => new Date(log.createdAt) >= cutoffDate);
    }

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setEntityTypeFilter('all');
    setRoleFilter('all');
    setDateRange('all');
  };

  const exportLogs = () => {
    // In a real app, this would generate and download a CSV/Excel file
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Action,Entity Type,Entity ID,Performed By,Role,IP Address,Details\n"
      + filteredLogs.map(log => 
          `"${new Date(log.createdAt).toLocaleString()}","${log.action}","${log.entityType}","${log.entityId}","${log.performedByName}","${log.performedByRole}","${log.ipAddress || 'N/A'}","${log.details.additionalInfo || 'N/A'}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Audit logs exported successfully",
    });
  };

  const openDetailDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now.getTime() - logTime.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, actionFilter, entityTypeFilter, roleFilter, dateRange, logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Audit Logs</h2>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="action-filter">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">Password Change</SelectItem>
                  <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-filter">Entity Type</Label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="WorkLog">Work Log</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-filter">Performed By Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Showing {filteredLogs.length} of {logs.length} audit log entries
        </AlertDescription>
      </Alert>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Chronological record of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.logId}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{formatTimestamp(log.createdAt)}</span>
                        <span className="text-xs text-muted-foreground">{getTimeAgo(log.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={actionColors[log.action]}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.entityType}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.entityId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.performedByName}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.performedBy}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.performedByRole === 'Admin' ? 'default' : 'secondary'}>
                        {log.performedByRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailDialog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                        <span>No audit logs found matching your criteria</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm text-muted-foreground">{formatTimestamp(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <Badge variant="secondary" className={actionColors[selectedLog.action]}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.entityType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedLog.entityId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Performed By</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.performedByName} ({selectedLog.performedBy})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Badge variant={selectedLog.performedByRole === 'Admin' ? 'default' : 'secondary'}>
                    {selectedLog.performedByRole}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.userAgent || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.details.additionalInfo && (
                <div>
                  <Label className="text-sm font-medium">Additional Information</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.details.additionalInfo}</p>
                </div>
              )}

              {selectedLog.details.oldValues && (
                <div>
                  <Label className="text-sm font-medium">Old Values</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                    {JSON.stringify(selectedLog.details.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.details.newValues && (
                <div>
                  <Label className="text-sm font-medium">New Values</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                    {JSON.stringify(selectedLog.details.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}