export interface Profile {
  id: string;
  auth_user_email: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  is_confirmed: boolean;
  display_name_set: boolean;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  club: string;
  date: string;
  time: string | null;
  description: string | null;
  ticket_url: string | null;
  created_by: string;
  created_at: string;
}

export interface EventWithVotes extends Event {
  vote_count: number;
  user_voted: boolean;
}

export interface EventVote {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  entity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Wildcard {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  submitted_by: string;
  created_at: string;
}

export interface WildcardWithVotes extends Wildcard {
  vote_count: number;
  user_voted: boolean;
  profile?: Profile;
}

export interface Flight {
  id: string;
  user_id: string;
  arrival_date: string;
  arrival_time: string | null;
  departure_date: string;
  departure_time: string | null;
  flight_number_in: string | null;
  flight_number_out: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface RoomAllocation {
  id: string;
  room_name: string;
  description: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface GalleryPhoto {
  id: string;
  file_path: string;
  file_url: string;
  caption: string | null;
  category: "past_trips" | "ibiza_2026";
  uploaded_by: string;
  created_at: string;
  profile?: Profile;
}
