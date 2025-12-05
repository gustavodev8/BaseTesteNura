// ===== TESTE DE ENVIO DE EMAIL =====
// Execute: node test-email.js

require('dotenv').config();

console.log('\n📧 ========================================');
console.log('📧 TESTE DE CONFIGURAÇÃO DE EMAIL');
console.log('📧 ========================================\n');

// Verificar variáveis de ambiente
console.log('🔍 Verificando configuração...\n');

const hasApiKey = !!process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'SUA_CHAVE_SENDGRID_AQUI';
const hasFromEmail = !!process.env.SENDGRID_FROM_EMAIL;

console.log('SENDGRID_API_KEY:', hasApiKey ? '✅ Configurada' : '❌ NÃO CONFIGURADA');
console.log('SENDGRID_FROM_EMAIL:', hasFromEmail ? `✅ ${process.env.SENDGRID_FROM_EMAIL}` : '❌ NÃO CONFIGURADO');

if (!hasApiKey || !hasFromEmail) {
    console.log('\n❌ CONFIGURAÇÃO INCOMPLETA!\n');
    console.log('📝 Siga os passos:\n');
    console.log('1. Crie conta no SendGrid: https://signup.sendgrid.com/');
    console.log('2. Vá em Settings > API Keys > Create API Key');
    console.log('3. Copie a chave e cole no arquivo .env em SENDGRID_API_KEY');
    console.log('4. Configure o email remetente em SENDGRID_FROM_EMAIL');
    console.log('5. Execute novamente: node test-email.js\n');
    process.exit(1);
}

console.log('\n✅ Configuração OK! Testando envio...\n');

// Testar envio
const { enviarEmail } = require('./emailService');

const emailTeste = process.argv[2] || 'seu-email@gmail.com';

console.log(`📧 Enviando email de teste para: ${emailTeste}\n`);

enviarEmail(
    emailTeste,
    '🧪 Teste - Sistema NURA',
    `
🎉 Parabéns! O sistema de emails está configurado corretamente!

Este é um email de teste enviado pelo sistema NURA.

Se você recebeu este email, significa que:
✅ SendGrid está configurado
✅ API Key está válida
✅ Email remetente está verificado
✅ Sistema pronto para enviar relatórios semanais

---
NURA - Seu assistente de produtividade
    `.trim()
)
.then(result => {
    if (result.success) {
        console.log('✅ ========================================');
        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log('✅ ========================================\n');
        console.log(`📧 Verifique a caixa de entrada de: ${emailTeste}`);
        console.log('📧 Se não aparecer, verifique SPAM/Lixo Eletrônico\n');
    } else {
        console.log('❌ ========================================');
        console.log('❌ ERRO AO ENVIAR EMAIL');
        console.log('❌ ========================================\n');
        console.log('Erro:', result.error);
        console.log('\n💡 Possíveis soluções:\n');
        console.log('1. Verifique se a API Key está correta');
        console.log('2. Verifique se o email remetente foi verificado no SendGrid');
        console.log('3. Verifique Settings > Sender Authentication no SendGrid\n');
    }
})
.catch(error => {
    console.error('❌ Erro fatal:', error);
});
