import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAccessProps {
  children?: React.ReactNode;
}

export default function AdminAccess({ children }: AdminAccessProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  const handleAdminAccess = () => {
    // Simple admin key check - in production, this should be more secure
    if (adminKey === 'admin123' || adminKey === 'morningfeast') {
      setIsOpen(false);
      setAdminKey('');
      window.location.href = '/admin';
    } else {
      toast.error('Invalid admin key');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="fixed top-4 right-4 z-50">
          <Settings className="h-4 w-4 mr-2" />
          Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Admin Access</span>
          </DialogTitle>
          <DialogDescription>
            Enter the admin key to access the admin dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-key">Admin Key</Label>
            <Input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key"
              onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()}
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleAdminAccess} className="flex-1">
              Access Admin Panel
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {/* <p>Demo keys: <code className="bg-muted px-1 rounded">admin123</code> or <code className="bg-muted px-1 rounded">morningfeast</code></p> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
