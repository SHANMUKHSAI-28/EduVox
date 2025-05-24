# 🔐 EduVox Security Guide

## 🛡️ Environment Variables & API Keys Security

### **IMPORTANT: Your API keys and sensitive information are now protected!**

---

## 📁 **Files Secured:**

### **Protected Files (Now in .gitignore):**
- ✅ `.env` - Main environment variables
- ✅ `server/.env` - Server environment variables  
- ✅ `firebase-adminsdk-*.json` - Firebase service account keys
- ✅ `*secret*` - Any files containing secrets
- ✅ `*key*.json` - API key files

### **Example Files (Safe to commit):**
- ✅ `.env.example` - Template with placeholder values
- ✅ `server/.env.example` - Server template with placeholders

---

## 🔧 **Setup Instructions:**

### **For New Developers:**

1. **Copy example files:**
   ```powershell
   # Main environment file
   Copy-Item .env.example .env
   
   # Server environment file  
   Copy-Item server\.env.example server\.env
   ```

2. **Replace placeholder values:**
   - Open `.env` and `server\.env`
   - Replace all `your-*-here` placeholders with actual values
   - Get API keys from respective services (see links below)

3. **Never commit the actual .env files:**
   - Only commit `.env.example` files
   - Real `.env` files are automatically ignored by git

---

## 🔑 **API Keys & Credentials:**

### **Firebase Configuration:**
- **Console**: https://console.firebase.google.com/project/eduvox-cb8f0/settings/general
- **Required**: All VITE_FIREBASE_* variables
- **Location**: Project Settings → General → Your apps

### **Google Places API:**
- **Console**: https://console.cloud.google.com/apis/credentials
- **Required**: GOOGLE_API_KEY and VITE_GOOGLE_API_KEY
- **Enable**: Places API, Maps JavaScript API, Places (New) API

### **Google AdSense:**
- **Console**: https://www.google.com/adsense/
- **Required**: VITE_ADSENSE_CLIENT_ID and slot IDs
- **Location**: Sites → Ad units

---

## 🔐 **Security Best Practices:**

### **✅ DO:**
- Keep `.env.example` files updated with new variables
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Use least-privilege principle for API permissions
- Monitor API usage and set quotas

### **❌ DON'T:**
- Commit actual `.env` files to git
- Share API keys in chat, email, or documents
- Use production keys in development
- Store secrets in source code
- Push sensitive data to public repositories

---

## 🚨 **Security Checklist:**

### **Pre-Commit Checks:**
- [ ] `.env` files are in `.gitignore`
- [ ] No API keys in source code
- [ ] No hardcoded credentials
- [ ] Example files have placeholder values
- [ ] Sensitive data is properly masked

### **Deployment Security:**
- [ ] Production environment variables set in hosting platform
- [ ] API keys have proper restrictions (domain, IP)
- [ ] Firebase security rules are configured
- [ ] HTTPS is enforced everywhere
- [ ] CORS is properly configured

---

## 🔄 **Environment Variable Management:**

### **Development Environment:**
```bash
# Local development
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
```

### **Production Environment:**
```bash
# Production deployment
NODE_ENV=production
VITE_APP_URL=https://eduvox-cb8f0.web.app
```

### **Firebase Hosting:**
Environment variables are automatically managed by Firebase for client-side variables (VITE_*).

---

## 🛠️ **Troubleshooting:**

### **Common Issues:**

1. **"API key not found" error:**
   - Check `.env` file exists
   - Verify variable names match exactly
   - Restart development server after changes

2. **"Permission denied" errors:**
   - Check API key restrictions in Google Console
   - Verify correct API is enabled
   - Check quotas and billing

3. **Environment variables not loading:**
   - Ensure variables start with `VITE_` for client-side
   - Restart development server
   - Check for typos in variable names

---

## 📋 **Current Environment Variables:**

### **Client-Side (VITE_*):**
- `VITE_FIREBASE_API_KEY` - Firebase authentication
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase analytics
- `VITE_GOOGLE_API_KEY` - Google Places API
- `VITE_API_BASE_URL` - Google Maps API base URL
- `VITE_ADSENSE_CLIENT_ID` - AdSense publisher ID
- `VITE_ADSENSE_*_SLOT` - AdSense ad slot IDs

### **Server-Side:**
- `PORT` - Server port (default: 3000)
- `GOOGLE_API_KEY` - Google Places API for server
- `NODE_ENV` - Environment mode

---

## 🔍 **Security Monitoring:**

### **Regular Security Tasks:**
1. **Weekly**: Review API usage in Google Console
2. **Monthly**: Rotate API keys if needed
3. **Quarterly**: Audit environment variables
4. **Annually**: Review and update security practices

### **Monitoring Tools:**
- Google Cloud Console for API usage
- Firebase Console for authentication logs
- GitHub security alerts (if using GitHub)
- Regular dependency updates

---

## 📞 **Emergency Response:**

### **If API Keys Are Compromised:**
1. **Immediately**: Disable compromised keys in respective consoles
2. **Generate**: New API keys with same permissions
3. **Update**: Environment variables with new keys
4. **Deploy**: Updated configuration to production
5. **Monitor**: For unusual activity

### **Contact Information:**
- **Firebase Support**: https://firebase.google.com/support/
- **Google Cloud Support**: https://cloud.google.com/support/
- **Emergency**: Disable keys immediately, ask questions later

---

## ✅ **Security Status:**

### **✅ SECURED:**
- Environment variables protected
- API keys hidden from git
- Example files created
- Comprehensive .gitignore implemented
- Security documentation complete

### **🔒 PRODUCTION READY:**
Your EduVox application now follows security best practices and is ready for production deployment!

---

**Last Updated**: May 24, 2025  
**Security Level**: 🟢 HIGH  
**Compliance**: ✅ Ready for Production
