export interface Configuration {
  id: number;
  application_id: number;
  key: string;
  value?: string;
  environment: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConfigurationRequest {
  application_id: number;
  key: string;
  value?: string;
  environment: string;
}

export interface UpdateConfigurationRequest {
  key?: string;
  value?: string;
  environment?: string;
}

export interface ConfigurationResponse {
  id: number;
  application_id: number;
  key: string;
  value?: string;
  environment: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationWithApplication extends ConfigurationResponse {
  application_name: string;
}
