"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, User, UserRole, PREDEFINED_USERS, ROLE_TO_PILLAR } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Pencil, Search, Trash, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDeepResearchReport } from "@/lib/openai";

interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  qValues: Record<string, number>;
  softmaxWeights: Record<string, number>;
  overallScore: number;
  adjustedWeights: Record<string, number>;
  userWeights: Record<string, number>;
}

// Light blue color palette
const BLUE_COLORS = [
  '#E0F7FF', // Lightest blue
  '#C2EAFF', // Very light blue
  '#A5DBFF', // Light blue
  '#8ECAE6', // Medium light blue
  '#73BFDC', // Medium blue
  '#5BA3C6', // Blue
  '#4389B0', // Deeper blue
  '#2C6F9B', // Rich blue
  '#1A5785', // Deep blue
  '#0A4570', // Darkest blue
];

// Assessment types
const assessmentTypes = [
  "AI Governance",
  "AI Culture",
  "AI Infrastructure",
  "AI Strategy",
  "AI Data",
  "AI Talent",
  "AI Security",
];

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("ai_culture");
  
  // Report generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [searchAnimationStep, setSearchAnimationStep] = useState(0);
  const [generatingForUser, setGeneratingForUser] = useState<User | null>(null);
  const [reportProgress, setReportProgress] = useState("");
  const searchMessages = [
    "Analyzing assessment data...",
    "Scanning industry benchmarks...",
    "Identifying improvement opportunities...",
    "Formulating strategic recommendations...",
    "Preparing comprehensive report..."
  ];

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isAuthenticated || user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page.",
        variant: "destructive",
      });
      router.push("/");
      return;
    }
    
    // Load users from localStorage or use predefined users
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with predefined users on first load
      setUsers(PREDEFINED_USERS);
      localStorage.setItem("users", JSON.stringify(PREDEFINED_USERS));
    }
  }, [isAuthenticated, user, router, toast]);

  useEffect(() => {
    // Animation interval for report generation
    let interval: NodeJS.Timeout;
    
    if (generatingReport) {
      interval = setInterval(() => {
        setSearchAnimationStep(prev => (prev + 1) % searchMessages.length);
      }, 1500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingReport, searchMessages.length]);

  const handleAddUser = () => {
    setDialogMode("add");
    setCurrentUser(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setDialogMode("edit");
    setCurrentUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    // Don't allow deleting the admin user
    if (userId === "1") {
      toast({
        title: "Cannot Delete Admin",
        description: "The administrator account cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    
    toast({
      title: "User Deleted",
      description: "The user has been removed successfully.",
    });
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("ai_culture");
  };

  const handleSubmit = () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !role) {
      toast({
        title: "Validation Error",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (dialogMode === "add") {
      // Check for duplicate email
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        toast({
          title: "Email Already Exists",
          description: "A user with this email already exists.",
          variant: "destructive",
        });
        return;
      }

      // Create new user
      const newUser: User = {
        id: `custom_${Date.now()}`,
        name,
        email,
        role,
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      toast({
        title: "User Created",
        description: "New user has been added successfully.",
      });
    } else if (dialogMode === "edit" && currentUser) {
      // Check for duplicate email (excluding current user)
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== currentUser.id)) {
        toast({
          title: "Email Already Exists",
          description: "A user with this email already exists.",
          variant: "destructive",
        });
        return;
      }

      // Update existing user
      const updatedUsers = users.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, name, email, role };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  // Function to load assessment results for a user
  const loadUserAssessmentResults = (userRole: UserRole): Record<string, AssessmentResult> => {
    const results: Record<string, AssessmentResult> = {};
    
    // If admin, load all assessments; otherwise, load only the corresponding pillar
    const targetAssessments = userRole === 'admin' 
      ? assessmentTypes 
      : [ROLE_TO_PILLAR[userRole]];
    
    for (const type of targetAssessments) {
      const storedResult = localStorage.getItem(`assessment_result_${type}`);
      if (storedResult) {
        try {
          results[type] = JSON.parse(storedResult);
        } catch (error) {
          console.error(`Error parsing stored result for ${type}:`, error);
        }
      }
    }
    
    return results;
  };

  // Handle report generation for a specific user
  const handleGenerateUserReport = async (targetUser: User) => {
    setGeneratingForUser(targetUser);
    setGeneratingReport(true);
    setSearchAnimationStep(0);
    setReportProgress("Loading assessment data...");
    
    toast({
      title: "Generating Report",
      description: `Creating comprehensive report for ${targetUser.name}...`,
    });

    try {
      // Load assessment results for the user
      const userResults = loadUserAssessmentResults(targetUser.role);
      
      if (Object.keys(userResults).length === 0) {
        toast({
          title: "No Assessment Data",
          description: `No assessment data found for ${targetUser.name}.`,
          variant: "destructive"
        });
        setGeneratingReport(false);
        setGeneratingForUser(null);
        return;
      }
      
      setReportProgress("Generating comprehensive report...");
      
      // Store the user's name for the report
      localStorage.setItem('companyName', targetUser.name);
      
      // Generate the report HTML
      const reportHtml = await generateDeepResearchReport(userResults);
      
      // Create a blob from the HTML
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_Readiness_Report_${targetUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: `Report for ${targetUser.name} has been successfully created.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: `Failed to generate report for ${targetUser.name}.`,
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(false);
      setGeneratingForUser(null);
      setReportProgress("");
    }
  };

  const pillars = Object.entries(ROLE_TO_PILLAR).filter(([role]) => role !== "admin");

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="pillars">Pillar Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Button onClick={handleAddUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Pillar</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{ROLE_TO_PILLAR[user.role]}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditUser(user)}
                        className="mr-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === "1"} // Prevent deleting admin
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="pillars" className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Pillar Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map(([role, pillarName]) => {
              const pillarUsers = users.filter(u => u.role === role);
              return (
                <div key={role} className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">{pillarName}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Users assigned: {pillarUsers.length}
                  </p>
                  <div className="space-y-2 mt-3">
                    {pillarUsers.map(user => (
                      <div key={user.id} className="text-sm">
                        {user.name} ({user.email})
                      </div>
                    ))}
                    {pillarUsers.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No users assigned
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Report Management</h2>
          <p className="text-muted-foreground mb-6">
            Generate comprehensive AI readiness reports for your team members. Reports include all assessment data, weights, Q values, and detailed recommendations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              const userResults = loadUserAssessmentResults(user.role);
              const completedAssessments = Object.keys(userResults).length;
              const isGenerating = generatingForUser?.id === user.id;
              
              return (
                <Card key={user.id} className="border shadow-md overflow-hidden">
                  <div className="h-1 bg-blue-100"></div>
                  <CardHeader>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>
                      {user.email} • {ROLE_TO_PILLAR[user.role]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Assessments completed:</span>
                          <span className="text-sm">{completedAssessments}/{user.role === 'admin' ? 7 : 1}</span>
                        </div>
                        <div className="w-full bg-blue-50 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-600" 
                            style={{ 
                              width: `${user.role === 'admin' ? (completedAssessments / 7) * 100 : completedAssessments * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {completedAssessments > 0 && (
                        <div className="pt-2">
                          <h4 className="text-sm font-medium mb-2">Available assessments:</h4>
                          <div className="space-y-1">
                            {Object.keys(userResults).map((type) => (
                              <div key={type} className="text-xs flex justify-between">
                                <span>{type}</span>
                                <span>{Math.round(userResults[type].overallScore)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleGenerateUserReport(user)}
                      disabled={completedAssessments === 0 || generatingReport}
                      className={`w-full ${
                        completedAssessments === 0 
                        ? "bg-gray-300" 
                        : isGenerating
                        ? "bg-blue-500"
                        : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <div className="mr-2 flex items-center">
                            <div className="relative w-5 h-5">
                              <Search className="h-5 w-5 absolute animate-pulse" />
                              <div className="absolute top-1/2 left-1/2 w-8 h-8 -ml-4 -mt-4 border-2 border-blue-300 rounded-full animate-ping opacity-75"></div>
                            </div>
                          </div>
                          <span className="text-xs">{searchMessages[searchAnimationStep]}</span>
                        </>
                      ) : completedAssessments === 0 ? (
                        "No data available"
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Comprehensive Report
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add New User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" 
                ? "Create a new user account with the details below." 
                : "Update user information."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user's full name"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_TO_PILLAR)
                    .filter(([role]) => role !== "admin") // Don't allow creating admin users
                    .map(([role, pillar]) => (
                      <SelectItem key={role} value={role}>
                        {pillar}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {dialogMode === "add" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 