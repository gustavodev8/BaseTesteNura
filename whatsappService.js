// ==========================================
// SERVIÇO DE WHATSAPP - NURA
// Biblioteca: @wppconnect-team/wppconnect
// ==========================================

const wppconnect = require('@wppconnect/wppconnect');
const db = require('./database');

let client = null;
let isConnected = false;

// ===== INICIALIZAR WHATSAPP =====
async function iniciarWhatsApp() {
    try {
        console.log('📱 Iniciando WhatsApp...');
        
        client = await wppconnect.create({
            session: 'nura-session',
            catchQR: (base64Qr, asciiQR) => {
                // Mostrar QR Code no terminal
                console.log('\n📱 ===== ESCANEIE O QR CODE =====');
                console.log(asciiQR);
                console.log('================================\n');
                
                // Você também pode salvar o QR em imagem
                // const fs = require('fs');
                // const qrImage = base64Qr.replace('data:image/png;base64,', '');
                // fs.writeFileSync('./qrcode.png', qrImage, 'base64');
                // console.log('💾 QR Code salvo em: qrcode.png');
            },
            statusFind: (statusSession, session) => {
                console.log('📱 Status:', statusSession);
                if (statusSession === 'isLogged') {
                    isConnected = true;
                    console.log('✅ WhatsApp conectado com sucesso!');
                }
            },
            headless: true, // Rodar sem interface gráfica
            devtools: false,
            useChrome: true,
            debug: false,
            logQR: true
        });
        
        console.log('✅ WhatsApp inicializado!');
        
        // Listener para quando desconectar
        client.onStateChange((state) => {
            console.log('📱 Estado mudou:', state);
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
                console.log('⚠️ WhatsApp desconectado! Precisa reconectar.');
                isConnected = false;
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar WhatsApp:', error);
        isConnected = false;
    }
}

// ===== VERIFICAR SE ESTÁ CONECTADO =====
function estaConectado() {
    return isConnected && client !== null;
}

// ===== FORMATAR NÚMERO DE TELEFONE =====
function formatarNumero(numero) {
    // Remove tudo que não é número
    let numeroLimpo = numero.replace(/\D/g, '');
    
    // Se não tem código do país, adiciona 55 (Brasil)
    if (!numeroLimpo.startsWith('55') && numeroLimpo.length === 11) {
        numeroLimpo = '55' + numeroLimpo;
    }
    
    // Adiciona @c.us no final (formato WhatsApp)
    return numeroLimpo + '@c.us';
}

// ===== ENVIAR MENSAGEM =====
async function enviarMensagem(numero, mensagem) {
    if (!estaConectado()) {
        throw new Error('WhatsApp não está conectado! Escaneie o QR Code primeiro.');
    }
    
    try {
        const numeroFormatado = formatarNumero(numero);
        
        console.log(`📤 Enviando mensagem para ${numeroFormatado}...`);
        
        await client.sendText(numeroFormatado, mensagem);
        
        console.log('✅ Mensagem enviada com sucesso!');
        return { success: true, message: 'Mensagem enviada!' };
        
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        throw error;
    }
}

// ===== BUSCAR TAREFAS PENDENTES DO USUÁRIO =====
async function buscarTarefasPendentes(userId) {
    try {
        const tarefas = await db.query(
            `SELECT * FROM tasks 
             WHERE user_id = ? 
             AND status != 'completed' 
             ORDER BY priority DESC, created_at ASC`,
            [userId]
        );
        
        return tarefas;
    } catch (error) {
        console.error('❌ Erro ao buscar tarefas:', error);
        return [];
    }
}

// ===== FORMATAR MENSAGEM DE RESUMO =====
function formatarMensagemResumo(userName, tarefas) {
    const totalPendentes = tarefas.filter(t => t.status === 'pending').length;
    const totalEmAndamento = tarefas.filter(t => t.status === 'in_progress').length;
    
    // Emojis por prioridade
    const prioridades = {
        'high': '🔴',
        'medium': '🟡',
        'low': '🟢'
    };
    
    // Emojis por status
    const status = {
        'pending': '⏸️',
        'in_progress': '⏳'
    };
    
    let mensagem = `📋 *Bom dia, ${userName}!*\n\n`;
    
    if (tarefas.length === 0) {
        mensagem += `🎉 *Parabéns!* Você não tem tarefas pendentes!\n\n`;
        mensagem += `Aproveite seu dia! ☀️`;
        return mensagem;
    }
    
    mensagem += `Você tem *${tarefas.length} tarefa${tarefas.length > 1 ? 's' : ''} pendente${tarefas.length > 1 ? 's' : ''}*:\n\n`;
    
    // Listar tarefas (máximo 10 para não ficar muito grande)
    const tarefasExibir = tarefas.slice(0, 10);
    
    tarefasExibir.forEach((tarefa, index) => {
        const emoji = prioridades[tarefa.priority] || '⚪';
        const statusEmoji = status[tarefa.status] || '❓';
        mensagem += `${statusEmoji} ${emoji} ${tarefa.title}\n`;
    });
    
    if (tarefas.length > 10) {
        mensagem += `\n... e mais ${tarefas.length - 10} tarefa${tarefas.length - 10 > 1 ? 's' : ''}.\n`;
    }
    
    mensagem += `\n---\n`;
    mensagem += `⏸️ *${totalPendentes}* pendente${totalPendentes !== 1 ? 's' : ''}\n`;
    mensagem += `⏳ *${totalEmAndamento}* em andamento\n`;
    mensagem += `\n💡 *Acesse:* https://basetestenura-3.onrender.com`;
    
    return mensagem;
}

// ===== ENVIAR RESUMO DIÁRIO PARA UM USUÁRIO =====
async function enviarResumoDiarioWhatsApp(userId, whatsappNumber, userName) {
    try {
        if (!estaConectado()) {
            console.log('⚠️ WhatsApp não conectado. Pulando envio para', userName);
            return { success: false, error: 'WhatsApp não conectado' };
        }
        
        console.log(`📱 Enviando resumo para ${userName} (${whatsappNumber})...`);
        
        // Buscar tarefas pendentes
        const tarefas = await buscarTarefasPendentes(userId);
        
        // Formatar mensagem
        const mensagem = formatarMensagemResumo(userName, tarefas);
        
        // Enviar mensagem
        await enviarMensagem(whatsappNumber, mensagem);
        
        console.log(`✅ Resumo enviado para ${userName}`);
        
        return {
            success: true,
            tarefasEnviadas: tarefas.length,
            numeroDestino: whatsappNumber
        };
        
    } catch (error) {
        console.error(`❌ Erro ao enviar resumo para ${userName}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== ENVIAR RESUMO PARA TODOS OS USUÁRIOS COM WHATSAPP ATIVO =====
async function enviarResumoParaTodosWhatsApp() {
    try {
        console.log('\n📱 ========================================');
        console.log('📱 Iniciando envio de resumos por WhatsApp');
        console.log('📱 ========================================\n');
        
        if (!estaConectado()) {
            console.log('⚠️ WhatsApp não está conectado! Nenhuma mensagem enviada.');
            return {
                success: false,
                error: 'WhatsApp não conectado',
                enviados: 0
            };
        }
        
        // Buscar usuários com WhatsApp ativo
        const usuarios = await db.query(
            `SELECT u.id, u.name, s.whatsapp_number 
             FROM users u
             INNER JOIN user_settings s ON u.id = s.user_id
             WHERE s.whatsapp_notifications = 1 
             AND s.whatsapp_number IS NOT NULL 
             AND s.whatsapp_number != ''`
        );
        
        console.log(`📋 ${usuarios.length} usuário(s) com WhatsApp ativo`);
        
        let enviados = 0;
        let erros = 0;
        
        for (const usuario of usuarios) {
            try {
                const resultado = await enviarResumoDiarioWhatsApp(
                    usuario.id,
                    usuario.whatsapp_number,
                    usuario.name
                );
                
                if (resultado.success) {
                    enviados++;
                } else {
                    erros++;
                }
                
                // Aguardar 2 segundos entre mensagens (evitar spam/ban)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Erro com usuário ${usuario.name}:`, error);
                erros++;
            }
        }
        
        console.log('\n📱 ========================================');
        console.log(`✅ Enviados: ${enviados}`);
        console.log(`❌ Erros: ${erros}`);
        console.log('📱 ========================================\n');
        
        return {
            success: true,
            totalUsuarios: usuarios.length,
            enviados,
            erros
        };
        
    } catch (error) {
        console.error('❌ Erro ao enviar resumos:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== OBTER STATUS DA CONEXÃO =====
function obterStatus() {
    return {
        conectado: estaConectado(),
        cliente: client !== null
    };
}

// ===== DESCONECTAR WHATSAPP =====
async function desconectar() {
    try {
        if (client) {
            await client.close();
            console.log('📱 WhatsApp desconectado');
        }
        client = null;
        isConnected = false;
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
    }
}

// ===== EXPORTAR FUNÇÕES =====
module.exports = {
    iniciarWhatsApp,
    enviarMensagem,
    enviarResumoDiarioWhatsApp,
    enviarResumoParaTodosWhatsApp,
    estaConectado,
    obterStatus,
    desconectar
};
