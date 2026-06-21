# 🔐 Supabase Integration - Quick Setup Guide

## Step 1: Get Your Supabase Credentials

### Go to Supabase Dashboard:

1. Visit: https://app.supabase.com
2. Click on your IAS project
3. Go to **Settings** → **API** (left sidebar)

### Copy these credentials:

#### **Project URL:**

- Look for "Project URL"
- Format: `https://your-project-id.supabase.co`
- Copy the full URL

#### **Anon Key:**

- Look for "anon public" key under "API keys"
- This is your **SUPABASE_ANON_KEY**
- Copy this key

#### **Service Role Key:**

- Look for "service_role" key (marked as Secret)
- This is your **SUPABASE_SERVICE_KEY**
- ⚠️ **NEVER share this key publicly!** Only use it on the backend!

---

## Step 2: Update Environment Variables

### For Backend (`Backend/.env`):

```env
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Replace:**

- `your-project-id` with your actual project ID
- `eyJhbGc...` with your actual SUPABASE_ANON_KEY
- `eyJhbGc...` (service key) with your actual SUPABASE_SERVICE_KEY

### For Frontend (`Frontend/.env`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api
```

**Replace:**

- `your-project-id` with your actual project ID
- `eyJhbGc...` with your actual SUPABASE_ANON_KEY

---

## Step 3: Verify Database Setup

1. Go to Supabase Dashboard → **SQL Editor**
2. Run a test query:

```sql
-- Test connection
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see all 15 tables from the schema file.

---

## Step 4: Run the Application

### Terminal 1 - Start Backend:

```bash
cd Backend
npm start
# Should show: ✅ Server is running smoothly on port 5000
```

### Terminal 2 - Start Frontend:

```bash
cd Frontend
npm run dev
# Should show: ➜ Local: http://localhost:5173/
```

---

## Step 5: Test the Connection

### Test API Health:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "Server is running smoothly",
  "timestamp": "2026-06-21T..."
}
```

### Test in Browser:

1. Open: http://localhost:5173
2. Try signing up with a test account

---

## API Endpoints Available

### Authentication

- `POST /api/auth/signup` - Sign up new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/update-password` - Update password

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/lrn/:lrn` - Get student by LRN
- `GET /api/students/grade/:grade` - Get students by grade
- `GET /api/students/section/:section` - Get students by section
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Grades

- `GET /api/grades` - Get all grades
- `GET /api/grades/student/:studentId` - Get grades by student
- `GET /api/grades/teacher/:teacherId` - Get grades by teacher
- `GET /api/grades/class/:classId` - Get grades by class
- `POST /api/grades` - Create grade
- `PUT /api/grades/:id` - Update grade
- `DELETE /api/grades/:id` - Delete grade

### Attendance

- `POST /api/attendance` - Record attendance
- `GET /api/attendance/student/:studentId` - Get student attendance
- `GET /api/attendance/summary/:studentId` - Get attendance summary
- `GET /api/attendance/date/:date` - Get attendance by date
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

---

## Troubleshooting

### Error: "Missing Supabase credentials"

- ❌ Problem: Environment variables not set correctly
- ✅ Solution: Check that `.env` files have correct values from your Supabase dashboard

### Error: "Connection refused on port 5000"

- ❌ Problem: Backend not running
- ✅ Solution: Run `npm start` in the Backend directory

### Error: "Cannot fetch from API"

- ❌ Problem: Frontend can't reach backend
- ✅ Solution: Make sure both frontend and backend are running on correct ports

### Error: "Invalid API Key"

- ❌ Problem: Wrong Supabase keys
- ✅ Solution: Double-check keys from Supabase dashboard → Settings → API

### Error: "Table does not exist"

- ❌ Problem: Database schema not created
- ✅ Solution: Run the `supabase_schema.sql` file in Supabase SQL Editor

---

## Next Steps

1. ✅ Set up Supabase credentials in `.env` files
2. ✅ Run both backend and frontend
3. ✅ Test API endpoints
4. ⏭️ Create sample data in the database
5. ⏭️ Connect Frontend components to real API calls
6. ⏭️ Test the full student portal workflow

---

## Important Security Notes

⚠️ **DO NOT:**

- Commit `.env` files to git
- Share your SUPABASE_SERVICE_KEY
- Use service key in frontend
- Expose API keys in client-side code

✅ **DO:**

- Keep `.env` files in `.gitignore`
- Use SUPABASE_ANON_KEY on frontend only
- Use SUPABASE_SERVICE_KEY only on backend
- Rotate keys regularly
- Enable Row-Level Security (RLS) policies

---

For more help, visit: https://supabase.com/docs

Happy coding! 🚀
