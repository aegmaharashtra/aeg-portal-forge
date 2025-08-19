import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const step1Schema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contact: z.string().min(10, 'Contact must be at least 10 digits'),
  gender: z.enum(['male', 'female', 'other']).refine(val => val !== undefined, {
    message: 'Please select gender'
  }),
  dob: z.string().min(1, 'Date of birth is required'),
});

const step2Schema = z.object({
  age: z.number().min(18, 'Age must be at least 18').max(100, 'Age must be less than 100'),
  district: z.string().min(1, 'District is required'),
  category: z.enum(['Open', 'OBC', 'SC', 'ST', 'VJNT', 'SEBC', 'SBC']).refine(val => val !== undefined, {
    message: 'Please select category'
  }),
  highest_qualification: z.string().min(1, 'Highest qualification is required'),
  passport_photo_url: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export const RegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: user?.email || '',
      name: '',
      contact: '',
      gender: undefined,
      dob: '',
    }
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      age: undefined,
      district: '',
      category: undefined,
      highest_qualification: '',
      passport_photo_url: '',
    }
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        step1Form.reset({
          email: profile.email || user.email || '',
          name: profile.name || '',
          contact: profile.contact || '',
          gender: profile.gender as any,
          dob: profile.dob || '',
        });

        step2Form.reset({
          age: profile.age || undefined,
          district: profile.district || '',
          category: profile.category as any,
          highest_qualification: profile.highest_qualification || '',
          passport_photo_url: profile.passport_photo_url || '',
        });

        setCurrentStep(profile.form_step || 1);
      }
    };

    loadProfile();
  }, [user, step1Form, step2Form]);

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('passport-photos')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('passport-photos')
        .getPublicUrl(filePath);

      step2Form.setValue('passport_photo_url', data.publicUrl);
      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const saveStep = async (stepData: any, stepNumber: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...stepData,
          form_step: stepNumber,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Step ${stepNumber} saved successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onStep1Submit = async (data: Step1Data) => {
    await saveStep(data, 1);
    setCurrentStep(2);
  };

  const onStep2Submit = async (data: Step2Data) => {
    const step1Data = step1Form.getValues();
    const completeData = { ...step1Data, ...data };
    
    await saveStep(completeData, 2);
    navigate('/review');
  };

  const districts = [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati',
    'Kolhapur', 'Sangli', 'Ahmednagar', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Nanded',
    'Parbhani', 'Jalna', 'Buldhana', 'Beed', 'Osmanabad', 'Washim', 'Hingoli', 'Gadchiroli',
    'Chandrapur', 'Wardha', 'Yavatmal', 'Gondia', 'Bhandara', 'Raigad', 'Ratnagiri', 'Sindhudurg',
    'Satara', 'Bid'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
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
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-aeg-green to-aeg-blue bg-clip-text text-transparent">
            Registration Form
          </h1>
          <p className="text-muted-foreground">Complete your registration in 2 simple steps</p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="ml-2">Personal Details</span>
            </div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="ml-2">Additional Information</span>
            </div>
          </div>
          <div className="mt-2 bg-muted h-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>

        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Personal Details</CardTitle>
                <CardDescription>Please fill in your basic information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...step1Form}>
                  <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
                    <FormField
                      control={step1Form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step1Form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step1Form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your contact number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step1Form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="male" id="male" />
                                <Label htmlFor="male">Male</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="female" id="female" />
                                <Label htmlFor="female">Female</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="other" />
                                <Label htmlFor="other">Other</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step1Form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Additional Information</CardTitle>
                <CardDescription>Complete your profile with additional details</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...step2Form}>
                  <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
                    <FormField
                      control={step2Form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="Enter your age"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your district" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {districts.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['Open', 'OBC', 'SC', 'ST', 'VJNT', 'SEBC', 'SBC'].map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="highest_qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Highest Qualification</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your highest qualification" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="passport_photo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport Size Photo (Max 1MB)</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 1024 * 1024) {
                                      toast({
                                        title: "Error",
                                        description: "File size must be less than 1MB",
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    handleFileUpload(file);
                                  }
                                }}
                                disabled={isUploading}
                              />
                              {isUploading && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading...
                                </div>
                              )}
                              {field.value && (
                                <div className="mt-2">
                                  <img 
                                    src={field.value} 
                                    alt="Passport photo" 
                                    className="w-20 h-20 object-cover rounded-md border"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue to Review
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};