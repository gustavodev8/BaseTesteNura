// database.js - Suporta SQLite (local) e PostgreSQL (produção)

const Database = require('better-sqlite3');

let db;
let isPostgres = false;

// ===== DETECTAR AMBIENTE =====
if (process.env.DATABASE_URL) {
    // PRODUÇÃO: PostgreSQL no Render
    console.log('🐘 Usando PostgreSQL (Produção)');
    isPostgres = true;
    
    // Importa pg SOMENTE quando necessário
    const { Pool } = require('pg');
    
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    // Testar conexão
    db.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('❌ Erro ao conectar PostgreSQL:', err);
        } else {
            console.log('✅ Conectado ao PostgreSQL!');
        }
    });
    
} else {
    // DESENVOLVIMENTO: SQLite local
    console.log('💾 Usando SQLite (Local)');
    isPostgres = false;
    
    db = new Database('./database/nura.db');
    console.log('✅ Conectado ao SQLite!');
}

// ===== FUNÇÕES UNIVERSAIS =====

async function query(sql, params = []) {
    if (isPostgres) {
        let pgSql = sql;
        params.forEach((_, index) => {
            pgSql = pgSql.replace('?', `$${index + 1}`);
        });
        
        try {
            const result = await db.query(pgSql, params);
            return result.rows;
        } catch (err) {
            console.error('❌ Erro PostgreSQL:', err);
            throw err;
        }
    } else {
        try {
            return db.prepare(sql).all(...params);
        } catch (err) {
            console.error('❌ Erro SQLite:', err);
            throw err;
        }
    }
}

async function get(sql, params = []) {
    if (isPostgres) {
        let pgSql = sql;
        params.forEach((_, index) => {
            pgSql = pgSql.replace('?', `$${index + 1}`);
        });
        
        try {
            const result = await db.query(pgSql, params);
            return result.rows[0] || null;
        } catch (err) {
            console.error('❌ Erro PostgreSQL:', err);
            throw err;
        }
    } else {
        try {
            return db.prepare(sql).get(...params);
        } catch (err) {
            console.error('❌ Erro SQLite:', err);
            throw err;
        }
    }
}

async function run(sql, params = []) {
    if (isPostgres) {
        let pgSql = sql;
        params.forEach((_, index) => {
            pgSql = pgSql.replace('?', `$${index + 1}`);
        });
        
        try {
            const result = await db.query(pgSql, params);
            return {
                lastInsertRowid: result.rows[0]?.id,
                changes: result.rowCount
            };
        } catch (err) {
            console.error('❌ Erro PostgreSQL:', err);
            throw err;
        }
    } else {
        try {
            return db.prepare(sql).run(...params);
        } catch (err) {
            console.error('❌ Erro SQLite:', err);
            throw err;
        }
    }
}

async function exec(sql) {
    if (isPostgres) {
        try {
            await db.query(sql);
        } catch (err) {
            console.error('❌ Erro PostgreSQL:', err);
            throw err;
        }
    } else {
        db.exec(sql);
    }
}

// ===== INICIALIZAR TABELAS =====
async function initializeDatabase() {
    try {
        if (isPostgres) {
            // PostgreSQL
            await exec(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await exec(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Tabelas PostgreSQL criadas!');
            
        } else {
            // SQLite
            exec(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            exec(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Tabelas SQLite criadas!');
        }
        
        // Criar usuário padrão
        const userCount = await get("SELECT COUNT(*) as count FROM users");
        
        if (userCount.count === 0) {
            await run(
                "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
                ['admin', 'admin123', 'admin@nura.ia']
            );
            console.log('✅ Usuário padrão criado: admin/admin123');
        }
        
    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err);
    }
}

function close() {
    if (isPostgres) {
        db.end();
    } else {
        db.close();
    }
}

module.exports = {
    query,
    get,
    run,
    exec,
    initializeDatabase,
    close,
    isPostgres
};