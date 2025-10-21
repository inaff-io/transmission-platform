#!/usr/bin/env node

/**
 * Debug: Verifica payload do JWT
 */

import jwt from 'jsonwebtoken';

const BASE_URL = 'https://transmission-platform-xi.vercel.app';

async function debugJWT() {
  try {
    console.log('🔐 Fazendo login...\n');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pecosta26@gmail.com' })
    });

    const setCookie = loginResponse.headers.get('set-cookie');
    const tokenMatch = setCookie?.match(/authToken=([^;]+)/);
    const token = tokenMatch?.[1];

    console.log('Token:', token?.substring(0, 50) + '...\n');

    // Decodifica JWT (sem verificar assinatura)
    const decoded = jwt.decode(token);
    
    console.log('📋 Payload do JWT:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n🔍 Campos importantes:');
    console.log('- userId:', decoded.userId);
    console.log('- nome:', decoded.nome);
    console.log('- email:', decoded.email);
    console.log('- categoria:', decoded.categoria);

    if (!decoded.userId) {
      console.log('\n❌ PROBLEMA: userId está undefined!');
      console.log('Isso vai causar erro no INSERT do chat');
    } else {
      console.log('\n✅ userId presente');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugJWT();
