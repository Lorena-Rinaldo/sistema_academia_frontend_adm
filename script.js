/**
 * IRON GYM - SISTEMA ADMINISTRATIVO
 * Versão: CPF Limpo no Banco / Mascarado na UI
 */

const CONFIG = {
    API_URL: 'https://sistema-academia-backend-hx4f.vercel.app',
    TOKEN_KEY: 'iron_jwt_token',
    AUTH_KEY: 'iron_auth'
};

const STATE = {
    activeStudentCpf: null, // Sempre armazenará o CPF sem pontos/traços
    isEditing: () => !!STATE.activeStudentCpf
};

const DOM = {
    loginSection: document.getElementById('login-section'),
    adminSection: document.getElementById('admin-panel'),
    loginForm: document.getElementById('login-form'),
    studentTable: document.getElementById('lista-usuarios'),
    studentModal: document.getElementById('modal-aluno'),
    studentForm: document.getElementById('form-aluno-modal'),
    modalTitle: document.getElementById('modal-titulo'),
    inputs: {
        nome: document.getElementById('nome-modal'),
        cpf: document.getElementById('cpf-modal'),
        status: document.getElementById('plano-modal')
    }
};

// --- UTILITÁRIOS ---
const formatters = {
    // Transforma números em 000.000.000-00
    toCpfMask(value) {
        return value.replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    },
    // Remove tudo que não for número (limpa para o banco)
    stripNonDigits(value) {
        return value.replace(/\D/g, "");
    }
};

// --- SERVIÇOS DE COMUNICAÇÃO ---
const apiService = {
    async request(path, { method = 'GET', body = null } = {}) {
        const token = sessionStorage.getItem(CONFIG.TOKEN_KEY);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${CONFIG.API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (response.status === 401) authService.logout();

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Erro: ${response.status}`);

        return data;
    }
};

// --- SERVIÇOS DE AUTENTICAÇÃO ---
const authService = {
    async login(usuario, senha) {
        try {
            const data = await apiService.request('/login', {
                method: 'POST',
                body: { usuario, senha }
            });

            if (data.token) {
                sessionStorage.setItem(CONFIG.TOKEN_KEY, data.token);
                sessionStorage.setItem(CONFIG.AUTH_KEY, 'true');
                uiController.initDashboard();
            }
        } catch (err) {
            alert(err.message);
        }
    },

    logout() {
        sessionStorage.clear();
        location.reload();
    }
};

// --- GESTÃO DE ALUNOS ---
const studentService = {
    async fetchAll() {
        uiController.toggleLoader(true);
        try {
            const list = await apiService.request('/alunos');
            uiController.renderStudentTable(list);
        } catch (err) {
            uiController.renderError();
        }
    },

    async persist(studentData) {
        // Garantimos que o CPF no corpo da requisição está limpo
        const rawCpf = formatters.stripNonDigits(studentData.cpf);
        const payload = { ...studentData, cpf: rawCpf };

        // A URL de edição também usa o CPF limpo definido no STATE
        const path = STATE.isEditing() ? `/alunos/${STATE.activeStudentCpf}` : '/alunos';
        const method = STATE.isEditing() ? 'PUT' : 'POST';

        try {
            await apiService.request(path, { method, body: payload });
            uiController.closeModal();
            this.fetchAll();
        } catch (err) {
            alert(err.message);
        }
    },

    async delete(cpf) {
        const rawCpf = formatters.stripNonDigits(cpf);
        if (!confirm(`Deseja excluir permanentemente o aluno de CPF: ${formatters.toCpfMask(rawCpf)}?`)) return;

        try {
            await apiService.request(`/alunos/${rawCpf}`, { method: 'DELETE' });
            this.fetchAll();
        } catch (err) {
            alert(err.message);
        }
    }
};

// --- CONTROLADOR DE INTERFACE ---
const uiController = {
    initDashboard() {
        DOM.loginSection.classList.add('hidden');
        DOM.adminSection.classList.remove('hidden');
        studentService.fetchAll();
    },

    toggleLoader(show) {
        if (show) DOM.studentTable.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-zinc-500 italic animate-pulse">Sincronizando dados...</td></tr>';
    },

    renderError() {
        DOM.studentTable.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-red-500 font-bold">Falha na conexão com a API.</td></tr>';
    },

    openModal(student = null) {
        // STATE armazena o CPF limpo
        STATE.activeStudentCpf = student ? formatters.stripNonDigits(student.cpf) : null;
        DOM.studentForm.reset();

        DOM.modalTitle.innerText = STATE.isEditing() ? "Editar Aluno" : "Novo Cadastro";
        DOM.inputs.cpf.disabled = STATE.isEditing();

        if (student) {
            DOM.inputs.nome.value = student.nome;
            // No input, mostramos formatado
            DOM.inputs.cpf.value = formatters.toCpfMask(student.cpf);
            DOM.inputs.status.value = student.status.toString();
        }

        DOM.studentModal.classList.add('modal-active');
    },

    closeModal() {
        DOM.studentModal.classList.remove('modal-active');
    },

    renderStudentTable(list) {
        DOM.studentTable.innerHTML = list.length ? "" : '<tr><td colspan="4" class="p-5 text-center">Nenhum registro.</td></tr>';

        list.forEach(item => {
            const statusStyle = item.status ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';

            // Limpamos o CPF para passar como argumento nas funções
            const rawCpf = formatters.stripNonDigits(item.cpf);

            DOM.studentTable.innerHTML += `
                <tr class="border-b border-zinc-800/50 hover:bg-white/5 transition-all">
                    <td class="p-5 font-bold text-white">${item.nome}</td>
                    <td class="p-5 font-mono text-zinc-400">${formatters.toCpfMask(item.cpf)}</td>
                    <td class="p-5">
                        <span class="${statusStyle} text-[10px] px-2 py-1 rounded uppercase font-bold">
                            ${item.status ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="p-5 text-center">
                        <button onclick="uiController.handleEdit('${rawCpf}', '${item.nome}', ${item.status})" 
                                class="text-blue-400 font-bold text-xs mr-4 hover:underline cursor-pointer">EDITAR</button>
                        <button onclick="window.deletarAluno('${rawCpf}')" 
                                class="text-red-500 font-bold text-xs hover:underline cursor-pointer">EXCLUIR</button>
                    </td>
                </tr>`;
        });
    },

    handleEdit(cpf, nome, status) {
        this.openModal({ cpf, nome, status });
    }
};

// --- EXPOSIÇÃO GLOBAL E EVENTOS ---
window.logout = () => authService.logout();
window.deletarAluno = (cpf) => studentService.delete(cpf);
window.fecharModal = () => uiController.closeModal();
window.abrirModalCadastro = () => uiController.openModal();

DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    authService.login(document.getElementById('user').value, document.getElementById('pass').value);
});

DOM.studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    studentService.persist({
        nome: DOM.inputs.nome.value.trim(),
        cpf: DOM.inputs.cpf.value.trim(),
        status: DOM.inputs.status.value === 'true'
    });
});

DOM.inputs.cpf.addEventListener('input', (e) => {
    e.target.value = formatters.toCpfMask(e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem(CONFIG.AUTH_KEY)) uiController.initDashboard();
});