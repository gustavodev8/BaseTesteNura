const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Testando conexão PostgreSQL...');
console.log('📝 URL (parcial):', process.env.DATABASE_URL?.substring(0, 30) + '...');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
});

async function test() {
    try {
        console.log('⏳ Conectando...');
        
        const result = await pool.query('SELECT NOW() as now, version() as version');
        
        console.log('✅ CONEXÃO BEM-SUCEDIDA!');
        console.log('⏰ Hora do servidor:', result.rows[0].now);
        console.log('📦 Versão PostgreSQL:', result.rows[0].version);
        
        // Testar se as tabelas existem
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('\n📊 Tabelas encontradas:');
        if (tables.rows.length === 0) {
            console.log('   (nenhuma tabela - banco vazio)');
        } else {
            tables.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        }
        
        await pool.end();
        process.exit(0);
        
    } catch (err) {
        console.error('❌ ERRO DE CONEXÃO:');
        console.error('Código:', err.code);
        console.error('Mensagem:', err.message);
        console.error('\n💡 Verificações:');
        console.error('   1. A External Database URL está completa?');
        console.error('   2. Tem .oregon-postgres.render.com (ou similar)?');
        console.error('   3. Tem :5432 no final?');
        console.error('   4. A senha está correta?');
        console.error('   5. O banco está ativo no Render?');
        
        await pool.end();
        process.exit(1);
    }
}

test();