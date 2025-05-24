# EduVox Deployment Guide

This guide will help you deploy EduVox to Firebase Hosting and configure Firestore security rules.

## Prerequisites

1. Firebase CLI installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Firebase project created with:
   - Authentication enabled (Email/Password and Google)
   - Firestore Database enabled
   - Firebase Hosting enabled

## Deployment Steps

### 1. Login to Firebase
```bash
firebase login
```

### 2. Initialize Firebase in your project
```bash
firebase init
```
Select:
- Firestore: Configure security rules and indexes files
- Hosting: Configure files for Firebase Hosting

Use existing files when prompted.

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Build the React Application
```bash
npm run build
```

### 5. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

## Post-Deployment Configuration

### Configure Authentication Providers

1. **Email/Password Authentication**:
   - Already enabled by default

2. **Google Authentication**:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Google provider
   - Add your hosting domain to authorized domains

### Set up Admin Users

Since the first user will be a student by default, you'll need to manually set an admin:

1. Create a user account through the app
2. Go to Firestore in Firebase Console
3. Find the user document in the `users` collection
4. Edit the `role` field from `student` to `admin`

### Environment Variables for Production

For production deployment, make sure to:
1. Never commit `.env` files to version control
2. Set environment variables in your hosting platform
3. Use Firebase Functions for sensitive operations

## Monitoring and Analytics

- Enable Firebase Analytics in your project
- Monitor authentication events
- Set up Firestore monitoring

## Security Checklist

- [ ] Firestore security rules deployed
- [ ] Authentication providers configured
- [ ] Admin users set up
- [ ] Environment variables secured
- [ ] HTTPS enabled (automatic with Firebase Hosting)

## Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the verification steps
4. Update DNS records as instructed

## Troubleshooting

### Common Issues:

1. **Authentication not working**: Check if providers are enabled in Firebase Console
2. **Firestore permission denied**: Verify security rules are deployed
3. **Build errors**: Ensure all environment variables are set correctly

### Useful Commands:

```bash
# View deployment history
firebase hosting:list

# View current project
firebase projects:list

# Switch Firebase project
firebase use <project-id>

# View logs
firebase functions:log
```

## Support

For deployment issues:
- Check Firebase Console for error logs
- Review Firebase documentation
- Contact support through Firebase Console
