import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Save, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProfileData {
  email: string;
  name: string;
  contact: string;
  gender: string;
  dob: string;
  age: number;
  district: string;
  category: string;
  highest_qualification: string;
  passport_photo_url: string;
}

export const ReviewPage = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
        navigate('/register');
        return;
      }

      if (!profile || profile.form_step < 2) {
        toast({
          title: "Incomplete Form",
          description: "Please complete all steps first",
          variant: "destructive"
        });
        navigate('/register');
        return;
      }

      setProfileData(profile);
    };

    loadProfile();
  }, [user, navigate, toast]);

  const handleSave = async () => {
    if (!user || !profileData) return;

    setIsSubmitting(true);
    try {
      // Generate user pass ID
      const { data: passIdData, error: passIdError } = await supabase
        .rpc('generate_user_pass_id');

      if (passIdError) throw passIdError;

      // Update profile with submission status and pass ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_form_submitted: true,
          user_pass_id: passIdData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Send confirmation email (would need edge function)
      toast({
        title: "Success!",
        description: `Registration completed successfully! Your ID: ${passIdData}`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/register')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Form
          </Button>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-aeg-green to-aeg-blue bg-clip-text text-transparent">
            Review Your Information
          </h1>
          <p className="text-muted-foreground">Please review your details before final submission</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{profileData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="font-medium">{profileData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact</label>
                  <p className="font-medium">{profileData.contact}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <p className="font-medium capitalize">{profileData.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="font-medium">{new Date(profileData.dob).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Age</label>
                  <p className="font-medium">{profileData.age}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">District</label>
                  <p className="font-medium">{profileData.district}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="font-medium">{profileData.category}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Highest Qualification</label>
                  <p className="font-medium">{profileData.highest_qualification}</p>
                </div>
              </div>
              
              {profileData.passport_photo_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Passport Photo</label>
                  <div className="mt-2">
                    <img 
                      src={profileData.passport_photo_url} 
                      alt="Passport photo" 
                      className="w-32 h-32 object-cover rounded-md border"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button
              onClick={() => navigate('/register')}
              variant="outline"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Information
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex-1" disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Save & Submit'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                    Final Submission Warning
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Once you submit this form, you will not be able to make any changes to your information. 
                    Please ensure all details are correct before proceeding.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleSave}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    I Understand, Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </div>
    </div>
  );
};