"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole, ROLE_TO_PILLAR, PREDEFINED_USERS } from "@/lib/auth-context"; // Import PREDEFINED_USERS from auth context
import { User } from "@/types"; // Import User type from types, not auth-context
import { useAuth } from "@/lib/auth-context"; // Assuming paths
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Import Label
import { Progress } from "@/components/ui/progress"; // Import Progress
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox for multiple roles
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
import { useToast } from "@/hooks/use-toast"; // Assuming path
import { Building, FileText, Loader2, Pencil, Trash, UserPlus, Info } from "lucide-react"; // Added Info icon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDeepResearchReport } from "@/lib/openai"; // Assuming path
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components
import dynamic from "next/dynamic";

// Import API client
import api from '@/lib/api/client';

// Define AssessmentResult type (assuming structure based on usage)
interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  qValues: Record<string, number>;
  softmaxWeights: Record<string, number>;
  overallScore: number;
  adjustedWeights: Record<string, number>;
  userWeights: Record<string, number>;
}

// Assessment types (keep for data loading logic)
const assessmentTypes = [
  "AI Governance",
  "AI Culture",
  "AI Infrastructure",
  "AI Strategy",
  "AI Data",
  "AI Talent",
  "AI Security",
];

// Dynamically import the companies page component
const AdminCompaniesContent = dynamic(() => import("./companies/page"), { ssr: false });

