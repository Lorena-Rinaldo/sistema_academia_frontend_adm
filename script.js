/**
 * IRON GYM - GESTÃO ADMINISTRATIVA
 * SCRIPT HOMOLOGADO COM A API (Vercel)
 */

const API_BASE_URL = 'https://sistema-academia-backend-hx4f.vercel.app'; 

// Referências do DOM
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const tabelaAlunos = document.getElementById('lista-usuarios');
const modalAluno = document.getElementById('modal-aluno');
const formAluno = document.getElementById('form-aluno-modal');

let alunoEmEdicaoId = null;

/**
 * Retorna os headers necessários para rotas protegidas
 */
function getAuthHeaders() {
    const token = sessionStorage.getItem('iron_jwt_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- 1. AUTENTICAÇÃO (LOGIN) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button');
    const originalText = btn.innerText;

    // A API espera 'usuario' e 'senha' conforme seu código anterior
    const payload = {
        usuario: document.getElementById('user').value.trim(),
        senha: document.getElementById('pass').value.trim()
    };

    try {
        btn.innerText = "AUTENTICANDO...";
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            // Salva o token e o estado de autenticação
            sessionStorage.setItem('iron_jwt_token', data.token);
            sessionStorage.setItem('iron_auth', 'true');
            abrirPainel();
        } else {
            alert("Falha no login: Verifique suas credenciais.");
        }
    } catch (err) {
        console.error("Erro de login:", err);
        alert("Erro ao conectar com o servidor.");
    } finally {
        btn.innerText = originalText;
    }
});

// --- 2. LISTAGEM (READ) ---
async function carregarAlunos() {
    tabelaAlunos.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-zinc-500 italic">Atualizando lista...</td></tr>';

    try {
        const res = await fetch(`${API_BASE_URL}/alunos`, { 
            headers: getAuthHeaders() 
        });

        if (!res.ok) throw new Error("Erro na requisição");

        const alunos = await res.json();
        tabelaAlunos.innerHTML = '';

        if (alunos.length === 0) {
            tabelaAlunos.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-zinc-500">Nenhum aluno cadastrado.</td></tr>';
            return;
        }

        alunos.forEach(aluno => {
            // MongoDB usa _id. Garantimos a captura correta para as funções de Editar/Excluir
            const id = aluno._id || aluno.id;
            
            tabelaAlunos.innerHTML += `
                <tr class="border-b border-zinc-800/50 hover:bg-white/5 transition-all">
                    <td class="p-5 font-bold text-white">${aluno.nome}</td>
                    <td class="p-5 font-mono text-zinc-400">${aluno.cpf}</td>
                    <td class="p-5">
                        <span class="bg-[#c5a059]/10 text-[#c5a059] text-[10px] px-2 py-1 rounded uppercase font-bold">${aluno.plano}</span>
                    </td>
                    <td class="p-5 text-center">
                        <button onclick="editarAluno('${id}', '${aluno.nome}', '${aluno.cpf}', '${aluno.plano}')" 
                                class="text-blue-400 font-bold text-xs mr-4 hover:underline cursor-pointer">EDITAR</button>
                        <button onclick="deletarAluno('${id}')" 
                                class="text-red-500 font-bold text-xs hover:underline cursor-pointer">EXCLUIR</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Erro ao listar:", err);
        tabelaAlunos.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-red-500">Erro ao carregar dados da API.</td></tr>';
    }
}

// --- 3. SALVAR (CREATE & UPDATE) ---
formAluno.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formAluno.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    const payload = {
        nome: document.getElementById('nome-modal').value.trim(),
        cpf: document.getElementById('cpf-modal').value.trim(),
        plano: document.getElementById('plano-modal').value
    };

    // Define se vai para /alunos (POST) ou /alunos/ID (PUT)
    const url = alunoEmEdicaoId ? `${API_BASE_URL}/alunos/${alunoEmEdicaoId}` : `${API_BASE_URL}/alunos`;
    const metodo = alunoEmEdicaoId ? 'PUT' : 'POST';

    try {
        btn.innerText = "PROCESSANDO...";
        const res = await fetch(url, {
            method: metodo,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            fecharModal();
            carregarAlunos(); // Atualiza a tabela
        } else {
            const errorData = await res.json();
            alert("Erro: " + (errorData.message || "Não foi possível realizar a operação."));
        }
    } catch (err) {
        console.error("Erro ao salvar:", err);
        alert("Erro de conexão com a API.");
    } finally {
        btn.innerText = originalText;
    }
});

// --- 4. EXCLUIR (DELETE) ---
window.deletarAluno = async (id) => {
    if (!confirm("Deseja realmente remover este registro permanentemente?")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/alunos/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            carregarAlunos();
        } else {
            alert("Erro ao excluir aluno no servidor.");
        }
    } catch (err) {
        console.error("Erro ao deletar:", err);
        alert("Erro de conexão.");
    }
};

// --- CONTROLE DE INTERFACE ---

window.abrirModalCadastro = () => {
    alunoEmEdicaoId = null; // Reseta o ID de edição
    formAluno.reset();
    document.getElementById('modal-titulo').innerText = "Novo Cadastro";
    
    modalAluno.classList.remove('hidden');
    setTimeout(() => modalAluno.classList.add('modal-active'), 10);
};

window.editarAluno = (id, nome, cpf, plano) => {
    alunoEmEdicaoId = id; // Define qual ID será editado
    document.getElementById('modal-titulo').innerText = "Editar Aluno";
    
    // Preenche os campos do modal
    document.getElementById('nome-modal').value = nome;
    document.getElementById('cpf-modal').value = cpf;
    document.getElementById('plano-modal').value = plano;
    
    modalAluno.classList.remove('hidden');
    setTimeout(() => modalAluno.classList.add('modal-active'), 10);
};

window.fecharModal = () => {
    modalAluno.classList.remove('modal-active');
    setTimeout(() => modalAluno.classList.add('hidden'), 300);
};

window.logout = () => {
    sessionStorage.clear();
    location.reload();
};

function abrirPainel() {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    carregarAlunos();
}

// Verifica se já existe uma sessão ativa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('iron_auth') && sessionStorage.getItem('iron_jwt_token')) {
        abrirPainel();
    }
});