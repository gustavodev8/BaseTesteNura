/* ========================================
   SISTEMA DE LOGIN - Nura.ia
   Arquivo: login.js
   ⚠️ APENAS BACKEND - SEM MUDANÇAS NO HTML
   ======================================== */

const API_URL = 'https://basetestenura-3.onrender.com';
// ===== FUNÇÃO DE LOGIN =====
async function login(event) {
    if (event) event.preventDefault(); // Previne o recarregamento da página
    
    const email = document.getElementById('iusuario').value.trim();
    const password = document.getElementById('isenha').value;
    const messageDiv = document.getElementById('login-message');
    const submitButton = document.getElementById('ienviar');

    // Validações básicas
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos!', 'error');
        return;
    }

    // Desabilitar botão durante o login
    submitButton.disabled = true;
    const originalValue = submitButton.value;
    submitButton.value = 'Entrando...';
    
    try {
        console.log('🔐 Tentando login...');
        
        // ✅ ROTA CORRIGIDA: /api/login
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username: email,  // O servidor espera "username"
                password: password 
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Login bem-sucedido!');
            
            // Salvar dados do usuário no localStorage
            localStorage.setItem('nura_user', JSON.stringify(data.user));
            localStorage.setItem('nura_logged_in', 'true');
            
            showMessage('Login realizado com sucesso! Redirecionando...', 'success');
            
            // Redirecionar para a tela inicial
            setTimeout(() => {
                window.location.href = '/inicial';
            }, 1000);
            
        } else {
            console.error('❌ Erro no login:', data.error);
            showMessage(data.error || 'Usuário ou senha incorretos', 'error');
            submitButton.disabled = false;
            submitButton.value = originalValue;
        }
        
    } catch (error) {
        console.error('💥 Erro de conexão:', error);
        showMessage('Erro de conexão com o servidor', 'error');
        submitButton.disabled = false;
        submitButton.value = originalValue;
    }
}

// ===== MOSTRAR MENSAGEM =====
function showMessage(message, type) {
    const messageDiv = document.getElementById('login-message');
    
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#4CAF50';
        messageDiv.style.color = 'white';
    } else {
        messageDiv.style.backgroundColor = '#f44336';
        messageDiv.style.color = 'white';
    }
    
    // Esconder mensagem após 5 segundos
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// ===== VERIFICAR SE JÁ ESTÁ LOGADO =====
function checkIfAlreadyLoggedIn() {
    const isLoggedIn = localStorage.getItem('nura_logged_in');
    const userData = localStorage.getItem('nura_user');
    
    if (isLoggedIn === 'true' && userData) {
        console.log('✅ Usuário já está logado, redirecionando...');
        window.location.href = 'Tela_Inicial.html';
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de login inicializado');
    
    // Verificar se já está logado
    checkIfAlreadyLoggedIn();
    
    // Adicionar event listener ao formulário
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
        console.log('✅ Event listener adicionado ao formulário');
    } else {
        console.error('❌ Formulário de login não encontrado!');
    }
    
    // Enter na senha para fazer login
    const passwordInput = document.getElementById('isenha');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                login(e);
            }
        });
    }
});

console.log('✅ login.js carregado!');