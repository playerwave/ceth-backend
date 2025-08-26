const axios = require('axios');

async function debugUsers() {
  try {
    console.log('🔍 Checking backend API...');
    
    // ตรวจสอบ roles
    console.log('\n📋 Roles from API:');
    const rolesResponse = await axios.get('http://localhost:5090/api/role/get-roles');
    console.table(rolesResponse.data);
    
    // ตรวจสอบ users
    console.log('\n👥 Users from API:');
    const usersResponse = await axios.get('http://localhost:5090/api/teacher/user/get-users');
    console.table(usersResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server might not be running. Please start it with:');
      console.log('   npm run dev');
    }
  }
}

debugUsers();
