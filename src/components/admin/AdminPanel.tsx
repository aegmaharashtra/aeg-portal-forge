import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Download, FileText, Search, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateUserPass } from '@/utils/pdfGenerator';

interface ProfileData {
  id: string;
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
  user_pass_id: string;
  is_form_submitted: boolean;
  created_at: string;
}

export const AdminPanel = () => {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setUserRole(profile.role);
      loadProfiles();
    };

    checkAdminAccess();
  }, [user, navigate, toast]);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_form_submitted', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProfiles(profiles);
      return;
    }

    const filtered = profiles.filter(profile =>
      profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.user_pass_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.district?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProfiles(filtered);
  }, [searchTerm, profiles]);

  const handleDownloadPass = async (profile: ProfileData) => {
    try {
      await generateUserPass(profile);
      toast({
        title: "Success",
        description: "Pass downloaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate pass",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = () => {
    const csvContent = [
      // Headers
      ['Name', 'Email', 'Contact', 'Gender', 'DOB', 'Age', 'District', 'Category', 'Qualification', 'Pass ID', 'Submitted At'].join(','),
      // Data rows
      ...filteredProfiles.map(profile => [
        `"${profile.name || ''}"`,
        `"${profile.email || ''}"`,
        `"${profile.contact || ''}"`,
        `"${profile.gender || ''}"`,
        `"${profile.dob || ''}"`,
        profile.age || '',
        `"${profile.district || ''}"`,
        `"${profile.category || ''}"`,
        `"${profile.highest_qualification || ''}"`,
        `"${profile.user_pass_id || ''}"`,
        `"${new Date(profile.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Data exported successfully"
    });
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Checking access...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-aeg-green to-aeg-blue bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage all registrations and download passes</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{filteredProfiles.length} registrations</span>
              </div>
              <Button onClick={handleExportExcel} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Registration Management</CardTitle>
            <CardDescription>
              View and manage all submitted registrations
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, pass ID, or district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pass ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-mono font-semibold">
                          {profile.user_pass_id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {profile.name}
                        </TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>{profile.contact}</TableCell>
                        <TableCell>{profile.district}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-muted rounded text-xs">
                            {profile.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleDownloadPass(profile)}
                            className="flex items-center space-x-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Download Pass</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredProfiles.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No registrations found matching your search.' : 'No registrations found.'}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};