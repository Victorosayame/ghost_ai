export type ProjectAccess = "owner" | "collaborator";

export interface EditorProject {
  id: string;
  name: string;
  access: ProjectAccess;
  updatedAtLabel: string;
}
