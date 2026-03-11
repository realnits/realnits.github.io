import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";
export const CVES_PATH = "src/data/cves";
export const CERTIFICATIONS_PATH = "src/data/certifications";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
});

const cves = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${CVES_PATH}` }),
  schema: () =>
    z.object({
      cveId: z.string(),
      title: z.string(),
      severity: z.enum(["Critical", "High", "Medium", "Low", "Informational"]),
      cvssScore: z.number().min(0).max(10).optional(),
      affectedProduct: z.string(),
      vendor: z.string().optional(),
      pubDatetime: z.date(),
      status: z
        .enum(["Published", "Reserved", "Rejected", "Disputed"])
        .default("Published"),
      references: z.array(z.string()).optional(),
      description: z.string(),
      draft: z.boolean().optional(),
    }),
});

const certifications = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: `./${CERTIFICATIONS_PATH}`,
  }),
  schema: () =>
    z.object({
      name: z.string(),
      issuer: z.string(),
      dateEarned: z.date(),
      expiryDate: z.date().optional().nullable(),
      credentialId: z.string().optional(),
      credentialUrl: z.string().url().optional(),
      badgeUrl: z.string().optional(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().optional(),
    }),
});

export const collections = { blog, cves, certifications };
