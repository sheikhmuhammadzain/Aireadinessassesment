"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, User, UserRole, PREDEFINED_USERS, ROLE_TO_PILLAR } from "@/lib/auth-context"; // Assuming paths
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Import Label
import { Progress } from "@/components/ui/progress"; // Import Progress
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


export default function AdminPage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth(); // Renamed to avoid conflict
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("ai_culture"); // Default role example

  // Report generation states
  const [generatingReportForUserId, setGeneratingReportForUserId] = useState<string | null>(null); // Track by ID

  // --- Core Logic Functions (Unchanged) ---

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isAuthenticated || authUser?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page.",
        variant: "destructive",
      });
      router.push("/"); // Redirect non-admins
      return;
    }

    // Load users from localStorage or use predefined users
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      try {
          const parsedUsers = JSON.parse(storedUsers);
          setUsers(Array.isArray(parsedUsers) ? parsedUsers : PREDEFINED_USERS);
      } catch (e) {
          console.error("Failed to parse users from localStorage", e);
          setUsers(PREDEFINED_USERS);
          localStorage.setItem("users", JSON.stringify(PREDEFINED_USERS));
      }
    } else {
      // Initialize with predefined users on first load
      setUsers(PREDEFINED_USERS);
      localStorage.setItem("users", JSON.stringify(PREDEFINED_USERS));
    }
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
    setRole(userToEdit.role);
    setIsDialogOpen(true);
  };

    const handleDeleteUser = (userId: string) => {
    if (userId === "1") { // Assuming '1' is the hardcoded admin ID
      toast({
        title: "Operation Forbidden",
        description: "The primary administrator account cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.filter(u => u.id !== userId);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      return updatedUsers;
    });

    toast({
      title: "User Deleted",
      description: "The user account has been successfully removed.",
      variant: "default" // Use default variant for success
    });
  };


  const resetForm = () => {
    setName("");
    setEmail("");
    // Set a sensible default role if needed, e.g., the first non-admin role
    const firstNonAdminRole = Object.keys(ROLE_TO_PILLAR).find(r => r !== 'admin') as UserRole | undefined;
    setRole(firstNonAdminRole || 'ai_culture');
  };

  const handleSubmit = () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !role) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    if (dialogMode === "add") {
      if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        toast({ title: "Duplicate Email", description: "A user with this email already exists.", variant: "destructive" });
        return;
      }
      const newUser: User = { id: `custom_${Date.now()}`, name: name.trim(), email: email.trim(), role };
      setUsers(prev => {
          const updated = [...prev, newUser];
          localStorage.setItem("users", JSON.stringify(updated));
          return updated;
      });
      toast({ title: "User Added", description: `${newUser.name} has been added.`});

    } else if (dialogMode === "edit" && currentUser) {
       if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== currentUser.id)) {
        toast({ title: "Duplicate Email", description: "Another user with this email already exists.", variant: "destructive" });
        return;
      }
       setUsers(prev => {
           const updated = prev.map(u => u.id === currentUser.id ? { ...u, name: name.trim(), email: email.trim(), role } : u);
           localStorage.setItem("users", JSON.stringify(updated));
           return updated;
       });
       toast({ title: "User Updated", description: `Information for ${name.trim()} has been updated.`});
    }
    setIsDialogOpen(false);
    resetForm();
  };


  const loadUserAssessmentResults = (userRole: UserRole): Record<string, AssessmentResult> => {
    const results: Record<string, AssessmentResult> = {};
    const targetAssessments = userRole === 'admin' ? assessmentTypes : [ROLE_TO_PILLAR[userRole]].filter(Boolean); // Ensure pillar exists

    for (const type of targetAssessments) {
      const storedResult = localStorage.getItem(`assessment_result_${type}`);
      if (storedResult) {
        try {
          results[type] = JSON.parse(storedResult);
        } catch (error) {
          console.error(`Error parsing stored result for ${type}:`, error);
          // Optionally add a toast or log this failure
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
      const userResults = loadUserAssessmentResults(targetUser.role);
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

  return (
    <TooltipProvider> {/* Needed for Tooltip components */}
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="pillars">Pillar Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
                            {user.role === 'admin' ? 'Administrator' : (ROLE_TO_PILLAR[user.role] || 'N/A')}
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
                                No users found.
                            </TableCell>
                         </TableRow>
                      )}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                 <h2 className="text-2xl font-semibold tracking-tight">Company Management</h2>
                 <p className="text-muted-foreground mt-1">Overview and access to company administration.</p>
              </div>
               {/* <Button onClick={() => router.push("/admin/companies/add")} variant="outline">
                    <Building className="mr-2 h-4 w-4" />
                    Add Company
                </Button> */}
                {/* Add button can be on the companies page itself */}
             </div>

            <Card>
              <CardHeader>
                <CardTitle>Companies Dashboard</CardTitle>
                <CardDescription>
                  Manage company profiles, assessments, and progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                    Access the dedicated dashboard to manage all company-related information and assessment activities.
                </p>
                 {/* Optional: Add more descriptive elements or stats here later */}
              </CardContent>
              <CardFooter>
                 <Button onClick={() => router.push("/admin/companies")} className="w-full sm:w-auto">
                     Go to Companies Dashboard
                 </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Pillars Tab */}
          <TabsContent value="pillars" className="space-y-6">
             <div>
                 <h2 className="text-2xl font-semibold tracking-tight">Pillar Overview</h2>
                 <p className="text-muted-foreground mt-1">View user distribution across different AI readiness pillars.</p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.length > 0 ? pillars.map(([role, pillarName]) => {
                const pillarUsers = users.filter(u => u.role === role);
                return (
                  <Card key={role}>
                    <CardHeader>
                      <CardTitle className="text-lg">{pillarName}</CardTitle>
                      <CardDescription>Users Assigned: {pillarUsers.length}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pillarUsers.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {pillarUsers.map(pillarUser => (
                            <div key={pillarUser.id} className="text-sm p-2 rounded-md border bg-muted/50">
                              <p className="font-medium">{pillarUser.name}</p>
                              <p className="text-xs text-muted-foreground">{pillarUser.email}</p>
                            </div>
                          ))}
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
                const userResults = loadUserAssessmentResults(reportUser.role);
                const completedAssessments = Object.keys(userResults).length;
                const totalAssessments = reportUser.role === 'admin' ? assessmentTypes.length : 1; // Or length of required assessments for role
                const completionPercentage = totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0;
                const isGenerating = generatingReportForUserId === reportUser.id;
                const hasData = completedAssessments > 0;

                return (
                  <Card key={reportUser.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{reportUser.name}</CardTitle>
                      <CardDescription>
                        {reportUser.email} <span className="mx-1.5">·</span> {ROLE_TO_PILLAR[reportUser.role] || reportUser.role}
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
                <Label htmlFor="role" className="text-right">Pillar/Role</Label>
                 <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Only allow assigning non-admin roles */}
                    {Object.entries(ROLE_TO_PILLAR)
                      .filter(([roleKey]) => roleKey !== 'admin')
                      .map(([roleKey, pillarName]) => (
                        <SelectItem key={roleKey} value={roleKey}>
                          {pillarName}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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