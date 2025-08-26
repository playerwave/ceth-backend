const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_HOST?.includes('render.com') ? {
    rejectUnauthorized: false,
  } : false,
});

async function debugUsers() {
  try {
    console.log('🔍 Checking database connection...');
    const client = await pool.connect();
    
    console.log('✅ Connected to database');
    
    // ตรวจสอบ roles
    console.log('\n📋 Roles in database:');
    const rolesResult = await client.query('SELECT * FROM roles ORDER BY roles_id');
    console.table(rolesResult.rows);
    
    // ตรวจสอบ users ที่มี username "teacher"
    console.log('\n👤 Users with username "teacher":');
    const teacherResult = await client.query(`
      SELECT 
        u.users_id,
        u.username,
        u.roles_id,
        r.roles_name,
        r.roles_id as role_table_id
      FROM users u
      LEFT JOIN roles r ON u.roles_id = r.roles_id
      WHERE u.username = 'teacher'
    `);
    console.table(teacherResult.rows);
    
    // ตรวจสอบ users ทั้งหมด
    console.log('\n👥 All users:');
    const allUsersResult = await client.query(`
      SELECT 
        u.users_id,
        u.username,
        u.roles_id,
        r.roles_name
      FROM users u
      LEFT JOIN roles r ON u.roles_id = r.roles_id
      ORDER BY u.users_id
    `);
    console.table(allUsersResult.rows);
    
    // ตรวจสอบ teacher table
    console.log('\n👨‍🏫 Teacher table:');
    const teacherTableResult = await client.query('SELECT * FROM teacher');
    console.table(teacherTableResult.rows);
    
    // ตรวจสอบ student table
    console.log('\n👨‍🎓 Student table:');
    const studentTableResult = await client.query('SELECT * FROM students');
    console.table(studentTableResult.rows);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugUsers();
