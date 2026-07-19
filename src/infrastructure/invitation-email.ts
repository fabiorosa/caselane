import "server-only";

export interface InvitationEmail {
  email: string;
  organizationName: string;
  role: "ADMIN" | "MEMBER";
  acceptUrl: string;
}

export interface InvitationEmailAdapter {
  send(invitation: InvitationEmail): Promise<{ previewUrl?: string }>;
}

export function createLocalInvitationEmailAdapter(isProduction: boolean): InvitationEmailAdapter {
  return {
    async send(invitation) {
      return isProduction ? {} : { previewUrl: invitation.acceptUrl };
    },
  };
}
