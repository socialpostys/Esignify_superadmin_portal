import { nanoid } from "nanoid"

// Mock data storage
const mockDb = {
  organizations: [] as any[],
  users: [] as any[],
  signature_templates: [] as any[],
  azure_settings: [] as any[],
  user_signatures: [] as any[],
}

// Mock Supabase client for development and testing
export const createMockSupabaseClient = () => {
  return {
    from: (table: string) => ({
      select: (query?: string) => {
        // Simple select without joins
        if (!query || query === "*") {
          return {
            order: (column: string, { ascending = true } = {}) => ({
              then: (callback: Function) => {
                const items = [...mockDb[table as keyof typeof mockDb]].sort((a, b) => {
                  if (ascending) {
                    return a[column] > b[column] ? 1 : -1
                  } else {
                    return a[column] < b[column] ? 1 : -1
                  }
                })
                return callback({
                  data: items,
                  error: null,
                })
              },
            }),
            eq: (column: string, value: any) => ({
              single: async () => {
                const items = mockDb[table as keyof typeof mockDb].filter((item) => item[column] === value)
                return {
                  data: items.length > 0 ? items[0] : null,
                  error: null,
                }
              },
              maybeSingle: async () => {
                const items = mockDb[table as keyof typeof mockDb].filter((item) => item[column] === value)
                return {
                  data: items.length > 0 ? items[0] : null,
                  error: null,
                }
              },
            }),
            then: (callback: Function) => {
              return callback({
                data: mockDb[table as keyof typeof mockDb],
                error: null,
              })
            },
          }
        }

        // Complex select with joins - return error for now
        return {
          order: () => ({
            then: (callback: Function) => {
              return callback({
                data: null,
                error: { message: "Complex queries not supported in mock client" },
              })
            },
          }),
        }
      },
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const now = new Date().toISOString()
            const newItem = {
              id: nanoid(),
              created_at: now,
              updated_at: now,
              ...data,
            }
            mockDb[table as keyof typeof mockDb].push(newItem)
            console.log(`[MOCK] Inserted into ${table}:`, newItem)
            return {
              data: newItem,
              error: null,
            }
          },
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              const index = mockDb[table as keyof typeof mockDb].findIndex((item) => item[column] === value)
              if (index !== -1) {
                mockDb[table as keyof typeof mockDb][index] = {
                  ...mockDb[table as keyof typeof mockDb][index],
                  ...data,
                  updated_at: new Date().toISOString(),
                }
                return {
                  data: mockDb[table as keyof typeof mockDb][index],
                  error: null,
                }
              }
              return {
                data: null,
                error: { message: "Item not found" },
              }
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: (callback: Function) => {
            const index = mockDb[table as keyof typeof mockDb].findIndex((item) => item[column] === value)
            if (index !== -1) {
              mockDb[table as keyof typeof mockDb].splice(index, 1)
              return callback({
                error: null,
              })
            }
            return callback({
              error: { message: "Item not found" },
            })
          },
        }),
        in: (column: string, values: any[]) => ({
          then: (callback: Function) => {
            mockDb[table as keyof typeof mockDb] = mockDb[table as keyof typeof mockDb].filter(
              (item) => !values.includes(item[column]),
            )
            return callback({
              error: null,
            })
          },
        }),
      }),
    }),
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // Mock authentication
        if (email === "admin" && password === "admin123") {
          return {
            data: {
              user: { id: "admin-user-id", email: "admin" },
              session: { access_token: "mock-token" },
            },
            error: null,
          }
        }
        return {
          data: null,
          error: { message: "Invalid login credentials" },
        }
      },
      signOut: async () => {
        return { error: null }
      },
    },
  }
}
