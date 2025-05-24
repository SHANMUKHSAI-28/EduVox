# EduVox Scripts Documentation

This directory contains utility scripts for managing the EduVox application. All scripts are designed to work with environment variables for security.

## Prerequisites

Before running any scripts, ensure you have:

1. **Environment Variables Set Up**: Copy `.env.example` to `.env` and fill in your Firebase configuration
2. **Dependencies Installed**: Run `npm install` to install required packages
3. **Firebase Project Access**: Ensure your Firebase credentials have appropriate permissions

## Available Scripts

### 1. Migration Script (`migrateVerificationStatus.js`)
Adds `isVerified: true` field to existing university documents in Firestore.

```bash
# Using npm script (recommended)
npm run script:migrate

# Or directly
node scripts/run-script.js migrate
```

**What it does:**
- Scans all existing university documents
- Adds `isVerified: true` to documents missing this field
- Uses batch operations for efficiency
- Provides detailed progress logging

### 2. Admin User Setup (`setupAdminUser.js`)
Creates or updates user documents with admin privileges.

```bash
# Using npm script (recommended)
npm run script:setup-admin

# Or directly
node scripts/run-script.js setupAdmin
```

**What it does:**
- Creates admin user documents with full permissions
- Sets up role-based access control
- Adds timestamps for audit trails
- Provides comprehensive admin permissions

### 3. University Loading Test (`test-university-loading.js`)
Tests the university data loading functionality.

```bash
# Using npm script (recommended)
npm run script:test-universities

# Or directly
node scripts/run-script.js testUniversities
```

**What it does:**
- Fetches first 10 universities from Firestore
- Validates data structure and required fields
- Provides detailed logging for debugging
- Checks database connectivity

### 4. University Population Test (`test-populate.js`)
Populates the database with sample university data for testing.

```bash
# Using npm script (recommended)
npm run script:test-populate

# Or directly
node scripts/run-script.js testPopulate
```

**What it does:**
- Adds sample university data to Firestore
- Creates properly structured documents
- Sets up test data for development
- Validates document creation

## Script Runner Utility

The `run-script.js` utility provides:

- **Environment Validation**: Checks for required environment variables
- **Error Handling**: Provides clear error messages and exit codes
- **Consistent Interface**: Standardized way to run all scripts
- **Help Documentation**: Shows available scripts and usage

### Usage
```bash
node scripts/run-script.js <script-name>
```

### Available script names:
- `migrate` - Run migration script
- `setupAdmin` - Set up admin user
- `testUniversities` - Test university loading
- `testPopulate` - Populate test data

## Environment Variables Required

All scripts require these environment variables in your `.env` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

## Security Features

- **No Hardcoded Credentials**: All scripts use environment variables
- **Validation**: Scripts validate required environment variables before execution
- **Error Handling**: Clear error messages for missing or invalid configuration
- **Git Ignored**: Sensitive files are properly ignored in version control

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   ❌ Missing required environment variables: VITE_FIREBASE_API_KEY, ...
   ```
   **Solution**: Copy `.env.example` to `.env` and fill in your Firebase configuration

2. **Permission Denied**
   ```
   ❌ Permission denied when accessing Firestore
   ```
   **Solution**: Ensure your Firebase project has Firestore enabled and your credentials have appropriate permissions

3. **Network Issues**
   ```
   ❌ Failed to connect to Firebase
   ```
   **Solution**: Check your internet connection and Firebase project configuration

4. **Module Not Found**
   ```
   ❌ Cannot find module 'dotenv'
   ```
   **Solution**: Run `npm install` to install all dependencies

### Getting Help

1. Check the `.env.example` file for required environment variables
2. Verify your Firebase project configuration
3. Ensure all dependencies are installed with `npm install`
4. Check the Firebase console for any service issues

## Development Notes

- Scripts use ES6 modules (`import/export`)
- Environment variables are loaded using `dotenv`
- Firebase operations use the Firebase v9 modular SDK
- Error handling includes proper exit codes for CI/CD integration
- All scripts include detailed logging for debugging

## Contributing

When adding new scripts:

1. Follow the existing pattern of environment variable usage
2. Add proper error handling and validation
3. Include the script in `run-script.js` available scripts
4. Add an npm script in `package.json`
5. Document the script's purpose and usage in this README