export default function AdminPage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth(); // Renamed to avoid conflict
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ai_culture"); // For backward compatibility
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]); // For multiple role selection

  // Report generation states
  const [generatingReportForUserId, setGeneratingReportForUserId] = useState<string | null>(null); // Track by ID

  // Helper function to safely cast string to UserRole
  const safeAsUserRole = (roleString: string): UserRole => {
    // Check if the role is a valid UserRole
    if (Object.keys(ROLE_TO_PILLAR).includes(roleString)) {
      return roleString as UserRole;
    }
    // Default to a safe role if the provided role is invalid
    return "ai_culture";
  };

  // --- Core Logic Functions (Updated to use API) ---

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.users.getUsers();
      
      if (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users from the server",
          variant: "destructive",
        });
        setUsers(PREDEFINED_USERS); // Fallback to predefined users
      } else if (data && Array.isArray(data)) {
        // Ensure all users have the roles array
        const processedUsers = data.map(user => ({
          ...user,
          roles: user.roles || (user.role ? [user.role] : [])
        }));
        setUsers(processedUsers);
      } else {
        setUsers(PREDEFINED_USERS); // Fallback if data is not in expected format
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users from the server",
        variant: "destructive",
      });
      setUsers(PREDEFINED_USERS); // Fallback to predefined users
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isAuthenticated || !authUser?.roles.includes("admin")) {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page.",
        variant: "destructive",
      });
      router.push("/"); // Redirect non-admins
      return;
    }

    // Load users from API
    fetchUsers();
  }, [isAuthenticated, authUser, router, toast]);

  const handleAddUser = () => {
    setDialogMode("add");
    setCurrentUser(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditUser = (userToEdit: User) => {
    setDialogMode("edit");
    setCurrentUser(userToEdit);
    setName(userToEdit.name);
    setEmail(userToEdit.email);
    
    // Set both the legacy role and the new selectedRoles array
    const userRoles = userToEdit.roles || (userToEdit.role ? [userToEdit.role] : []);
    setSelectedRoles(userRoles.map(r => safeAsUserRole(r)));
    setRole(userRoles[0] ? safeAsUserRole(userRoles[0]) : "ai_culture"); // Set first role as primary
    
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === "1") { // Assuming '1' is the hardcoded admin ID
      toast({
        title: "Operation Forbidden",
        description: "The primary administrator account cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await api.users.deleteUser(userId);
      
      if (error) {
        throw new Error(error);
      }
      
      // Update local state after successful API call
      setUsers((prevUsers) => prevUsers.filter(u => u.id !== userId));

    toast({
      title: "User Deleted",
      description: "The user account has been successfully removed.",
      variant: "default" // Use default variant for success
    });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    
    // Reset selected roles
    setSelectedRoles([]);
    
    // Set a sensible default role
    const firstNonAdminRole = Object.keys(ROLE_TO_PILLAR).find(r => r !== 'admin') as UserRole | undefined;
    const defaultRole = firstNonAdminRole || 'ai_culture';
    setRole(defaultRole);
    setSelectedRoles([defaultRole]);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!name.trim() || !email.trim() || selectedRoles.length === 0) {
      toast({ title: "Missing Information", description: "Please fill in all fields and select at least one role.", variant: "destructive" });
      return;
    }
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    // Password validation (only required for new users)
    if (dialogMode === "add" && !password.trim()) {
      toast({ title: "Password Required", description: "Please enter a password for the new user.", variant: "destructive" });
      return;
    }

    try {
      if (dialogMode === "add") {
        // Create user via API with multiple roles
        const { data, error } = await api.users.createUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          roles: selectedRoles // Pass the array of selected roles
        });
        
        if (error) {
          console.error("API error when creating user:", error);
          throw new Error(typeof error === 'object' ? JSON.stringify(error) : error);
        }
        
        if (data) {
          // Ensure the user has roles array
          const userWithRoles = {
            ...data,
            roles: data.roles || (data.role ? [data.role] : [])
          };
          
          // Add new user to state
          setUsers(prev => [...prev, userWithRoles]);
          toast({ title: "User Added", description: `${data.name} has been added.`});
        }
      } else if (dialogMode === "edit" && currentUser) {
        // Prepare update data with multiple roles
        const updateData: {
          name: string;
          email: string;
          roles: UserRole[];
          password?: string;
        } = {
          name: name.trim(),
          email: email.trim(),
          roles: selectedRoles
        };
        
        // Only include password if it was provided
        if (password.trim()) {
          updateData.password = password.trim();
        }
        
        console.log("Sending update with data:", updateData);
        
        // Update user via API
        const { data, error } = await api.users.updateUser(currentUser.id, updateData);
        
        if (error) {
          console.error("API error when updating user:", error);
          throw new Error(typeof error === 'object' ? JSON.stringify(error) : error);
        }
        
        if (data) {
          // Ensure the user has roles array
          const updatedUser = {
            ...data,
            roles: data.roles || (data.role ? [data.role] : [])
          };
          
          // Update user in state
          setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
          toast({ title: "User Updated", description: `Information for ${data.name} has been updated.`});
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting user:", error);
      let errorMessage = "An error occurred. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: dialogMode === "add" ? "Failed to Add User" : "Failed to Update User",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Handle toggling a role selection
  const toggleRole = (roleToToggle: UserRole) => {
    setSelectedRoles(prev => {
      // If role is already selected, remove it
      if (prev.includes(roleToToggle)) {
        return prev.filter(r => r !== roleToToggle);
      }
      // Otherwise add it
      return [...prev, roleToToggle];
    });
  };

  const loadUserAssessmentResults = (userRoles: UserRole[]): Record<string, AssessmentResult> => {
    const results: Record<string, AssessmentResult> = {};
    
    // Check if user has admin role
    const isAdmin = userRoles.includes("admin");
    
    // Get assessment types based on user roles
    const targetAssessments = isAdmin ? 
      assessmentTypes : 
      userRoles.map(role => ROLE_TO_PILLAR[role]).filter(Boolean);

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

  const handleGenerateUserReport = async (targetUser: User) => {
    setGeneratingReportForUserId(targetUser.id); // Track which user's report is generating
    toast({
      title: "Report Generation Started",
      description: `Processing report for ${targetUser.name}...`,
    });

    try {
      // Get user roles, ensuring it's an array
      const userRoles = targetUser.roles || (targetUser.role ? [targetUser.role] : []);
      
      const userResults = loadUserAssessmentResults(userRoles as UserRole[]);
      if (Object.keys(userResults).length === 0) {
        toast({ title: "No Data", description: `No assessment data found for ${targetUser.name} to generate a report.`, variant: "destructive" });
        setGeneratingReportForUserId(null);
        return;
      }

      localStorage.setItem('companyName', targetUser.name); // Set context for report generation
      const reportHtml = await generateDeepResearchReport(userResults); // Assuming this function returns HTML string

      // Trigger download
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_Readiness_Report_${targetUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Report Generated", description: `Report for ${targetUser.name} downloaded successfully.` });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({ title: "Generation Failed", description: `Could not generate report for ${targetUser.name}. Check console for details.`, variant: "destructive" });
    } finally {
      setGeneratingReportForUserId(null); // Clear loading state regardless of outcome
    }
  };

  // --- UI Rendering ---

  const pillars = Object.entries(ROLE_TO_PILLAR).filter(([role]) => role !== "admin");

  // Format roles for display
  const formatRoles = (userRoles: UserRole[] | undefined, userRole?: UserRole): string => {
    if (userRoles && userRoles.length > 0) {
      if (userRoles.includes("admin")) return "Administrator";
      return userRoles.map(role => ROLE_TO_PILLAR[role]).join(", ");
    }
    // Fallback to legacy role
    return userRole === "admin" ? "Administrator" : (userRole ? ROLE_TO_PILLAR[userRole] || userRole : "Unknown");
  };

  return (
    <TooltipProvider> {/* Needed for Tooltip components */}
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="users" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="pillars">Pillar Overview</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">User Management</h2>
                <p className="text-muted-foreground mt-1">Add, edit, or remove user accounts.</p>
              </div>
              <Button onClick={handleAddUser}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </div>

            <Card>
              <CardContent className="p-0"> {/* Remove padding to let table fit nicely */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-muted-foreground">Loading users...</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Pillar / Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length > 0 ? users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-sm">
                            {formatRoles(user.roles, safeAsUserRole(user.role))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                               <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit User</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit User</TooltipContent>
                               </Tooltip>
                               <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteUser(user.id)}
                                        disabled={user.id === "1"} // Disable deleting admin
                                        className="text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                    >
                                        <Trash className="h-4 w-4" />
                                        <span className="sr-only">Delete User</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete User</TooltipContent>
                               </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No users found. Click "Add New User" to create one.
                            </TableCell>
                         </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <CardFooter className="justify-end pt-4">
                <Button variant="outline" onClick={fetchUsers} size="sm" className="gap-1">
                  <div className="flex items-center">
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <div className="h-3 w-3 mr-1" />
                    )}
                    Refresh Users
                  </div>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <AdminCompaniesContent />
          </TabsContent>

          {/* Pillars Tab */}
          <TabsContent value="pillars" className="space-y-6">
             <div>
                 <h2 className="text-2xl font-semibold tracking-tight">Pillar Overview</h2>
                 <p className="text-muted-foreground mt-1">View user distribution across different AI readiness pillars.</p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.length > 0 ? pillars.map(([role, pillarName]) => {
                // Find users with this role either in legacy role field or in roles array
                const pillarUsers = users.filter(u => 
                  (u.role === role) || 
                  (u.roles && u.roles.includes(role as UserRole))
                );
                
                return (
                  <Card key={role}>
                    <CardHeader>
                      <CardTitle className="text-lg">{pillarName}</CardTitle>
                      <CardDescription>Users Assigned: {pillarUsers.length}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pillarUsers.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {pillarUsers.map(pillarUser => {
                            // Show a badge if the user has multiple roles
                            const hasMultipleRoles = 
                              (pillarUser.roles && pillarUser.roles.length > 1) || 
                              (pillarUser.roles && pillarUser.roles.length === 1 && pillarUser.role !== pillarUser.roles[0]);
                            
                            return (
                              <div key={pillarUser.id} className="text-sm p-2 rounded-md border bg-muted/50">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{pillarUser.name}</p>
                                  {hasMultipleRoles && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                      Multi-Role
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{pillarUser.email}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-20 border border-dashed rounded-md">
                            <p className="text-sm text-muted-foreground">No users in this pillar</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }) : (
                 <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="flex items-center justify-center h-32">
                       <p className="text-muted-foreground">No pillars defined (excluding Admin).</p>
                    </CardContent>
                 </Card>
              )}
            </div>
          </TabsContent>

          {/* Reports Tab - Integrating the refined version */}
          <TabsContent value="reports" className="space-y-6">
             <div>
                <h2 className="text-2xl font-semibold tracking-tight">Report Generation</h2>
                <p className="text-muted-foreground mt-1">
                    Generate detailed AI readiness reports for users based on their completed assessments.
                </p>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((reportUser) => {
                const userResults = loadUserAssessmentResults(reportUser.roles || (reportUser.role ? [reportUser.role] : []));
                const completedAssessments = Object.keys(userResults).length;
                const totalAssessments = reportUser.roles && reportUser.roles.length > 0 ? reportUser.roles.length : 1; // Or length of required assessments for role
                const completionPercentage = totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0;
                const isGenerating = generatingReportForUserId === reportUser.id;
                const hasData = completedAssessments > 0;
                const safeRole = safeAsUserRole(reportUser.role || "ai_culture");

                return (
                  <Card key={reportUser.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{reportUser.name}</CardTitle>
                      <CardDescription>
                        {reportUser.email} <span className="mx-1.5">·</span> {formatRoles(reportUser.roles, safeRole)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Assessments Completed</span>
                          <span className="text-sm font-semibold">{completedAssessments} / {totalAssessments}</span>
                        </div>
                        <Progress value={completionPercentage} aria-label={`${completionPercentage}% completed`} />
                      </div>
                      {hasData ? (
                        <div className="space-y-2 pt-2">
                          <h4 className="text-sm font-medium">Completed Assessments:</h4>
                          <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-2 pr-3">
                            {Object.entries(userResults).map(([type, result]) => (
                              <div key={type} className="flex items-center justify-between text-sm">
                                <span className="truncate pr-2">{type}</span>
                                <span className="flex-shrink-0 font-medium text-muted-foreground">{Math.round(result.overallScore)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-md border border-dashed">
                          <p className="text-sm text-muted-foreground">No assessment data</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => handleGenerateUserReport(reportUser)}
                        disabled={!hasData || isGenerating || !!generatingReportForUserId} // Disable if no data, this one is generating, or any is generating
                        className="w-full"
                        variant={hasData ? "default" : "secondary"}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{dialogMode === 'add' ? 'Add New User' : 'Edit User'}</DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' ? 'Enter the details for the new user.' : `Update details for ${currentUser?.name || 'user'}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="Full Name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-3"
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  placeholder={dialogMode === "edit" ? "Leave blank to keep current" : "Enter password"}
                />
              </div>
              
              {/* Primary role selector for backward compatibility */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Primary Role</Label>
                <Select value={role} onValueChange={(value) => {
                  const newRole = safeAsUserRole(value);
                  setRole(newRole);
                  
                  // Also add to selected roles if not already there
                  if (!selectedRoles.includes(newRole)) {
                    setSelectedRoles(prev => [...prev, newRole]);
                  }
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select primary role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_TO_PILLAR).map(([roleKey, pillarName]) => (
                      <SelectItem key={roleKey} value={roleKey}>
                        {pillarName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Multiple role checkboxes */}
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right pt-2">Access to Pillars</Label>
                <div className="col-span-3 border rounded-md p-3 space-y-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    Select multiple roles to give this user access to multiple pillars:
                  </div>
                  {Object.entries(ROLE_TO_PILLAR).map(([roleKey, pillarName]) => (
                    <div key={roleKey} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`role-${roleKey}`}
                        checked={selectedRoles.includes(roleKey as UserRole)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            toggleRole(roleKey as UserRole);
                            // If this is the first role being selected, also set it as primary
                            if (selectedRoles.length === 0 || !role) {
                              setRole(roleKey as UserRole);
                            }
                          } else {
                            toggleRole(roleKey as UserRole);
                            // If removing the primary role, update the primary role
                            if (role === roleKey) {
                              const remainingRoles = selectedRoles.filter(r => r !== roleKey);
                              if (remainingRoles.length > 0) {
                                setRole(remainingRoles[0]);
                              }
                            }
                          }
                        }}
                      />
                      <Label htmlFor={`role-${roleKey}`} className="font-normal">
                        {pillarName}
                      </Label>
                    </div>
                  ))}
                  {selectedRoles.length === 0 && (
                    <div className="text-sm text-amber-600 mt-2">
                      Please select at least one role
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{dialogMode === 'add' ? 'Create User' : 'Save Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}