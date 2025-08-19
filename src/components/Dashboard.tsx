import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { LogOut, User, FileText, Download, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateUserPass } from '@/utils/pdfGenerator';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfileData(profile);
        setIsAdmin(profile.role === 'admin');
      }
    };

    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleDownloadPass = async () => {
    if (!profileData) return;

    try {
      await generateUserPass(profileData);
      toast({
        title: "Success",
        description: "Pass downloaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download pass",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">AEG</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-aeg-green to-aeg-blue bg-clip-text text-transparent">
                AEG Portal
              </h1>
              <p className="text-muted-foreground">Maharashtra Government Initiative</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Button 
                onClick={() => navigate('/admin')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Admin Panel</span>
              </Button>
            )}
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-glass border-glass-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>User Details</span>
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Email:</span>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">User ID:</span>
                  <p className="font-mono text-sm">{user?.id}</p>
                </div>
                {profileData?.user_pass_id && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Pass ID:</span>
                    <p className="font-mono text-sm font-bold text-primary">{profileData.user_pass_id}</p>
                  </div>
                )}
                {profileData?.name && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Name:</span>
                    <p className="font-medium">{profileData.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          {profileData?.is_form_submitted ? (
            <Button 
              size="lg"
              onClick={handleDownloadPass}
              className="bg-gradient-primary hover:opacity-90 transition-opacity px-12 py-6 text-lg"
            >
              <Download className="w-6 h-6 mr-3" />
              Download Your Pass
            </Button>
          ) : (
            <Button 
              size="lg"
              onClick={handleRegisterClick}
              className="bg-gradient-primary hover:opacity-90 transition-opacity px-12 py-6 text-lg"
            >
              <FileText className="w-6 h-6 mr-3" />
              Register
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};