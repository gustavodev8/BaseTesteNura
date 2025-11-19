const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

let pool;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
    console.log('🐘 Conectando ao PostgreSQL...');
    
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // ⚠️ IMPORTANTE para Render/Supabase
        },
        connectionTimeoutMillis: 10000, // 10 segundos
        idleTimeoutMillis: 30000,
        max: 10 // máximo de conexões
    });

    // Testar conexão
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('❌ Erro ao conectar PostgreSQL:', err.message);
        } else {
            console.log('✅ PostgreSQL conectado com sucesso!');
        }
    });
}

// Função para queries
async function query(sql, params = []) {
    if (!isPostgres) {
        throw new Error('PostgreSQL não configurado');
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    } finally {
        client.release();
    }
}

// Função para buscar um registro
async function get(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

// Função para executar comandos
async function run(sql, params = []) {
    const result = await pool.query(sql, params);
    return { changes: result.rowCount };
}

// Inicializar banco (criar tabelas se não existirem)
async function initializeDatabase() {
    if (!isPostgres) {
        console.log('⚠️ PostgreSQL não configurado, pulando inicialização');
        return;
    }

    try {
        console.log('🔧 Inicializando banco de dados...');

        // Criar tabela users
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Criar tabela tasks
        await query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                priority VARCHAR(20) DEFAULT 'low',
                due_date DATE,
                responsible VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Criar índices
        await query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);

        // Inserir usuários padrão se não existirem
        const userCount = await get('SELECT COUNT(*) as count FROM users');
        
        if (userCount.count === 0) {
            console.log('📝 Inserindo usuários padrão...');
            await query(`
                INSERT INTO users (name, email, password) VALUES
                ('Administrador', 'admin@nura.ia', 'admin123'),
                ('Usuario Teste', 'teste@nura.ia', 'teste123'),
                ('Pichau', 'pichau@nura.ia', 'nura123')
            `);
            console.log('✅ Usuários criados!');
        }

        console.log('✅ Banco de dados inicializado com sucesso!');
        
    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err.message);
        throw err;
    }
}

// Fechar conexão
function close() {
    if (pool) {
        pool.end();
        console.log('✅ Pool PostgreSQL fechado');
    }
}

module.exports = {
    query,
    get,
    run,
    initializeDatabase,
    close,
    isPostgres
};