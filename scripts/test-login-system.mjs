// ... existing code ...
// removed: import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env.local
const envPath = resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const BASE_URL = 'http://localhost:3003';

async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    console.log('[DEBUG] Server check response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    return true;
  } catch (error) {
    console.error('[DEBUG] Server check failed:', error.message);
    return false;
  }
}

async function login(cpf, isAdmin = false) {
  const endpoint = isAdmin ? '/api/auth/login/admin' : '/api/auth/login/user';
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    console.log(`[DEBUG] Tentando login ${isAdmin ? 'admin' : 'usuário'} com CPF:`, cpf);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf }),
    });

    console.log('[DEBUG] Login response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    const text = await response.text();
    console.log('[DEBUG] Response text:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log('[DEBUG] Failed to parse response as JSON');
      return { success: false, error: 'Invalid JSON response' };
    }

    // Verifica se há cookies de autenticação
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log('[DEBUG] Authentication cookies:', cookies);
    } else {
      console.log('[DEBUG] No authentication cookies set');
    }

    // Extrai o par de cookie (ex: "authToken=...") para reutilizar em chamadas subsequentes
    let cookiePair = null;
    if (cookies) {
      cookiePair = cookies.split(';')[0];
    }

    return {
      success: response.ok,
      ...data,
      status: response.status,
      cookies,
      cookiePair
    };
  } catch (error) {
    console.error('[DEBUG] Login request failed:', error);
    return { success: false, error: error.message };
  }
}

async function logout() {
  const url = `${BASE_URL}/api/auth/logout`;
  
  try {
    console.log('[DEBUG] Tentando logout');
    
    const response = await fetch(url, {
      method: 'POST',
    });

    console.log('[DEBUG] Logout response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    return {
      success: response.ok,
      status: response.status
    };
  } catch (error) {
    console.error('[DEBUG] Logout request failed:', error);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('Iniciando testes do sistema de login...\n');

  // Verifica se o servidor está rodando
  console.log('Verificando se o servidor está rodando...');
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Servidor não está respondendo. Certifique-se que o servidor está rodando na porta 3003.');
    return;
  }
  console.log('✓ Servidor está rodando\n');

  // Teste de login de usuário comum
  console.log('Testando login de usuário comum...');
  const userResult = await login('12345678900');
  console.log('Resultado:', userResult);
  if (userResult.success) {
    console.log('✓ Login de usuário comum bem sucedido');
  } else {
    console.log('❌ Falha no login de usuário comum:', userResult.error);
  }
  console.log();

  // Teste de login de administrador
  console.log('Testando login de administrador...');
  const adminResult = await login('12345678901', true);
  console.log('Resultado:', adminResult);
  if (adminResult.success) {
    console.log('✓ Login de administrador bem sucedido');

    if (adminResult.cookiePair) {
      // Heartbeat
      const hb = await heartbeat(adminResult.cookiePair);
      if (hb.success) {
        console.log('✓ Heartbeat retornou 200');
      } else {
        console.log('❌ Heartbeat falhou:', hb.error || hb.status);
      }

      // Admin Links
      const links = await fetchAdminLinks(adminResult.cookiePair);
      if (links.success) {
        console.log('✓ /api/admin/links retornou 200');
      } else {
        console.log('❌ /api/admin/links falhou:', links.error || links.status);
      }
    } else {
      console.log('❌ Cookie de autenticação não capturado para chamadas subsequentes');
    }
  } else {
    console.log('❌ Falha no login de administrador:', adminResult.error);
  }
  console.log();

  // Teste de logout
  if (userResult.success || adminResult.success) {
    console.log('Testando logout...');
    const logoutResult = await logout();
    console.log('Resultado:', logoutResult);
    if (logoutResult.success) {
      console.log('✓ Logout bem sucedido');
    } else {
      console.log('❌ Falha no logout:', logoutResult.error);
    }
  }
}

runTests().catch(console.error);

async function heartbeat(cookiePair) {
  const url = `${BASE_URL}/api/auth/heartbeat`;
  try {
    console.log('[DEBUG] Chamando heartbeat com cookie');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Cookie': cookiePair,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userAgent: 'TraeTestScript' })
    });
    const text = await response.text();
    console.log('[DEBUG] Heartbeat response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    console.log('[DEBUG] Heartbeat body:', text);
    return { success: response.ok, status: response.status, body: text };
  } catch (error) {
    console.error('[DEBUG] Heartbeat request failed:', error);
    return { success: false, error: error.message };
  }
}

async function fetchAdminLinks(cookiePair) {
  const url = `${BASE_URL}/api/admin/links`;
  try {
    console.log('[DEBUG] Chamando /api/admin/links com cookie');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': cookiePair
      }
    });
    const text = await response.text();
    console.log('[DEBUG] Admin links response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    console.log('[DEBUG] Admin links body (truncated):', text.slice(0, 300));
    return { success: response.ok, status: response.status, body: text };
  } catch (error) {
    console.error('[DEBUG] Admin links request failed:', error);
    return { success: false, error: error.message };
  }
}