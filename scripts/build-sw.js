// scripts/build-sw.js
// Service Workerファイルに環境変数を注入するスクリプト

const fs = require('fs');
const path = require('path');

// .env.localファイルを読み込む（存在する場合）
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const templatePath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.template.js');
const outputPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');

// 環境変数を取得
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 必須環境変数のチェック
const envVarNames = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
};

const missingEnvVars = Object.entries(envVarNames).filter(([key]) => !firebaseConfig[key]);

if (missingEnvVars.length > 0) {
  console.error('❌ 以下の環境変数が設定されていません:');
  missingEnvVars.forEach(([, envVarName]) => {
    console.error(`   - ${envVarName}`);
  });
  console.error('\n.env.localファイルに環境変数を設定してください。');
  process.exit(1);
}

// テンプレートファイルを読み込む
let template = fs.readFileSync(templatePath, 'utf8');

// 環境変数を注入（プレースホルダーを実際の値に置き換え）
template = template.replace('NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey);
template = template.replace('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain);
template = template.replace('NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId);
template = template.replace('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket);
template = template.replace('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId);
template = template.replace('NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId);

// 出力ファイルに書き込む
fs.writeFileSync(outputPath, template, 'utf8');
console.log('✅ Service Workerファイルを生成しました:', outputPath);
