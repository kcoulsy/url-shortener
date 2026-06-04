export type Link = {
  createdAt: string;
  longUrl: string;
  shortCode: string;
  shortUrl: string;
};

export type ServiceLink = {
  createdAt: string;
  longUrl: string;
  shortCode: string;
};

export type LinksResponse =
  | { success: true; links: ServiceLink[] }
  | { success: false; error: string };

export type CreateLinkResponse =
  | { success: true; longUrl: string; shortCode: string; shortUrl: string }
  | { success: false; error: string };

export type CreatedLink = {
  shortUrl: string;
};
