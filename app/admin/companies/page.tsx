"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircle, XCircle, Clock, Plus, Search, Filter, MoreHorizontal, Pencil, Trash, BarChart, Users } from "lucide-react";
import { CompanyInfo, CompanyAssessmentStatus } from "@/types";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, User, UserRole } from "@/lib/auth-context";
import { Label } from "@/components/ui/label";

// Import API client
import api from '@/lib/api/client';

// Import predefined users from auth context to avoid naming conflicts
import { PREDEFINED_USERS as AUTH_PREDEFINED_USERS } from "@/lib/auth-context";

// Sample data for demo purposes
const SAMPLE_COMPANIES: CompanyInfo[] = [
  {
    id: "1",
    name: "TechInnovate Solutions",
    industry: "Technology",
    size: "Enterprise (1000+ employees)",
    region: "North America",
    aiMaturity: "Exploring",
    notes: "Global tech firm focused on cloud solutions",
    createdAt: "2023-06-15T10:30:00Z",
    updatedAt: "2023-11-22T14:45:00Z"
  },
  {
    id: "2",
    name: "FinServe Global",
    industry: "Financial Services",
    size: "Enterprise (1000+ employees)",
    region: "Europe",
    aiMaturity: "Expanding",
    notes: "International banking corporation",
    createdAt: "2023-05-10T08:20:00Z",
    updatedAt: "2023-10-18T11:30:00Z"
  },
  {
    id: "3",
    name: "HealthPlus Medical",
    industry: "Healthcare",
    size: "Mid-size (100-999 employees)",
    region: "Asia Pacific",
    aiMaturity: "Exploring",
    notes: "Medical equipment manufacturer",
    createdAt: "2023-07-20T09:15:00Z",
    updatedAt: "2023-12-05T16:20:00Z"
  },
  {
    id: "4",
    name: "GreenEnergy Co",
    industry: "Energy",
    size: "Mid-size (100-999 employees)",
    region: "North America",
    aiMaturity: "Initial",
    notes: "Renewable energy provider",
    createdAt: "2023-08-05T13:40:00Z",
    updatedAt: "2023-11-30T10:10:00Z"
  },
  {
    id: "5",
    name: "RetailNow",
    industry: "Retail",
    size: "Small (10-99 employees)",
    region: "Europe",
    aiMaturity: "Initial",
    notes: "E-commerce company for fashion products",
    createdAt: "2023-09-12T11:25:00Z",
    updatedAt: "2023-12-10T09:30:00Z"
  }
];

