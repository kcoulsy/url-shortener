export type ErrorResponse = {
  error: string;
  success: false;
};

export type ServiceLink = {
  createdAt: string;
  customSlug: string | null;
  longUrl: string;
  shortCode: string;
};

export type ListLinksResponse =
  | {
      links: ServiceLink[];
      success: true;
    }
  | ErrorResponse;

export type CreateLinkRequest = {
  customSlug?: string;
  url: string;
};

export type CreateLinkResponse =
  | {
      customSlug: string | null;
      longUrl: string;
      shortCode: string;
      shortUrl: string;
      success: true;
    }
  | ErrorResponse;

export type GetLinkInfoResponse =
  | {
      customSlug: string | null;
      longUrl: string;
      shortCode: string;
      success: true;
    }
  | ErrorResponse;
