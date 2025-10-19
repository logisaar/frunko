import { useEffect, useState } from 'react';
import { seedSampleData, checkDataExists } from '@/utils/seedData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DataInitializerProps {
  children: React.ReactNode;
}

export default function DataInitializer({ children }: DataInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsData, setNeedsData] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const dataStatus = await checkDataExists();
      
      if (!dataStatus.hasItems || !dataStatus.hasPlans) {
        setNeedsData(true);
      }
    } catch (error) {
      console.error('Error checking data:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedSampleData();
      if (result.success) {
        toast.success('Sample data added successfully!');
        setNeedsData(false);
      } else {
        toast.error('Failed to add sample data');
      }
    } catch (error) {
      toast.error('Error adding sample data');
      console.error('Error seeding data:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (needsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Welcome to Morning Feast!</CardTitle>
            <CardDescription>
              Let's set up your application with some sample data to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Sample menu items</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Subscription plans</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Admin dashboard ready</span>
              </div>
            </div>
            
            <Button 
              onClick={handleSeedData} 
              className="w-full" 
              disabled={isSeeding}
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Sample Data...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Add Sample Data
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              This will add sample menu items and subscription plans to help you get started.
              You can always modify or add more through the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
