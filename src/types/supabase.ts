
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    bio: string | null
                    level: number
                    xp: number
                    role: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    level?: number
                    xp?: number
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    level?: number
                    xp?: number
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            posts: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    image_url: string | null
                    likes_count: number
                    comments_count: number
                    space_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    image_url?: string | null
                    likes_count?: number
                    comments_count?: number
                    space_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    image_url?: string | null
                    likes_count?: number
                    comments_count?: number
                    space_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
