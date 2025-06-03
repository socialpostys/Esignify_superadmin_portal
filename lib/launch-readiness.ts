interface LaunchCheck {
  category: string
  item: string
  status: "ready" | "needs_work" | "critical" | "optional"
  description: string
  priority: "high" | "medium" | "low"
  estimatedHours?: number
  dependencies?: string[]
}

interface LaunchReadiness {
  overallStatus: "ready" | "needs_work" | "not_ready"
  readyForLaunch: boolean
  criticalIssues: LaunchCheck[]
  recommendations: LaunchCheck[]
  categories: {
    [key: string]: {
      ready: number
      total: number
      percentage: number
    }
  }
}

export function assessLaunchReadiness(): LaunchReadiness {
  const checks: LaunchCheck[] = [
    // Core Functionality
    {
      category: "Core Functionality",
      item: "Database Schema",
      status: "ready",
      description: "All required tables and relationships are defined",
      priority: "high",
    },
    {
      category: "Core Functionality",
      item: "Authentication System",
      status: "ready",
      description: "Session-based auth with proper security",
      priority: "high",
    },
    {
      category: "Core Functionality",
      item: "Multi-tenant Architecture",
      status: "ready",
      description: "Organizations can be isolated properly",
      priority: "high",
    },
    {
      category: "Core Functionality",
      item: "Azure AD Integration",
      status: "ready",
      description: "Per-organization Azure AD configuration",
      priority: "high",
    },
    {
      category: "Core Functionality",
      item: "Exchange Online Integration",
      status: "ready",
      description: "Transport rule deployment via Microsoft Graph API",
      priority: "high",
    },
    {
      category: "Core Functionality",
      item: "Signature Management",
      status: "ready",
      description: "Create, edit, and deploy signature templates",
      priority: "high",
    },

    // Security
    {
      category: "Security",
      item: "Environment Variables",
      status: "ready",
      description: "Sensitive data stored in environment variables",
      priority: "high",
    },
    {
      category: "Security",
      item: "Input Validation",
      status: "needs_work",
      description: "Need comprehensive input validation and sanitization",
      priority: "high",
      estimatedHours: 8,
    },
    {
      category: "Security",
      item: "Rate Limiting",
      status: "critical",
      description: "No rate limiting implemented for API endpoints",
      priority: "high",
      estimatedHours: 4,
    },
    {
      category: "Security",
      item: "CSRF Protection",
      status: "needs_work",
      description: "Need CSRF tokens for forms",
      priority: "medium",
      estimatedHours: 2,
    },
    {
      category: "Security",
      item: "SQL Injection Protection",
      status: "ready",
      description: "Using Supabase ORM prevents SQL injection",
      priority: "high",
    },
    {
      category: "Security",
      item: "XSS Protection",
      status: "needs_work",
      description: "Need to sanitize HTML content in signatures",
      priority: "high",
      estimatedHours: 4,
    },

    // Production Infrastructure
    {
      category: "Infrastructure",
      item: "Production Database",
      status: "ready",
      description: "Supabase handles production database",
      priority: "high",
    },
    {
      category: "Infrastructure",
      item: "SSL/HTTPS",
      status: "needs_work",
      description: "Need to configure SSL certificate",
      priority: "high",
      estimatedHours: 2,
    },
    {
      category: "Infrastructure",
      item: "Domain Setup",
      status: "needs_work",
      description: "Need production domain configuration",
      priority: "high",
      estimatedHours: 1,
    },
    {
      category: "Infrastructure",
      item: "CDN Setup",
      status: "optional",
      description: "CDN for static assets (optional for initial launch)",
      priority: "low",
      estimatedHours: 4,
    },
    {
      category: "Infrastructure",
      item: "Backup Strategy",
      status: "ready",
      description: "Supabase handles automated backups",
      priority: "high",
    },

    // Monitoring & Logging
    {
      category: "Monitoring",
      item: "Error Logging",
      status: "ready",
      description: "Comprehensive error logging implemented",
      priority: "high",
    },
    {
      category: "Monitoring",
      item: "Performance Monitoring",
      status: "needs_work",
      description: "Need application performance monitoring",
      priority: "medium",
      estimatedHours: 6,
    },
    {
      category: "Monitoring",
      item: "Uptime Monitoring",
      status: "needs_work",
      description: "Need external uptime monitoring",
      priority: "medium",
      estimatedHours: 2,
    },
    {
      category: "Monitoring",
      item: "Alert System",
      status: "needs_work",
      description: "Need alerts for critical errors",
      priority: "medium",
      estimatedHours: 4,
    },

    // User Experience
    {
      category: "User Experience",
      item: "Responsive Design",
      status: "ready",
      description: "UI works on desktop and mobile",
      priority: "high",
    },
    {
      category: "User Experience",
      item: "Loading States",
      status: "ready",
      description: "Loading indicators for async operations",
      priority: "medium",
    },
    {
      category: "User Experience",
      item: "Error Messages",
      status: "ready",
      description: "User-friendly error messages",
      priority: "medium",
    },
    {
      category: "User Experience",
      item: "Email Notifications",
      status: "critical",
      description: "No email notifications for important events",
      priority: "medium",
      estimatedHours: 8,
    },

    // Documentation
    {
      category: "Documentation",
      item: "User Documentation",
      status: "critical",
      description: "No user guide or help documentation",
      priority: "medium",
      estimatedHours: 16,
    },
    {
      category: "Documentation",
      item: "Admin Documentation",
      status: "critical",
      description: "No admin setup and configuration guide",
      priority: "high",
      estimatedHours: 12,
    },
    {
      category: "Documentation",
      item: "API Documentation",
      status: "needs_work",
      description: "API endpoints need documentation",
      priority: "low",
      estimatedHours: 8,
    },

    // Testing
    {
      category: "Testing",
      item: "Unit Tests",
      status: "critical",
      description: "No unit tests implemented",
      priority: "medium",
      estimatedHours: 20,
    },
    {
      category: "Testing",
      item: "Integration Tests",
      status: "critical",
      description: "No integration tests for critical flows",
      priority: "medium",
      estimatedHours: 16,
    },
    {
      category: "Testing",
      item: "End-to-End Tests",
      status: "critical",
      description: "No E2E tests for user workflows",
      priority: "low",
      estimatedHours: 24,
    },

    // Compliance & Legal
    {
      category: "Compliance",
      item: "Privacy Policy",
      status: "critical",
      description: "No privacy policy",
      priority: "high",
      estimatedHours: 4,
    },
    {
      category: "Compliance",
      item: "Terms of Service",
      status: "critical",
      description: "No terms of service",
      priority: "high",
      estimatedHours: 4,
    },
    {
      category: "Compliance",
      item: "GDPR Compliance",
      status: "needs_work",
      description: "Need data export/deletion capabilities",
      priority: "high",
      estimatedHours: 12,
    },
    {
      category: "Compliance",
      item: "Data Retention Policy",
      status: "needs_work",
      description: "Need clear data retention policies",
      priority: "medium",
      estimatedHours: 2,
    },

    // Performance
    {
      category: "Performance",
      item: "Database Optimization",
      status: "ready",
      description: "Database indexes and queries are optimized",
      priority: "high",
    },
    {
      category: "Performance",
      item: "Caching Strategy",
      status: "needs_work",
      description: "No caching for frequently accessed data",
      priority: "medium",
      estimatedHours: 8,
    },
    {
      category: "Performance",
      item: "Image Optimization",
      status: "ready",
      description: "Using Next.js Image component",
      priority: "medium",
    },

    // Deployment
    {
      category: "Deployment",
      item: "CI/CD Pipeline",
      status: "needs_work",
      description: "No automated deployment pipeline",
      priority: "medium",
      estimatedHours: 8,
    },
    {
      category: "Deployment",
      item: "Environment Configuration",
      status: "needs_work",
      description: "Need production environment setup",
      priority: "high",
      estimatedHours: 4,
    },
    {
      category: "Deployment",
      item: "Database Migrations",
      status: "ready",
      description: "Database schema can be deployed",
      priority: "high",
    },
  ]

  // Calculate category statistics
  const categories: { [key: string]: { ready: number; total: number; percentage: number } } = {}

  checks.forEach((check) => {
    if (!categories[check.category]) {
      categories[check.category] = { ready: 0, total: 0, percentage: 0 }
    }
    categories[check.category].total++
    if (check.status === "ready") {
      categories[check.category].ready++
    }
  })

  Object.keys(categories).forEach((category) => {
    categories[category].percentage = Math.round((categories[category].ready / categories[category].total) * 100)
  })

  // Determine overall status
  const criticalIssues = checks.filter((check) => check.status === "critical")
  const highPriorityIssues = checks.filter((check) => check.status === "needs_work" && check.priority === "high")

  let overallStatus: "ready" | "needs_work" | "not_ready"
  let readyForLaunch: boolean

  if (criticalIssues.length > 0) {
    overallStatus = "not_ready"
    readyForLaunch = false
  } else if (highPriorityIssues.length > 3) {
    overallStatus = "needs_work"
    readyForLaunch = false
  } else {
    overallStatus = "needs_work" // Still has some issues but could launch
    readyForLaunch = true // MVP launch possible
  }

  return {
    overallStatus,
    readyForLaunch,
    criticalIssues: checks.filter((check) => check.status === "critical"),
    recommendations: checks.filter((check) => check.status === "needs_work"),
    categories,
  }
}

