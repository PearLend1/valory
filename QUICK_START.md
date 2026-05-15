# VALORY - Quick Start Guide

## 🚀 Get Up and Running in 2 Minutes

### Step 1: Install Dependencies
```bash
npm install
```
This installs all 50+ dependencies needed for the React/Express/tRPC stack.

### Step 2: Start Development Server
```bash
npm run dev
```

You'll see output like:
```
[Demo Mode] Enabled - using mock data instead of database
Server running on http://localhost:3000/
```

### Step 3: Open in Browser
Navigate to **http://localhost:3000**

---

## 📌 What You'll See

### Demo Data Included
- **20 UK Properties** across London, Manchester, Birmingham, Bristol, Edinburgh, Leeds, Liverpool, Bath, Oxford, and Cambridge
- **4 Pre-authenticated Users** ready to demo:
  - Vendor (seller)
  - Agent (real estate professional)
  - Buyer (property hunter)
  - Admin (system admin)

### All Pages Working
- **Home** - Landing page with property showcase
- **Discover** - Search and filter properties
- **Property Detail** - Full property information with valuation
- **Seller Valuation** - Valuation request flow
- **Saved Properties** - Buyer's watchlist
- **Agent Dashboard** - Agent tools
- **Vendor Dashboard** - Seller dashboard
- **Agent Landing** - Agent signup page

---

## 🎭 Switch Between User Roles

To see the app from different perspectives, use query parameters:

1. **Vendor/Seller View** (default)
   - Access seller dashboard
   - Request property valuations
   - View lead state

2. **Agent View**
   - Access agent dashboard with listings
   - View pricing insights
   - Manage market adjustments

3. **Buyer View**
   - Discover and search properties
   - Save properties to watchlist
   - View momentum and pricing signals

4. **Admin View**
   - System administration access

---

## 🎨 Design & Theme

- **Dark Cinematic Theme**: Premium copper/bronze color scheme
- **Responsive**: Works on desktop, tablet, mobile
- **Smooth Animations**: Tailwind CSS + custom components
- **Accessible**: Radix UI primitives for inclusive design

---

## 🔑 Key Features

✅ **No Database Required** - Mock data built-in  
✅ **No Auth Server** - Demo users auto-authenticated  
✅ **Full UI Library** - 24+ pre-built Radix UI components  
✅ **tRPC Type-Safe API** - Full client/server type safety  
✅ **Dark Theme** - Beautiful copper/slate color palette  
✅ **Real UK Data** - Authentic property data and postcodes  
✅ **Production Ready** - Switch to real database anytime  

---

## 🔗 API Endpoints

All tRPC procedures work without a database:

- `properties.list` - Get properties with filters
- `properties.getById` - Get single property
- `valuation.calculateFourLayer` - Generate valuation
- `valuation.estimate` - Price estimates by postcode
- `follow.toggleFollowProperty` - Save/unsave properties
- `timeline.getPropertyTimeline` - Property events
- `agent.getStats` - Agent statistics
- And 12+ more...

---

## 📝 Architecture

```
┌─────────────────────────────────────────┐
│         React Client (Vite)             │
│  (Home, Discover, Dashboards, etc)      │
└──────────────┬──────────────────────────┘
               │ tRPC HTTP Batch Link
               ↓
┌──────────────────────────────────────────┐
│   Express Server (Node.js)               │
│   - Demo Mode Auto-Detection             │
│   - tRPC Router (8 routers)              │
│   - Mock Data Layer                      │
│   - Built-in Vite Dev Server             │
└──────────────────────────────────────────┘
```

---

## 🛠 What's Next?

### To Use Real Database
1. Install MySQL/PostgreSQL
2. Uncomment `DATABASE_URL` in `.env`
3. Run: `npx drizzle-kit push`
4. Set `OAUTH_SERVER_URL` for real auth

### To Deploy
```bash
npm run build
npm start  # Runs production version
```

---

## 💡 Pro Tips

- Dark theme is default (no toggle in demo)
- Properties auto-load with realistic pricing
- Agent subscriptions auto-granted in demo mode
- No database writes = safe testing
- All pages render instantly

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Change `PORT` in `.env` |
| Blank page | Check browser console for errors |
| Properties not loading | Clear cache, restart server |
| Theme looks light | App.tsx should have `defaultTheme="dark"` |

---

## 📞 Support

All files are well-commented with TypeScript for IDE autocompletion.
Check `LAUNCH_CHECKLIST.md` for detailed pre-presentation checklist.

**Happy demoing! 🎉**
