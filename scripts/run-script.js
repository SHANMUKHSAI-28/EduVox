#!/usr/bin/env node

/**
 * Script runner utility that ensures environment variables are loaded
 * Usage: node scripts/run-script.js <script-name>
 * Example: node scripts/run-script.js migrateVerificationStatus
 */

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const availableScripts = {
  'migrate': 'migrateVerificationStatus.js',
  'setupAdmin': 'setupAdminUser.js',
  'testUniversities': '../test-university-loading.js',
  'testPopulate': '../test-populate.js'
};

function showUsage() {
  console.log('\n🔧 EduVox Script Runner');
  console.log('========================');
  console.log('\nUsage: node scripts/run-script.js <script-name>');
  console.log('\nAvailable scripts:');
  Object.keys(availableScripts).forEach(name => {
    console.log(`  ${name.padEnd(15)} - ${availableScripts[name]}`);
  });
  console.log('\nExample: node scripts/run-script.js migrate');
  console.log('\nNote: Make sure your .env file is properly configured with Firebase credentials.');
}

function validateEnvironment() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file and ensure all Firebase configuration variables are set.');
    console.error('You can copy .env.example to .env and fill in your values.');
    return false;
  }
  
  return true;
}

async function runScript(scriptName) {
  if (!availableScripts[scriptName]) {
    console.error(`❌ Unknown script: ${scriptName}`);
    showUsage();
    process.exit(1);
  }
  
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  const scriptPath = join(__dirname, availableScripts[scriptName]);
  console.log(`🚀 Running script: ${availableScripts[scriptName]}`);
  
  const child = spawn('node', [scriptPath], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ Script completed successfully');
    } else {
      console.error(`❌ Script failed with exit code: ${code}`);
    }
    process.exit(code);
  });
  
  child.on('error', (error) => {
    console.error('❌ Failed to start script:', error.message);
    process.exit(1);
  });
}

// Main execution
const scriptName = process.argv[2];

if (!scriptName) {
  showUsage();
  process.exit(1);
}

runScript(scriptName);
