const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin', 
    database: 'zeladoria_tcc' 
};

let pool;

async function iniciarBanco() {
    try {
        const conexaoInicial = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await conexaoInicial.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await conexaoInicial.end();

        pool = mysql.createPool(dbConfig);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ocorrencias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                categoria VARCHAR(100) NOT NULL,
                descricao TEXT NOT NULL,
                latitude VARCHAR(50) NOT NULL,
                longitude VARCHAR(50) NOT NULL,
                dataCriacao VARCHAR(20) NOT NULL,
                status VARCHAR(50) DEFAULT 'Pendente'
            )
        `);
        console.log('📦 Conectado ao MySQL e tabela verificada com sucesso!');
    } catch (erro) {
        console.error('❌ Erro fatal ao conectar no MySQL:', erro.message);
    }
}

iniciarBanco();

app.get('/api/relatos', async (req, res) => {
    console.log('🔄 Angular solicitou a listagem de relatos.');
    try {
        const [linhas] = await pool.query('SELECT * FROM ocorrencias ORDER BY id DESC');
        res.json(linhas);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar dados no banco.' });
    }
});

app.post('/api/relatos', async (req, res) => {
    const { categoria, descricao, latitude, longitude } = req.body;
    const dataCriacao = new Date().toLocaleDateString('pt-BR');

    try {
        const query = 'INSERT INTO ocorrencias (categoria, descricao, latitude, longitude, dataCriacao, status) VALUES (?, ?, ?, ?, ?, ?)';
        const [resultado] = await pool.query(query, [categoria, descricao, latitude, longitude, dataCriacao, 'Pendente']);
        
        const novoRelato = {
            id: resultado.insertId,
            categoria,
            descricao,
            latitude,
            longitude,
            dataCriacao,
            status: 'Pendente'
        };

        console.log('✅ Novo relato salvo no MySQL:', novoRelato);
        res.status(201).json(novoRelato);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar no banco de dados.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Zeladoria Urbana rodando em: http://localhost:${PORT}`);
});