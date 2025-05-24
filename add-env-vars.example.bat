@echo off
REM ===========================
REM VERCEL ENVIRONMENT VARIABLES SETUP
REM ===========================
REM This script helps you add environment variables to Vercel
REM IMPORTANT: Replace all placeholder values with your actual values
REM DO NOT commit this file with real values!

echo Adding environment variables to Vercel...
echo.
echo IMPORTANT: Make sure you have replaced all placeholder values below!
echo.

REM Firebase Configuration
echo Adding VITE_FIREBASE_API_KEY...
echo your-firebase-api-key-here | vercel env add VITE_FIREBASE_API_KEY production preview development

echo Adding VITE_FIREBASE_AUTH_DOMAIN...
echo your-project.firebaseapp.com | vercel env add VITE_FIREBASE_AUTH_DOMAIN production preview development

echo Adding VITE_FIREBASE_PROJECT_ID...
echo your-project-id | vercel env add VITE_FIREBASE_PROJECT_ID production preview development

echo Adding VITE_FIREBASE_STORAGE_BUCKET...
echo your-project.firebasestorage.app | vercel env add VITE_FIREBASE_STORAGE_BUCKET production preview development

echo Adding VITE_FIREBASE_MESSAGING_SENDER_ID...
echo your-sender-id | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production preview development

echo Adding VITE_FIREBASE_APP_ID...
echo your-app-id | vercel env add VITE_FIREBASE_APP_ID production preview development

echo Adding VITE_FIREBASE_MEASUREMENT_ID...
echo your-measurement-id | vercel env add VITE_FIREBASE_MEASUREMENT_ID production preview development

REM Google API Configuration
echo Adding VITE_GOOGLE_API_KEY...
echo your-google-api-key-here | vercel env add VITE_GOOGLE_API_KEY production preview development

echo Adding VITE_API_BASE_URL...
echo https://maps.googleapis.com/maps/api | vercel env add VITE_API_BASE_URL production preview development

REM AdSense Configuration
echo Adding VITE_ADSENSE_CLIENT_ID...
echo ca-pub-your-adsense-publisher-id | vercel env add VITE_ADSENSE_CLIENT_ID production preview development

echo Adding VITE_ADSENSE_BANNER_SLOT...
echo your-banner-ad-slot-id | vercel env add VITE_ADSENSE_BANNER_SLOT production preview development

echo Adding VITE_ADSENSE_SIDEBAR_SLOT...
echo your-sidebar-ad-slot-id | vercel env add VITE_ADSENSE_SIDEBAR_SLOT production preview development

echo Adding VITE_ADSENSE_ARTICLE_SLOT...
echo your-article-ad-slot-id | vercel env add VITE_ADSENSE_ARTICLE_SLOT production preview development

echo Adding VITE_ADSENSE_FOOTER_SLOT...
echo your-footer-ad-slot-id | vercel env add VITE_ADSENSE_FOOTER_SLOT production preview development

echo.
echo ===========================
echo Environment variables setup complete!
echo ===========================
echo.
echo Next steps:
echo 1. Verify all variables in Vercel dashboard
echo 2. Deploy your application
echo 3. Test that all features work with the new environment variables
echo.
pause
