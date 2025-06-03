import DOMPurify from "isomorphic-dompurify"

// XSS Protection configuration
const XSS_CONFIG = {
  // Allowed HTML tags for signature templates
  SIGNATURE_ALLOWED_TAGS: [
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
    "tbody",
    "thead",
  ],

  // Allowed attributes for signature templates
  SIGNATURE_ALLOWED_ATTR: [
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
    "colspan",
    "rowspan",
  ],

  // Allowed protocols for URLs
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,

  // Forbidden patterns
  FORBIDDEN_PATTERNS: [
    /javascript:/gi,
    /vbscript:/gi,
    /data:(?!image\/)/gi, // Allow data: URLs only for images
    /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
    /<script/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /<input/gi,
    /<button/gi,
    /<select/gi,
    /<textarea/gi,
  ],
}

// Main XSS protection functions
export class XSSProtection {
  // Sanitize HTML content for signature templates
  static sanitizeSignatureHTML(html: string): string {
    if (!html) return ""

    // First pass: Remove obviously dangerous patterns
    let sanitized = html
    XSS_CONFIG.FORBIDDEN_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "")
    })

    // Second pass: Use DOMPurify for comprehensive sanitization
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: XSS_CONFIG.SIGNATURE_ALLOWED_TAGS,
      ALLOWED_ATTR: XSS_CONFIG.SIGNATURE_ALLOWED_ATTR,
      ALLOWED_URI_REGEXP: XSS_CONFIG.ALLOWED_URI_REGEXP,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false,
    })

    // Third pass: Additional custom sanitization
    sanitized = this.sanitizeStyles(sanitized)
    sanitized = this.sanitizeUrls(sanitized)

    return sanitized
  }

  // Sanitize CSS styles to prevent CSS-based attacks
  static sanitizeStyles(html: string): string {
    return html.replace(/style\s*=\s*["']([^"']*)["']/gi, (match, styles) => {
      const sanitizedStyles = styles
        .replace(/expression\s*\(/gi, "") // Remove CSS expressions
        .replace(/javascript\s*:/gi, "") // Remove javascript: in CSS
        .replace(/vbscript\s*:/gi, "") // Remove vbscript: in CSS
        .replace(/@import/gi, "") // Remove @import
        .replace(/behavior\s*:/gi, "") // Remove IE behavior
        .replace(/binding\s*:/gi, "") // Remove XML binding
        .replace(/url\s*\(\s*["']?javascript:/gi, "") // Remove javascript: in url()

      return `style="${sanitizedStyles}"`
    })
  }

  // Sanitize URLs to prevent malicious redirects
  static sanitizeUrls(html: string): string {
    return html.replace(/href\s*=\s*["']([^"']*)["']/gi, (match, url) => {
      // Allow only safe protocols
      if (XSS_CONFIG.ALLOWED_URI_REGEXP.test(url)) {
        return match
      }
      return 'href="#"' // Replace with safe default
    })
  }

  // Sanitize plain text input
  static sanitizeText(text: string): string {
    if (!text) return ""

    return text
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/vbscript:/gi, "") // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .replace(/&lt;script/gi, "") // Remove encoded script tags
      .replace(/&gt;/gi, "") // Remove encoded closing brackets
      .trim()
  }

  // Sanitize file names
  static sanitizeFileName(fileName: string): string {
    if (!fileName) return ""

    return fileName
      .replace(/[<>:"/\\|?*]/g, "") // Remove file system reserved characters
      .replace(/\.\./g, ".") // Remove directory traversal
      .replace(/^\.+/, "") // Remove leading dots
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .substring(0, 255) // Limit length
  }

  // Validate and sanitize email addresses
  static sanitizeEmail(email: string): string {
    if (!email) return ""

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const sanitized = email.toLowerCase().trim()

    if (!emailRegex.test(sanitized)) {
      throw new Error("Invalid email format")
    }

    return sanitized
  }

  // Sanitize organization/user names
  static sanitizeName(name: string): string {
    if (!name) return ""

    return name
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim()
      .substring(0, 100) // Limit length
  }

  // Check if content contains potential XSS
  static containsXSS(content: string): boolean {
    if (!content) return false

    return XSS_CONFIG.FORBIDDEN_PATTERNS.some((pattern) => pattern.test(content))
  }

  // Generate Content Security Policy header
  static generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: In production, remove unsafe-inline and unsafe-eval
      "style-src 'self' 'unsafe-inline'", // Note: In production, use nonces instead of unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.vercel.com https://*.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
  }
}

// Middleware for XSS protection
export function withXSSProtection(handler: Function) {
  return async (request: Request): Promise<Response> => {
    try {
      const response = await handler(request)

      // Add security headers
      response.headers.set("Content-Security-Policy", XSSProtection.generateCSPHeader())
      response.headers.set("X-Content-Type-Options", "nosniff")
      response.headers.set("X-Frame-Options", "DENY")
      response.headers.set("X-XSS-Protection", "1; mode=block")
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

      return response
    } catch (error) {
      console.error("XSS protection middleware error:", error)
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}

// React hook for client-side XSS protection
export function useXSSProtection() {
  return {
    sanitizeHTML: XSSProtection.sanitizeSignatureHTML,
    sanitizeText: XSSProtection.sanitizeText,
    sanitizeName: XSSProtection.sanitizeName,
    sanitizeEmail: XSSProtection.sanitizeEmail,
    containsXSS: XSSProtection.containsXSS,
  }
}

// Validation helper for forms
export function validateAndSanitizeFormData(formData: FormData): FormData {
  const sanitizedFormData = new FormData()

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      let sanitizedValue = value

      // Apply different sanitization based on field type
      if (key.includes("email")) {
        sanitizedValue = XSSProtection.sanitizeEmail(value)
      } else if (key.includes("html") || key.includes("content")) {
        sanitizedValue = XSSProtection.sanitizeSignatureHTML(value)
      } else if (key.includes("name") || key.includes("title")) {
        sanitizedValue = XSSProtection.sanitizeName(value)
      } else {
        sanitizedValue = XSSProtection.sanitizeText(value)
      }

      sanitizedFormData.append(key, sanitizedValue)
    } else {
      // For File objects, sanitize the filename
      if (value instanceof File) {
        const sanitizedFile = new File([value], XSSProtection.sanitizeFileName(value.name), {
          type: value.type,
          lastModified: value.lastModified,
        })
        sanitizedFormData.append(key, sanitizedFile)
      } else {
        sanitizedFormData.append(key, value)
      }
    }
  }

  return sanitizedFormData
}
