# Database Migration and Admin Setup Checklist

## ✅ Completed Tasks

### 1. Database Migration Infrastructure
- ✅ Created migration script for verification status (`scripts/migrateVerificationStatus.js`)
- ✅ Created client-side migration utilities (`src/utils/migrationUtils.js`)
- ✅ Added DatabaseMaintenance component with migration tools
- ✅ Integrated migration tools into AdminPanel

### 2. Admin User Management
- ✅ Created admin user setup script (`scripts/setupAdminUser.js`)
- ✅ Added admin user setup functionality to DatabaseMaintenance
- ✅ Created role-based access control system
- ✅ Added admin permissions management

### 3. System Status
- ✅ React development server running on localhost:5174
- ✅ Express proxy server running on localhost:3000
- ✅ All core features operational

## 🔄 Testing Checklist

### Pre-Migration Testing
- [ ] **Access Admin Panel**: Login and navigate to Admin Panel
- [ ] **Check Database Maintenance**: Verify DatabaseMaintenance component loads
- [ ] **View Verification Stats**: Check current university verification status
- [ ] **Verify Alert System**: Ensure alerts display properly

### Migration Testing
- [ ] **Run Verification Migration**: Execute migration for existing universities
  - Go to Admin Panel → Database Maintenance
  - Click "Run Verification Migration"
  - Verify success/error handling
- [ ] **Check Migration Results**: Review detailed migration results
- [ ] **Verify Database Changes**: Confirm universities now have verification status
- [ ] **Test Verification Filtering**: Ensure non-admin users only see verified universities

### Admin User Setup Testing
- [ ] **Setup Test Admin User**: 
  1. Create a test user account through normal signup
  2. Get Firebase Auth UID from Firebase Console
  3. Use admin setup tool to grant admin privileges
  4. Verify role change in Firestore
- [ ] **Test Admin Access**: Login with new admin account and verify access to:
  - Admin Panel
  - University Management
  - Database Maintenance
  - Verification workflows

### University Verification Testing
- [ ] **Add Unverified University**: Use web scraping or manual entry
- [ ] **Test Verification Workflow**: 
  - Verify university shows as "Pending Review"
  - Use admin approval process
  - Confirm status changes to "Verified"
- [ ] **Test User Visibility**: Ensure regular users don't see unverified universities
- [ ] **Test Admin Visibility**: Ensure admins can see all universities

### Edge Case Testing
- [ ] **Empty Database**: Test migration with no universities
- [ ] **Already Migrated**: Test migration on already migrated data
- [ ] **Network Errors**: Test error handling for failed operations
- [ ] **Permission Errors**: Test behavior for non-admin users accessing admin features

## 🛠️ Manual Testing Steps

### Step 1: Database Migration
1. Open http://localhost:5174
2. Login with any account
3. Navigate to Admin Panel (if you have admin role)
4. Go to Database Maintenance tab
5. Check verification statistics
6. Run migration if needed
7. Verify results

### Step 2: Admin Setup
1. Create a new user account through signup
2. Login to Firebase Console → Authentication
3. Find the user and copy their UID
4. Go to Database Maintenance → Admin User Setup
5. Enter email and UID
6. Grant admin privileges
7. Logout and login with the new admin account
8. Verify admin access

### Step 3: University Management
1. Login as admin
2. Go to Admin Panel → Manage Universities
3. Test adding new universities
4. Test verification workflow
5. Test status changes

## 🔍 What to Verify

### Database Changes
- University documents have `isVerified` field
- User documents have correct `role` field
- Admin users have `permissions` object

### UI Behavior
- Verification badges show on university cards
- Admin features only visible to admin users
- Migration tools work correctly
- Error handling displays appropriate messages

### Functionality
- Regular users only see verified universities
- Admin users can see all universities
- Verification workflow updates status correctly
- PDF export includes verification status

## 📝 Known Limitations

1. **Firebase Auth UID Requirement**: Admin setup requires manual UID lookup
2. **Migration Idempotency**: Migration can be run multiple times safely
3. **Real-time Updates**: UI may need refresh after role changes
4. **Firestore Rules**: May need index creation for new query patterns

## 🚀 Next Steps After Testing

1. **Production Deployment**: Deploy to Firebase Hosting
2. **Firestore Index Optimization**: Create composite indexes for new queries
3. **User Documentation**: Update user guides with new admin features
4. **Monitoring Setup**: Add analytics for admin operations
5. **Backup Strategy**: Implement data backup before migrations

## 📞 Troubleshooting

### Common Issues
- **"Port in use" errors**: Multiple server instances running
- **Firebase permission errors**: Check Firestore security rules
- **Migration timeouts**: Large datasets may need batch processing
- **Admin access denied**: Verify user role in Firestore manually

### Quick Fixes
- Restart development servers if needed
- Clear browser cache for role changes
- Check browser console for detailed error messages
- Verify Firebase configuration is correct
