// Debug utilities for troubleshooting network and authentication issues

export function debugApiConnection() {
  if (typeof window === 'undefined') {
    console.log('🔧 Debug: Running on server side');
    return;
  }

  console.log('🔧 API Connection Debug Info:');
  console.log('📍 Current URL:', window.location.href);
  console.log('🌐 Hostname:', window.location.hostname);
  console.log('🔌 Protocol:', window.location.protocol);
  console.log('🚪 Port:', window.location.port || 'default');
  
  // Get API URL
  function getApiUrl(): string {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:9002`;
    }
    
    return 'http://localhost:9002';
  }
  
  const apiUrl = getApiUrl();
  console.log('🎯 API Base URL:', apiUrl);
  
  // Check token
  const token = localStorage.getItem('timewise-auth-token');
  console.log('🔑 Auth Token:', token ? 'Present' : 'Missing');
  
  // Test API connectivity
  const testUrl = `${apiUrl}/api/auth/me`;
  console.log('🧪 Testing API connectivity to:', testUrl);
  
  fetch(testUrl, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('✅ API Response Status:', response.status);
    console.log('📝 Response OK:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('📄 API Response Data:', data);
  })
  .catch(error => {
    console.error('❌ API Connection Failed:', error.message);
    console.log('💡 Possible issues:');
    console.log('   - Server not running on port 9002');
    console.log('   - Firewall blocking connection');
    console.log('   - Wrong IP address configuration');
    console.log('   - Network connectivity issues');
  });
}

// Test login connectivity
export async function testLogin(username: string, password: string) {
  if (typeof window === 'undefined') {
    console.log('🔧 Test Login: Running on server side');
    return;
  }

  console.log('🔒 Testing Login Process...');
  
  function getApiUrl(): string {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:9002`;
    }
    
    return 'http://localhost:9002';
  }
  
  const apiUrl = getApiUrl();
  const loginUrl = `${apiUrl}/api/auth/login`;
  
  console.log('🎯 Login URL:', loginUrl);
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('📊 Login Response Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    
    const data = await response.json();
    console.log('📄 Login Response Data:', data);
    
    if (data.success && data.token) {
      console.log('🎉 Login Successful!');
      console.log('🔑 Token received');
      localStorage.setItem('timewise-auth-token', data.token);
    } else {
      console.log('❌ Login Failed:', data.message);
    }
    
    return data;
  } catch (error: any) {
    console.error('💥 Login Error:', error.message);
    console.log('💡 Check:');
    console.log('   - Server is running');
    console.log('   - Network connectivity');
    console.log('   - Credentials are correct');
    throw error;
  }
}