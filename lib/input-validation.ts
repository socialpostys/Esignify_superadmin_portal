import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"

// Organization validation schemas
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, "Organization name contains invalid characters"),

  domain: z
    .string()
    .min(1, "Domain is required")
    .max(253, "Domain must be less than 253 characters")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/,
      "Invalid domain format",
    ),

  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),

  adminName: z.string().min(1, "Admin name is required").max(100, "Admin name must be less than 100 characters"),

  adminEmail: z.string().email("Invalid email format").max(254, "Email must be less than 254 characters"),

  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
})

// User validation schemas
export const userSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Name contains invalid characters"),

  email: z.string().email("Invalid email format").max(254, "Email must be less than 254 characters"),

  department: z.string().max(100, "Department must be less than 100 characters").optional(),

  title: z.string().max(100, "Title must be less than 100 characters").optional(),

  phone: z
    .string()
    .regex(/^[+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
})

// Signature template validation schemas
export const signatureTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Template name must be less than 100 characters"),

  description: z.string().max(500, "Description must be less than 500 characters").optional(),

  htmlContent: z
    .string()
    .min(1, "HTML content is required")
    .max(50000, "HTML content is too large (max 50KB)")
    .refine((html) => {
      // Basic HTML validation - check for balanced tags
      const openTags = (html.match(/<[^/][^>]*>/g) || []).length
      const closeTags = (html.match(/<\/[^>]*>/g) || []).length
      const selfClosing = (html.match(/<[^>]*\/>/g) || []).length
      return openTags === closeTags + selfClosing
    }, "HTML content appears to have unbalanced tags"),

  isDefault: z.boolean().optional(),
})

// Azure AD settings validation
export const azureSettingsSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID format").optional().or(z.literal("")),

  clientId: z.string().uuid("Invalid client ID format").optional().or(z.literal("")),

  clientSecret: z
    .string()
    .min(1, "Client secret is required when connection is enabled")
    .max(1000, "Client secret is too long")
    .optional()
    .or(z.literal("")),

  isConnected: z.boolean(),

  syncFrequency: z.enum(["manual", "hourly", "daily", "weekly"]),
})

// Authentication validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(254, "Email must be less than 254 characters"),

  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
})

// File upload validation
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename is too long")
    .regex(/^[a-zA-Z0-9\-_. ]+\.[a-zA-Z0-9]+$/, "Invalid filename format"),

  size: z
    .number()
    .min(1, "File is empty")
    .max(5 * 1024 * 1024, "File size must be less than 5MB"), // 5MB limit

  type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, "Only image files are allowed"),
})

// Validation helper functions
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const data = Object.fromEntries(formData.entries())
    const result = schema.safeParse(data)

    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors: Record<string, string> = {}
      result.error.errors.forEach((error) => {
        const path = error.path.join(".")
        errors[path] = error.message
      })
      return { success: false, errors }
    }
  } catch (error) {
    return {
      success: false,
      errors: { general: "Validation failed due to an unexpected error" },
    }
  }
}

export function validateJSON<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const result = schema.safeParse(data)

    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors: Record<string, string> = {}
      result.error.errors.forEach((error) => {
        const path = error.path.join(".")
        errors[path] = error.message
      })
      return { success: false, errors }
    }
  } catch (error) {
    return {
      success: false,
      errors: { general: "Validation failed due to an unexpected error" },
    }
  }
}

// Sanitization functions
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "span",
      "div",
      "table",
      "tr",
      "td",
      "th",
      "img",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    ALLOWED_ATTR: [
      "style",
      "class",
      "src",
      "alt",
      "href",
      "target",
      "width",
      "height",
      "cellpadding",
      "cellspacing",
      "border",
      "align",
      "valign",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  })
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_. ]/g, "") // Remove special characters
    .replace(/\.\./g, ".") // Remove double dots
    .replace(/^\.+/, "") // Remove leading dots
    .substring(0, 255) // Limit length
}

// Custom validation rules
export const customValidators = {
  isValidDomain: (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
    return domainRegex.test(domain) && domain.length <= 253
  },

  isValidSlug: (slug: string): boolean => {
    const slugRegex = /^[a-z0-9-]+$/
    return slugRegex.test(slug) && slug.length <= 50 && !slug.startsWith("-") && !slug.endsWith("-")
  },

  isStrongPassword: (password: string): boolean => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongPasswordRegex.test(password)
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  },
}

// Validation middleware for API routes
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: (data: T, request: Request) => Promise<Response>) => {
    return async (request: Request): Promise<Response> => {
      try {
        let data: unknown

        if (request.method === "GET") {
          const url = new URL(request.url)
          data = Object.fromEntries(url.searchParams.entries())
        } else {
          const contentType = request.headers.get("content-type")

          if (contentType?.includes("application/json")) {
            data = await request.json()
          } else if (
            contentType?.includes("multipart/form-data") ||
            contentType?.includes("application/x-www-form-urlencoded")
          ) {
            const formData = await request.formData()
            data = Object.fromEntries(formData.entries())
          } else {
            return new Response(JSON.stringify({ error: "Unsupported content type" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }
        }

        const validation = validateJSON(schema, data)

        if (!validation.success) {
          return new Response(
            JSON.stringify({
              error: "Validation failed",
              details: validation.errors,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        return await handler(validation.data, request)
      } catch (error) {
        console.error("Validation middleware error:", error)
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
    }
  }
}
