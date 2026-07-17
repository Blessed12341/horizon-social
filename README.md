# Horizon Social

## A Complete Production-Ready Social Media Platform

Horizon Social is a full-featured social media platform similar to Facebook, Instagram, TikTok, Snapchat, and X while maintaining its own unique identity.

### Features

#### Authentication & User Management
- ✅ Email/password sign up and login
- ✅ Password reset functionality
- ✅ Email verification
- ✅ Secure sessions with JWT
- ✅ Profile editing
- ✅ Username uniqueness
- ✅ Privacy settings
- ✅ Block and report users

#### User Profiles
- ✅ Profile photo and cover photo
- ✅ Bio and website link
- ✅ Followers and following system
- ✅ Friend requests and acceptance
- ✅ Verified badges
- ✅ Creator accounts
- ✅ Public and private profiles

#### Feed & Content
- ✅ Infinite scrolling feed
- ✅ Image, video, and text posts
- ✅ Poll support
- ✅ GIF integration
- ✅ Hashtags and mentions
- ✅ Like, comment, share, save functionality
- ✅ Trending page

#### Video System
- ✅ HD video uploads
- ✅ Short-form vertical videos (TikTok-style)
- ✅ Adaptive streaming video player
- ✅ Watch history
- ✅ Continue watching feature
- ✅ Video recommendations
- ✅ Like, comment, share, save

#### Livestream System
- ✅ Go Live button and scheduling
- ✅ Live video and audio
- ✅ Live chat with moderation
- ✅ Emoji reactions
- ✅ Viewer count
- ✅ Moderator controls
- ✅ Host and co-host support
- ✅ Guest invitations
- ✅ Screen sharing
- ✅ Stream recording and replay
- ✅ Adaptive bitrate streaming
- ✅ Auto-reconnect functionality
- ✅ Mobile optimized

#### Messaging System
- ✅ One-to-one direct messaging
- ✅ Group chat support
- ✅ Voice messages
- ✅ Image and video sharing
- ✅ File sharing
- ✅ Read receipts and typing indicators
- ✅ Online status
- ✅ Voice and video calls

#### Notifications
- ✅ Real-time notifications
- ✅ Push notifications
- ✅ Email notifications
- ✅ Mention notifications
- ✅ Livestream notifications

#### Search
- ✅ Search users, posts, hashtags
- ✅ Search videos
- ✅ Search livestreams
- ✅ Advanced filtering

#### Creator Features
- ✅ Creator dashboard
- ✅ Analytics and insights
- ✅ Monetization dashboard
- ✅ Subscriptions and tiers
- ✅ Tips and donations
- ✅ Premium memberships
- ✅ Ad revenue support

#### Admin Dashboard
- ✅ Total users and activity metrics
- ✅ Active and online user tracking
- ✅ Content statistics
- ✅ Reports queue and moderation
- ✅ User management and bans
- ✅ Content moderation tools
- ✅ Advanced analytics

#### Performance & Security
- ✅ Lazy loading and CDN optimization
- ✅ Image and video optimization
- ✅ Responsive mobile design
- ✅ Fast page loads
- ✅ SEO optimization
- ✅ Accessibility support
- ✅ Rate limiting
- ✅ CSRF and XSS protection
- ✅ SQL injection protection
- ✅ Input validation
- ✅ Role-based access control

### Tech Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- Socket.io Client for real-time features

**Backend:**
- Node.js / Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

**Real-time & Streaming:**
- Socket.io for messaging and notifications
- LiveKit for livestreaming
- WebRTC for video calls

**Payments:**
- Stripe for subscriptions and payments

**Storage:**
- AWS S3 for media storage
- CDN optimization

**Authentication:**
- JWT tokens
- bcryptjs for password hashing
- Email verification

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Blessed12341/horizon-social.git
cd horizon-social
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database:**
```bash
npm run db:push
```

5. **Run development server:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Build for Production

```bash
npm run build
npm start
```

### Deployment

The application is configured for deployment on:
- **Cloudflare Pages** (Frontend)
- **Cloudflare Workers** (API)
- **Any Node.js hosting** (Backend)

### License

MIT License - See LICENSE file for details
