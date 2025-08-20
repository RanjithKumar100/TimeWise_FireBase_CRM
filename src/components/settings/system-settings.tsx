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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Save,
  RefreshCw,
  Database,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemConfig {
  // Work Log Settings
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  editTimeLimit: number; // in days
  allowPastDateEntry: boolean;
  allowFutureDate: boolean;
  
  // User Management
  defaultUserRole: 'User' | 'Admin';
  requireEmailVerification: boolean;
  passwordMinLength: number;
  passwordComplexity: boolean;
  
  // System Settings
  systemName: string;
  systemDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  
  // Business Rules
  workingDaysPerWeek: number;
  standardWorkingHours: number;
  overtimeThreshold: number;
  
  // Available Options
  availableVerticles: string[];
  availableCountries: string[];
  availableTasks: string[];
}

const defaultConfig: SystemConfig = {
  // Work Log Settings
  maxHoursPerDay: 12,
  maxHoursPerWeek: 60,
  editTimeLimit: 2,
  allowPastDateEntry: true,
  allowFutureDate: false,
  
  // User Management
  defaultUserRole: 'User',
  requireEmailVerification: false,
  passwordMinLength: 6,
  passwordComplexity: false,
  
  // System Settings
  systemName: 'TimeWise CRM',
  systemDescription: 'Comprehensive time tracking and management portal',
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please check back later.',
  
  // Business Rules
  workingDaysPerWeek: 5,
  standardWorkingHours: 8,
  overtimeThreshold: 40,
  
  // Available Options
  availableVerticles: ['CMIS', 'TRI', 'LOF', 'TRG'],
  availableCountries: ['USA', 'UK', 'Canada', 'Australia', 'Japan'],
  availableTasks: [
    'Video Editing',
    'Graphic Design',
    'Sound Mixing',
    'Animation',
    'Project Management',
    'Client Meeting',
    'Research & Development',
    'Quality Assurance',
    'Content Creation',
    'Code Review'
  ]
};