// Sample assessment statuses
const SAMPLE_ASSESSMENT_STATUSES: CompanyAssessmentStatus[] = [
  {
    companyId: "1",
    companyName: "TechInnovate Solutions",
    assessments: [
      { type: "AI Governance", status: "completed", score: 76, completedAt: "2023-11-20T14:30:00Z" },
      { type: "AI Culture", status: "completed", score: 82, completedAt: "2023-11-21T10:15:00Z" },
      { type: "AI Infrastructure", status: "completed", score: 88, completedAt: "2023-11-22T16:45:00Z" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "in-progress" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "completed", score: 71, completedAt: "2023-12-01T11:30:00Z" }
    ]
  },
  {
    companyId: "2",
    companyName: "FinServe Global",
    assessments: [
      { type: "AI Governance", status: "completed", score: 85, completedAt: "2023-10-15T09:20:00Z" },
      { type: "AI Culture", status: "completed", score: 72, completedAt: "2023-10-16T14:30:00Z" },
      { type: "AI Infrastructure", status: "in-progress" },
      { type: "AI Strategy", status: "completed", score: 79, completedAt: "2023-10-18T11:45:00Z" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "completed", score: 88, completedAt: "2023-10-20T15:10:00Z" }
    ]
  },
  {
    companyId: "3",
    companyName: "HealthPlus Medical",
    assessments: [
      { type: "AI Governance", status: "in-progress" },
      { type: "AI Culture", status: "not-started" },
      { type: "AI Infrastructure", status: "not-started" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "not-started" }
    ]
  },
  {
    companyId: "4",
    companyName: "GreenEnergy Co",
    assessments: [
      { type: "AI Governance", status: "not-started" },
      { type: "AI Culture", status: "not-started" },
      { type: "AI Infrastructure", status: "not-started" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "not-started" }
    ]
  },
  {
    companyId: "5",
    companyName: "RetailNow",
    assessments: [
      { type: "AI Governance", status: "completed", score: 61, completedAt: "2023-12-08T10:30:00Z" },
      { type: "AI Culture", status: "completed", score: 68, completedAt: "2023-12-09T14:20:00Z" },
      { type: "AI Infrastructure", status: "completed", score: 55, completedAt: "2023-12-10T09:45:00Z" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "not-started" }
    ]
  }
];

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [assessmentStatuses, setAssessmentStatuses] = useState<CompanyAssessmentStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyInfo | null>(null);
  
  // New state for the user assignment feature
  const [assignRolesDialogOpen, setAssignRolesDialogOpen] = useState(false);
  const [companyForRoles, setCompanyForRoles] = useState<CompanyInfo | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<Record<string, string[]>>({});  // companyId -> array of userIds
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});  // userId -> selected (true/false)
  const [editingCompany, setEditingCompany] = useState<CompanyInfo | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Load data from API
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch companies
        const { data: companiesData, error: companiesError } = await api.companies.getCompanies();
        
        if (companiesError) {
          console.error("Error fetching companies:", companiesError);
          toast({
            title: "Error",
            description: "Failed to load companies data",
            variant: "destructive"
          });
          // Fallback to empty array if API fails
          setCompanies([]);
        } else {
          setCompanies(companiesData || []);
        }
        
        // Fetch users
        const { data: usersData, error: usersError } = await api.users.getUsers();
        
        if (usersError) {
          console.error("Error fetching users:", usersError);
          // Fallback to predefined users if API fails
          setAvailableUsers(AUTH_PREDEFINED_USERS);
        } else {
          setAvailableUsers(usersData || []);
        }
        
        // For each company, fetch assessments and assigned users
        if (companiesData) {
          // Temporary data structures
          const allAssessmentStatuses: CompanyAssessmentStatus[] = [];
          const allUserAssignments: Record<string, string[]> = {};
          
          // Process each company
          for (const company of companiesData) {
            if (company.id) {
              // Fetch assessments for this company
              const { data: assessmentsData } = await api.assessments.getCompanyAssessments(company.id);
              
              if (assessmentsData) {
                allAssessmentStatuses.push(assessmentsData);
              }
              
              // Fetch assigned users for this company
              const { data: companyUsers } = await api.companies.getCompanyUsers(company.id);
              
              if (companyUsers) {
                allUserAssignments[company.id] = companyUsers.map(user => user.id);
              }
            }
          }
          
          setAssessmentStatuses(allAssessmentStatuses);
          setAssignedUsers(allUserAssignments);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCreateCompany = () => {
    router.push("/admin/companies/add");
  };

  const handleEditCompany = (id: string) => {
    router.push(`/admin/companies/${id}/edit`);
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      const { error } = await api.companies.deleteCompany(companyId);
      
      if (error) {
        throw new Error(error);
      }
      
      // Update the local state
      setCompanies(companies.filter(company => company.id !== companyId));
      
      toast({
        title: "Company deleted",
        description: "The company has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      });
    }
  };

  const handleViewAssessments = (id: string) => {
    const { completedCount, totalCount } = getCompletionStatus(id);
    
    toast({
      title: "View Assessments",
      description: `This company has completed ${completedCount} out of ${totalCount} assessments.`,
      variant: "default"
    });
    
    // Navigate to company assessments page
    router.push(`/admin/companies/${id}/assessments`);
  };

  // Calculate assessment completion for a company
  const getCompletionStatus = (companyId: string) => {
    const status = assessmentStatuses.find(s => s.companyId === companyId);
    if (!status) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = status.assessments.filter(a => a.status === "completed").length;
    const total = status.assessments.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  // Filter companies based on search and filters
  const filteredCompanies = companies.filter(company => {
    // Search filter
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Industry filter
    const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
    
    // Assessment status filter
    let matchesAssessmentStatus = true;
    if (assessmentStatusFilter !== "all") {
      const status = assessmentStatuses.find(s => s.companyId === company.id);
      if (status) {
        const { completed, total } = getCompletionStatus(company.id || "");
        
        if (assessmentStatusFilter === "completed" && completed !== total) {
          matchesAssessmentStatus = false;
        } else if (assessmentStatusFilter === "in-progress" && (completed === 0 || completed === total)) {
          matchesAssessmentStatus = false;
        } else if (assessmentStatusFilter === "not-started" && completed > 0) {
          matchesAssessmentStatus = false;
        }
      }
    }
    
    return matchesSearch && matchesIndustry && matchesAssessmentStatus;
  });

  // Get unique industries for filter
  const industries = Array.from(new Set(companies.map(company => company.industry)));

  const handleDeleteClick = (company: CompanyInfo) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (companyToDelete && companyToDelete.id) {
      try {
        const { error } = await api.companies.deleteCompany(companyToDelete.id);
        
        if (error) {
          throw new Error(error);
        }
        
        // Update the local state
        setCompanies(companies.filter(company => company.id !== companyToDelete.id));
        
        toast({
          title: "Company Deleted",
          description: `${companyToDelete.name} has been deleted.`,
        });
      } catch (error) {
        console.error("Error deleting company:", error);
        toast({
          title: "Error",
          description: "Failed to delete company",
          variant: "destructive"
        });
      } finally {
        setDeleteDialogOpen(false);
        setCompanyToDelete(null);
      }
    }
  };

  const handleOpenAssignRoles = async (company: CompanyInfo) => {
    if (!company.id) return;
    
    setCompanyForRoles(company);
    
    try {
      // Fetch current user assignments for this company
      const { data: companyUsers, error } = await api.companies.getCompanyUsers(company.id);
      
      if (error) {
        throw new Error(error);
      }
      
      // Initialize selected users based on current assignments
      const initialSelected: Record<string, boolean> = {};
      const companyUserIds = companyUsers ? companyUsers.map(user => user.id) : [];
      
      // Mark users that are already assigned to this company
      availableUsers.forEach(user => {
        initialSelected[user.id] = companyUserIds.includes(user.id);
      });
      
      setSelectedUsers(initialSelected);
      setAssignRolesDialogOpen(true);
    } catch (error) {
      console.error("Error fetching company users:", error);
      toast({
        title: "Error",
        description: "Failed to load assigned users",
        variant: "destructive"
      });
    }
  };

  const handleSaveAssignments = async () => {
    if (!companyForRoles || !companyForRoles.id) return;
    
    const companyId = companyForRoles.id;
    
    // Get the IDs of selected users
    const selectedUserIds = Object.entries(selectedUsers)
      .filter(([_, isSelected]) => isSelected)
      .map(([userId]) => userId);
    
    try {
      // Update the user assignments via API
      const { error } = await api.companies.assignUsers(companyId, selectedUserIds);
      
      if (error) {
        throw new Error(error);
      }
      
      // Update local state
      setAssignedUsers({
        ...assignedUsers,
        [companyId]: selectedUserIds
      });
      
      toast({
        title: "Success",
        description: "User roles assigned successfully"
      });
    } catch (error) {
      console.error("Error assigning users:", error);
      toast({
        title: "Error",
        description: "Failed to save user assignments",
        variant: "destructive"
      });
    } finally {
      setAssignRolesDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage companies and their assessment progress
          </p>
        </div>
        <Button onClick={handleCreateCompany} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add New Company
        </Button>
      </div>

      {/* Filters and search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger>
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map(industry => (
              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assessmentStatusFilter} onValueChange={setAssessmentStatusFilter}>
          <SelectTrigger>
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by assessment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Companies list */}
      {loading ? (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Companies ({filteredCompanies.length})</CardTitle>
            <CardDescription>
              Manage your registered companies and their assessment progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No companies found matching your filters.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Assessment Status</TableHead>
                    <TableHead>AI Maturity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const { completed, total, percentage } = getCompletionStatus(company.id || "");
                    
                    return (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.industry}</TableCell>
                        <TableCell>{company.size}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {completed === 0 ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-muted-foreground" />
                                Not Started
                              </Badge>
                            ) : completed === total ? (
                              <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                In Progress ({percentage}%)
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={company.aiMaturity === "Initial" ? "outline" : 
                                   company.aiMaturity === "Exploring" ? "secondary" : 
                                   "default"}
                          >
                            {company.aiMaturity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAssessments(company.id || "")}>
                                <BarChart className="mr-2 h-4 w-4" />
                                View Assessments
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCompany(company.id || "")}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Company
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenAssignRoles(company)}>
                                <Users className="mr-2 h-4 w-4" />
                                Assign Roles
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(company)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Company
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{companyToDelete?.name}</span> and
              all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Roles Dialog */}
      <Dialog open={assignRolesDialogOpen} onOpenChange={setAssignRolesDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Users to {companyForRoles?.name}</DialogTitle>
            <DialogDescription>
              Select users who should have access to this company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto">
            {availableUsers.map(user => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`user-${user.id}`}
                  checked={selectedUsers[user.id] || false}
                  onCheckedChange={(checked) => {
                    setSelectedUsers({
                      ...selectedUsers,
                      [user.id]: !!checked
                    });
                  }}
                />
                <Label htmlFor={`user-${user.id}`} className="flex-1">
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-muted-foreground text-sm">{user.email}</span>
                  </div>
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignRolesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 