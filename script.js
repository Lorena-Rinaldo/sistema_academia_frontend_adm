/**
 * IRON GYM - GESTÃO ADMINISTRATIVA
 * Autenticação e CRUD integrados à API oficial
 */

const API_BASE_URL = 'https://sistema-academia-backend-hx4f.vercel.app'; 

// Referências do DOM
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const tabelaAlunos = document.getElementById('lista-usuarios');
const modalAluno = document.getElementById('modal-aluno');
const formAluno = modalAluno.querySelector('form');

let alunoEmEdicaoId = null;

// --- 1. LOGIN VIA API ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Captura os dados exatamente como a API pede no seu print
    const payload = {
        usuario: document.getElementById('user').value.trim(),
        senha: document.getElementById('pass').value.trim()
    };

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // Envia "usuario" e "senha"
        });

        if (res.ok) {
            // Login bem-sucedido na API
            sessionStorage.setItem('iron_auth', 'true');
            abrirPainel();
        } else {
            const erro = await res.json();
            alert(erro.message || "Utilizador ou palavra-passe incorretos.");
        }
    } catch (err) {
        alert("Erro ao conectar com o servidor da API.");
        console.error(err);
    }
});

function abrirPainel() {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    carregarAlunos();
}

// --- 2. LISTAGEM (READ) ---
async function carregarAlunos() {
    try {
        const res = await fetch(`${API_BASE_URL}/alunos`);
        // Verifique se a resposta é OK antes de tentar ler o JSON
        if (!res.ok) {
            const errorData = await res.json();
            console.error("Erro ao carregar alunos:", errorData);
            alert("Erro ao carregar alunos: " + (errorData.message || res.statusText));
            return; // Interrompe a execução
        }
        const alunos = await res.json();
        
        tabelaAlunos.innerHTML = '';
        if (alunos.length === 0) {
            tabelaAlunos.innerHTML = `
                <tr>
                    <td colspan="4" class="p-5 text-center text-zinc-500">Nenhum aluno cadastrado ainda.</td>
                </tr>
            `;
            return;
        }

        alunos.forEach(aluno => {
            tabelaAlunos.innerHTML += `
                <tr class="border-b border-zinc-800/50 hover:bg-white/5 transition-all">
                    <td class="p-5 font-bold text-white">${aluno.nome}</td>
                    <td class="p-5 font-mono text-zinc-400">${aluno.cpf}</td>
                    <td class="p-5">
                        <span class="bg-[#c5a059]/10 text-[#c5a059] text-[10px] px-2 py-1 rounded uppercase font-bold">
                            ${aluno.plano || 'Ativo'}
                        </span>
                    </td>
                    <td class="p-5 text-center">
                        <button onclick="editarAluno('${aluno._id}', '${aluno.nome}', '${aluno.cpf}', '${aluno.plano}')" 
                                class="text-blue-400 font-bold text-xs mr-4 cursor-pointer hover:underline">EDITAR</button>
                        <button onclick="deletarAluno('${aluno._id}')" 
                                class="text-red-500 font-bold text-xs cursor-pointer hover:underline">EXCLUIR</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Erro ao listar alunos:", err);
        alert("Erro de conexão ao tentar carregar os alunos.");
    }
}

// --- 3. CRIAR / ATUALIZAR ---
formAluno.onsubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
        nome: document.getElementById('nome-modal').value,
        cpf: document.getElementById('cpf-modal').value.replace(/\D/g, ''), // Envia apenas números
        plano: document.getElementById('plano-modal').value
    };

    const url = alunoEmEdicaoId ? `${API_BASE_URL}/alunos/${alunoEmEdicaoId}` : `${API_BASE_URL}/alunos`;
    const metodo = alunoEmEdicaoId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            fecharModal();
            carregarAlunos();
            alert(`Aluno ${alunoEmEdicaoId ? 'atualizado' : 'cadastrado'} com sucesso!`);
        } else {
            // Tenta obter a mensagem de erro da API
            const errorData = await res.json();
            alert(errorData.message || "Erro na operação. Verifique se os dados estão corretos.");
            console.error("API Error:", errorData); // Log para debugging no console do navegador
        }
    } catch (err) {
        alert("Falha de conexão ao enviar dados do aluno.");
        console.error("Erro de rede:", err); // Log para debugging
    }
};

// --- 4. EXCLUIR ---
window.deletarAluno = async (id) => {
    if (!confirm("Remover este aluno permanentemente?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/alunos/${id}`, { method: 'DELETE' });
        if (res.ok) {
            carregarAlunos();
            alert("Aluno excluído com sucesso!");
        } else {
            const errorData = await res.json();
            alert(errorData.message || "Erro ao excluir o aluno.");
            console.error("API Error:", errorData);
        }
    } catch (err) {
        alert("Erro de conexão ao excluir.");
        console.error("Erro de rede:", err);
    }
};

// Funções de Interface
window.abrirModalCadastro = () => {
    alunoEmEdicaoId = null;
    formAluno.reset();
    document.getElementById('modal-titulo').innerText = "Novo Cadastro"; // Changed to "Novo Cadastro" as in HTML
    modalAluno.classList.remove('hidden'); // Mostra o modal
    // Opcional: Adiciona a classe modal-active para alguma animação/transição
    // modalAluno.classList.add('modal-active'); // Se você tiver transições CSS baseadas nisso
};

window.fecharModal = () => {
    modalAluno.classList.add('hidden'); // Esconde o modal
    // Opcional: Remove a classe modal-active
    // modalAluno.classList.remove('modal-active');
};

window.editarAluno = (id, nome, cpf, plano) => {
    alunoEmEdicaoId = id;
    document.getElementById('modal-titulo').innerText = "Editar Aluno";
    document.getElementById('nome-modal').value = nome;
    document.getElementById('cpf-modal').value = cpf;
    document.getElementById('plano-modal').value = plano;
    modalAluno.classList.remove('hidden'); // Mostra o modal
    // Opcional: Adiciona a classe modal-active
    // modalAluno.classList.add('modal-active');
};

window.logout = () => {
    sessionStorage.clear();
    location.reload();
};

// Manter logado ao atualizar a página
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('iron_auth')) {
        abrirPainel();
    }
});