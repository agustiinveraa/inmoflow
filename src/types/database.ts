export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  created_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  price?: number;
  address?: string;
  client_id?: string;
  status: 'available' | 'sold' | 'rented' | 'reserved';
  property_type?: 'piso' | 'casa' | 'local' | 'oficina' | 'chalet' | 'apartamento';
  images?: string[];
  created_at: string;
  client?: Client;
}

export interface Visit {
  id: string;
  property_id?: string;
  client_id?: string;
  visit_date: string;
  notes?: string;
  created_at: string;
  property?: Property;
  client?: Client;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'> & { id: string };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at'>>;
      };
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id' | 'created_at'>;
        Update: Partial<Omit<Property, 'id' | 'created_at'>>;
      };
      visits: {
        Row: Visit;
        Insert: Omit<Visit, 'id' | 'created_at'>;
        Update: Partial<Omit<Visit, 'id' | 'created_at'>>;
      };
    };
  };
};
