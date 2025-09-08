export interface Application {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateApplicationRequest {
  name: string;
  description?: string;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
}

export interface ApplicationResponse {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