export default function SystemSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state for adding new items to arrays
  const [newVerticle, setNewVerticle] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newTask, setNewTask] = useState('');

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleArrayAdd = (arrayKey: keyof SystemConfig, newItem: string, setter: (value: string) => void) => {
    if (!newItem.trim()) return;
    
    const currentArray = config[arrayKey] as string[];
    if (currentArray.includes(newItem.trim())) {
      toast({
        title: "Warning",
        description: "Item already exists",
        variant: "destructive",
      });
      return;
    }

    handleConfigChange(arrayKey, [...currentArray, newItem.trim()]);
    setter('');
  };

  const handleArrayRemove = (arrayKey: keyof SystemConfig, itemToRemove: string) => {
    const currentArray = config[arrayKey] as string[];
    handleConfigChange(arrayKey, currentArray.filter(item => item !== itemToRemove));
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - In real implementation, this would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "System configuration saved successfully",
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfig = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">System Configuration</h2>
          <p className="text-muted-foreground">Manage system-wide settings and business rules</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleResetConfig} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveConfig} disabled={!hasChanges || loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Information
            </CardTitle>
            <CardDescription>
              Basic system configuration and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="system-name">System Name</Label>
              <Input
                id="system-name"
                value={config.systemName}
                onChange={(e) => handleConfigChange('systemName', e.target.value)}
                placeholder="Enter system name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="system-description">System Description</Label>
              <Textarea
                id="system-description"
                value={config.systemDescription}
                onChange={(e) => handleConfigChange('systemDescription', e.target.value)}
                placeholder="Enter system description"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to prevent user access during maintenance
                </p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={config.maintenanceMode}
                onCheckedChange={(checked) => handleConfigChange('maintenanceMode', checked)}
              />
            </div>
            {config.maintenanceMode && (
              <div className="grid gap-2">
                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                <Textarea
                  id="maintenance-message"
                  value={config.maintenanceMessage}
                  onChange={(e) => handleConfigChange('maintenanceMessage', e.target.value)}
                  placeholder="Message to show during maintenance"
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Log Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Work Log Settings
            </CardTitle>
            <CardDescription>
              Configure work logging rules and restrictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max-hours-day">Max Hours per Day</Label>
                <Input
                  id="max-hours-day"
                  type="number"
                  min="1"
                  max="24"
                  value={config.maxHoursPerDay}
                  onChange={(e) => handleConfigChange('maxHoursPerDay', Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-hours-week">Max Hours per Week</Label>
                <Input
                  id="max-hours-week"
                  type="number"
                  min="1"
                  max="168"
                  value={config.maxHoursPerWeek}
                  onChange={(e) => handleConfigChange('maxHoursPerWeek', Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-time-limit">Edit Time Limit (days)</Label>
                <Input
                  id="edit-time-limit"
                  type="number"
                  min="0"
                  max="30"
                  value={config.editTimeLimit}
                  onChange={(e) => handleConfigChange('editTimeLimit', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Users can edit entries within this time limit. Admins can always edit.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="overtime-threshold">Overtime Threshold (hours/week)</Label>
                <Input
                  id="overtime-threshold"
                  type="number"
                  min="20"
                  max="60"
                  value={config.overtimeThreshold}
                  onChange={(e) => handleConfigChange('overtimeThreshold', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Past Date Entry</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to log work for past dates
                  </p>
                </div>
                <Switch
                  checked={config.allowPastDateEntry}
                  onCheckedChange={(checked) => handleConfigChange('allowPastDateEntry', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Future Date Entry</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to log work for future dates
                  </p>
                </div>
                <Switch
                  checked={config.allowFutureDate}
                  onCheckedChange={(checked) => handleConfigChange('allowFutureDate', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Configure user account and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="default-role">Default User Role</Label>
                <Select 
                  value={config.defaultUserRole} 
                  onValueChange={(value: 'User' | 'Admin') => handleConfigChange('defaultUserRole', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password-length">Minimum Password Length</Label>
                <Input
                  id="password-length"
                  type="number"
                  min="4"
                  max="20"
                  value={config.passwordMinLength}
                  onChange={(e) => handleConfigChange('passwordMinLength', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    New users must verify their email address
                  </p>
                </div>
                <Switch
                  checked={config.requireEmailVerification}
                  onCheckedChange={(checked) => handleConfigChange('requireEmailVerification', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password Complexity</Label>
                  <p className="text-sm text-muted-foreground">
                    Require uppercase, lowercase, numbers, and symbols
                  </p>
                </div>
                <Switch
                  checked={config.passwordComplexity}
                  onCheckedChange={(checked) => handleConfigChange('passwordComplexity', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Business Configuration
            </CardTitle>
            <CardDescription>
              Configure available options for work logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Verticles */}
            <div className="space-y-3">
              <Label>Available Verticles</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new verticle"
                  value={newVerticle}
                  onChange={(e) => setNewVerticle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd('availableVerticles', newVerticle, setNewVerticle)}
                />
                <Button 
                  type="button"
                  onClick={() => handleArrayAdd('availableVerticles', newVerticle, setNewVerticle)}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.availableVerticles.map((verticle) => (
                  <Badge key={verticle} variant="secondary" className="cursor-pointer" onClick={() => handleArrayRemove('availableVerticles', verticle)}>
                    {verticle} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div className="space-y-3">
              <Label>Available Countries</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new country"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd('availableCountries', newCountry, setNewCountry)}
                />
                <Button 
                  type="button"
                  onClick={() => handleArrayAdd('availableCountries', newCountry, setNewCountry)}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.availableCountries.map((country) => (
                  <Badge key={country} variant="secondary" className="cursor-pointer" onClick={() => handleArrayRemove('availableCountries', country)}>
                    {country} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              <Label>Available Tasks</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new task"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd('availableTasks', newTask, setNewTask)}
                />
                <Button 
                  type="button"
                  onClick={() => handleArrayAdd('availableTasks', newTask, setNewTask)}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.availableTasks.map((task) => (
                  <Badge key={task} variant="secondary" className="cursor-pointer" onClick={() => handleArrayRemove('availableTasks', task)}>
                    {task} ×
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Click on a badge to remove it</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}