export function generateLaunchPlan(readiness: LaunchReadiness): string {
  let plan = "# Launch Readiness Plan\n\n"

  plan += `## Overall Status: ${readiness.overallStatus.toUpperCase()}\n`
  plan += `**Ready for Launch:** ${readiness.readyForLaunch ? "✅ YES (MVP)" : "❌ NO"}\n\n`

  if (readiness.criticalIssues.length > 0) {
    plan += "## 🚨 Critical Issues (Must Fix Before Launch)\n\n"
    readiness.criticalIssues.forEach((issue, index) => {
      plan += `${index + 1}. **${issue.item}** (${issue.category})\n`
      plan += `   - ${issue.description}\n`
      plan += `   - Priority: ${issue.priority}\n`
      if (issue.estimatedHours) {
        plan += `   - Estimated: ${issue.estimatedHours} hours\n`
      }
      plan += "\n"
    })
  }

  if (readiness.recommendations.length > 0) {
    plan += "## 🔧 Recommended Improvements\n\n"
    const highPriority = readiness.recommendations.filter((r) => r.priority === "high")
    const mediumPriority = readiness.recommendations.filter((r) => r.priority === "medium")

    if (highPriority.length > 0) {
      plan += "### High Priority\n"
      highPriority.forEach((issue, index) => {
        plan += `${index + 1}. **${issue.item}** (${issue.category})\n`
        plan += `   - ${issue.description}\n`
        if (issue.estimatedHours) {
          plan += `   - Estimated: ${issue.estimatedHours} hours\n`
        }
        plan += "\n"
      })
    }

    if (mediumPriority.length > 0) {
      plan += "### Medium Priority\n"
      mediumPriority.forEach((issue, index) => {
        plan += `${index + 1}. **${issue.item}** (${issue.category})\n`
        plan += `   - ${issue.description}\n`
        if (issue.estimatedHours) {
          plan += `   - Estimated: ${issue.estimatedHours} hours\n`
        }
        plan += "\n"
      })
    }
  }

  plan += "## 📊 Category Breakdown\n\n"
  Object.entries(readiness.categories).forEach(([category, stats]) => {
    const status = stats.percentage >= 80 ? "✅" : stats.percentage >= 60 ? "⚠️" : "❌"
    plan += `- **${category}**: ${status} ${stats.ready}/${stats.total} (${stats.percentage}%)\n`
  })

  plan += "\n## 🚀 Launch Strategy\n\n"
  if (readiness.readyForLaunch) {
    plan += "### MVP Launch Possible\n"
    plan += "You can launch with current functionality, but address critical issues first:\n\n"
    plan += "1. Fix all critical issues\n"
    plan += "2. Set up production environment\n"
    plan += "3. Configure domain and SSL\n"
    plan += "4. Create basic documentation\n"
    plan += "5. Launch with limited beta users\n"
    plan += "6. Iterate based on feedback\n"
  } else {
    plan += "### Not Ready for Launch\n"
    plan += "Critical issues must be resolved before launching:\n\n"
    plan += "1. Address all critical issues\n"
    plan += "2. Fix high-priority security concerns\n"
    plan += "3. Complete basic documentation\n"
    plan += "4. Set up monitoring and alerts\n"
    plan += "5. Test thoroughly\n"
  }

  return plan
}
