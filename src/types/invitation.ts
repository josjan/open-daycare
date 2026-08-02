export type RelationshipValue = "father" | "mother" | "guardian";
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface InvitationRow {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  relationship: RelationshipValue;
  code: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface ParentLinkRow {
  parent_id: string;
  child_id: string;
  relationship: RelationshipValue;
  users?: Pick<{ id: string; full_name: string }, "id" | "full_name"> | null;
}

export interface InvitePayload {
  child_id: string;
  full_name: string;
  email: string;
  relationship: RelationshipValue;
}
