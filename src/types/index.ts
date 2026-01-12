export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'calidad' | 'usuario';
  department: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  department: string;
}

export interface DefectRecord {
  id: string;
  user_id: string;
  area: 'Empaque en maquina' | 'Digital printing';
  defect_type_id: number;
  rejected_pairs: number;
  shift_number: 1 | 2 | 3;
  record_date: string;
  record_time: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DefectType {
  id: number;
  defect_name: string;
  is_active: boolean;
  created_at: Date;
}

export interface ShiftConfig {
  id: number;
  shift_number: 1 | 2 | 3;
  start_time: string;
  end_time: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'calidad' | 'usuario';
  department: string;
}

export interface CreateDefectRecordRequest {
  area: 'Empaque en maquina' | 'Digital printing';
  defect_type_id: number;
  rejected_pairs: number;
  notes?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
