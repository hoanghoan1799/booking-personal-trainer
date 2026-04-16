export interface User {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userType: string;
  approvalStatus: string;
  status: string;
  stripeAccountId?: string | null;
  age?: number;
  height?: number;
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
}
