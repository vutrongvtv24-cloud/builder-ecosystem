# Báo Cáo Trạng Thái Dự Án: Builder Ecosystem (The All In Plan Clone)

## 1. Cấu Trúc Tổng Quan Dự Án

### Công Nghệ (Tech Stack)
- **Framework:** Next.js 16+ (App Router + Turbopack)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI (Design System)
- **Icons:** Lucide React
- **Authentication:** Supabase Auth (Google OAuth Only)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Storage:** Supabase Storage (Images, Avatars)
- **State Management:** React Context API
- **Theme:** next-themes (Dark/Light Mode)

### Kiến Trúc Giao Diện (UI Structure)
Hệ thống sử dụng bố cục **3 cột (Three-Column Layout)** đặc trưng của mạng xã hội:
1.  **Header (Thanh điều hướng trên cùng):**
    *   Logo thương hiệu.
    *   Thanh tìm kiếm (Search).
    *   Thông báo (Notification).
    *   **Khu vực Tài khoản:** Nút Đăng nhập (Sign In) hoặc Avatar người dùng (kèm Dropdown Đăng xuất).
2.  **Sidebar Trái (Left Sidebar - Navigation):**
    *   **Menu chính:** Home Feed.
    *   **Community Spaces:** Danh sách các không gian thảo luận (News, Job Market, Vibe Coding...).
        *   *Tính năng:* Hiển thị biểu tượng Ổ khóa nếu chưa đủ Level.
    *   **Classes (Lớp học RPG):** Danh sách các lớp nhân vật (Warrior, Magician, Pirate...).
        *   *Tính năng:* Phân quyền truy cập dựa trên Level.
3.  **Khu vực Trung tâm (Main Content - Feed/Page):**
    *   **Newsfeed:** Nơi hiển thị bài viết, trạng thái, cập nhật từ cộng đồng.
    *   **Dynamic Pages:** Trang hiển thị nội dung chi tiết của từng Class hoặc Space.
4.  **Sidebar Phải (Right Sidebar - Gamification):**
    *   **Your Progress:** Thông tin Level, thanh XP, Danh hiệu (Badges).
    *   **Leaderboard:** Bảng xếp hạng thành viên thực tế từ Database.

---

## 2. Trạng Thái Chức Năng (Implementation Status)

### ✅ Đã Hoàn Thành (Completed)

#### A. Core & UI Foundation
- [x] **Setup dự án:** Next.js 16, TypeScript, Tailwind, Shadcn/UI.
- [x] **Responsive Design:** Giao diện tương thích Mobile/Desktop.
- [x] **Dark Mode:** Tích hợp sẵn giao diện tối màu (Premium look).
- [x] **Dynamic Routing:**
    - Router động cho Classes (`/class/[slug]`).
    - Router động cho Spaces (`/space/[slug]`).
    - Router động cho Profiles (`/profile/[id]`).

#### B. Authentication (Xác thực)
- [x] **Google Login Only:** Sử dụng Supabase Auth với Google OAuth.
- [x] **Auth Page:** Trang Login đơn giản với nút "Continue with Google".
- [x] **Session Management:** Hiển thị Avatar/Tên thật từ Google, Nút Đăng xuất.
- [x] **Middleware:** Tự động refresh session qua Supabase SSR.

#### C. Database & Backend
- [x] **Supabase Integration:** PostgreSQL với đầy đủ RLS policies.
- [x] **Tables:** profiles, posts, likes, comments, badges, user_badges, notifications, conversations, max_participants, direct_messages.
- [x] **Triggers:** Auto-create profile, auto-update like/comment counts, auto-award badges, auto-create notifications.
- [x] **Storage Buckets:** images, post_images, avatars.

#### D. Gamification System
- [x] **XP & Leveling:** Cộng XP khi tương tác, tự động Level Up.
- [x] **Badges System:** Tự động mở khóa huy hiệu khi đạt điều kiện.
- [x] **Leaderboard:** Bảng xếp hạng thực tế từ Database.
- [x] **Locked Content:** Khóa nội dung theo Level yêu cầu.

