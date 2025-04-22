import { CompanyInfo } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://103.18.20.205:8090';

/**
 * Get company information for a user
 * @param userId The user ID to get company info for
 * @returns The company information or null if not found
 */
export async function getCompanyInfo(userId: string): Promise<CompanyInfo | null> {
  try {
    const response = await fetch(`${API_URL}/companies/user/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // No company found for this user
        return null;
      }
      throw new Error(`Failed to fetch company info: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching company info:", error);
    throw error;
  }
}

/**
 * Update company information
 * @param companyInfo The company information to update
 * @returns The updated company information
 */
export async function updateCompanyInfo(companyInfo: CompanyInfo): Promise<CompanyInfo> {
  try {
    const method = companyInfo.id ? 'PUT' : 'POST';
    const url = companyInfo.id 
      ? `${API_URL}/companies/${companyInfo.id}` 
      : `${API_URL}/companies`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyInfo),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update company info: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating company info:", error);
    throw error;
  }
}

/**
 * Get all companies
 * @returns List of all companies
 */
export async function getAllCompanies(): Promise<CompanyInfo[]> {
  try {
    const response = await fetch(`${API_URL}/companies`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

/**
 * Delete a company
 * @param companyId The ID of the company to delete
 * @returns Success message
 */
export async function deleteCompany(companyId: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_URL}/companies/${companyId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete company: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting company:", error);
    throw error;
  }
} 