#### E. Social Features
- [x] **Posting:** Đăng bài viết với ảnh (Upload + Compression).
- [x] **Likes & Comments:** Optimistic UI với Realtime sync.
- [x] **User Profile Page:** Hiển thị chi tiết, badges, lịch sử bài đăng.
- [x] **Notifications:** Realtime thông báo (Like, Comment, Badge).
- [x] **Direct Messages:** Chat 1-1 giữa các thành viên.
- [x] **Search:** Tìm kiếm bài viết và người dùng.

#### F. Profile Customization (Mới - 19/01/2026)
- [x] **Đổi tên 1 lần:** Cho phép đổi display name 1 lần duy nhất.
- [x] **Đổi avatar 1 lần:** Cho phép upload avatar mới 1 lần duy nhất.
- [x] **Badges bên phải tên:** Hiển thị badges ngay cạnh tên profile.
- [x] **Click Leaderboard → Chat:** Click người dùng để chat trực tiếp.
- [x] **Follow/Unfollow:** Theo dõi người dùng khác với số followers/following hiển thị trên Profile.

#### G. Enhanced XP System (Mới - 19/01/2026)
- [x] **Multiple XP Sources:** Post (+10), Like given (+2), Like received (+5), Comment (+3), Comment received (+5), Follow (+2), Followed (+10)
- [x] **Database Triggers:** XP được cộng tự động từ Supabase triggers (an toàn, không thể hack từ client).
- [x] **Progressive Leveling:** XP cần thiết = Level × 100 (Level 1: 100 XP, Level 2: 200 XP, Level 3: 300 XP...).
- [x] **XP Toast Animation:** Hiển thị popup +XP với hiệu ứng animation khi nhận XP.
- [x] **Realtime XP Sync:** Cập nhật XP realtime qua Supabase subscription.

---

## 3. Các Phần Còn Thiếu & Hướng Phát Triển (Roadmap)

### 🚧 Chưa Triển Khai (Pending)

#### Monetization (Kiếm tiền)
- [ ] **Payment Gateway:** Tích hợp Stripe/PayPal để mua khóa học hoặc nâng cấp Premium.
- [ ] **Premium Content:** Phân quyền nội dung dành riêng cho thành viên trả phí.
- [ ] **Subscription Plans:** Các gói đăng ký (Free, Pro, Enterprise).

#### Deployment
- [ ] **Vercel Production:** Deploy lên production (đang gặp lỗi build).
- [ ] **Custom Domain:** Kết nối domain riêng.
- [ ] **Google OAuth Production:** Cấu hình redirect URI cho production.

### 💡 Gợi Ý Mở Rộng (Optional Enhancements)

- [ ] **Group Chat:** Chat nhóm nhiều người.
- [ ] **Follow/Unfollow:** Theo dõi người dùng khác.
- [ ] **Private Posts:** Bài viết chỉ visible cho followers.
- [ ] **Video Upload:** Hỗ trợ upload video bài viết.
- [ ] **Rich Text Editor:** Soạn thảo bài viết với formatting.
- [ ] **Push Notifications:** Thông báo đẩy trên mobile/desktop.
- [ ] **Admin Dashboard:** Quản lý nội dung và người dùng.
- [ ] **Analytics:** Thống kê lượt xem, tương tác.

---

## 4. Database Schema Overview

```
profiles (id, email, full_name, avatar_url, bio, level, xp, role, name_changed, avatar_changed)
posts (id, user_id, content, image_url, likes_count, comments_count, space_id)
likes (id, user_id, post_id)
comments (id, user_id, post_id, content)
badges (id, name, description, icon, required_value)
user_badges (id, user_id, badge_id, awarded_at)
notifications (id, user_id, actor_id, type, reference_id, message, is_read)
conversations (id, created_at, updated_at)
max_participants (conversation_id, user_id, joined_at)
direct_messages (id, conversation_id, sender_id, content, is_read)
```

---

*Cập nhật lần cuối: 19/01/2026 14:12*
*File được tạo tự động bởi Trợ lý AI Antigravity.*
