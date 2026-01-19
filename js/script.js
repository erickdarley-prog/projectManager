document.addEventListener('DOMContentLoaded', function () {
    // estado global simples para saber se estamos editando
    let editingProjectItem = null;
    let editingTeamIndex = null;

    const API_BASE = '/api/projects';

    // Dados de exemplo para a equipe (por enquanto, apenas em memória)
    let TEAM_MEMBERS = [
        {
            name: 'Ana Souza',
            role: 'Desenvolvedora Front-end',
            project: 'Portal do Cliente',
            status: 'Ativo',
            statusClass: 'ativo',
            joinDate: '2024-03-10',
        },
        {
            name: 'Bruno Lima',
            role: 'Desenvolvedor Back-end',
            project: 'API de Projetos',
            status: 'Ativo',
            statusClass: 'ativo',
            joinDate: '2023-11-01',
        },
        {
            name: 'Carla Menezes',
            role: 'Product Owner',
            project: 'Mobile App',
            status: 'Em pausa',
            statusClass: 'em-pausa',
            joinDate: '2022-07-18',
        },
    ];

    function loadTeamMembersFromStorage() {
        try {
            const raw = window.localStorage.getItem('teamMembers');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return null;
            return parsed;
        } catch (error) {
            console.error('Erro ao carregar membros da equipe do localStorage', error);
            return null;
        }
    }

    function saveTeamMembersToStorage() {
        try {
            window.localStorage.setItem('teamMembers', JSON.stringify(TEAM_MEMBERS));
        } catch (error) {
            console.error('Erro ao salvar membros da equipe no localStorage', error);
        }
    }

    (function initTeamMembersFromStorage() {
        const stored = loadTeamMembersFromStorage();
        if (stored) {
            TEAM_MEMBERS = stored;
        }
    })();

    // ---- Login ----
    const loginForm = document.getElementById('login-form');
    const loginOverlay = document.querySelector('.login-overlay');
    const app = document.getElementById('app');
    const loginError = document.getElementById('login-error');
    const teamTableBody = document.getElementById('team-table-body');
    const teamModal = document.getElementById('team-modal');
    const teamForm = document.getElementById('team-form');
    const openTeamModalBtn = document.getElementById('open-team-modal');
    const cancelTeamModalBtn = document.getElementById('cancel-team-modal');

    // ---- Navegação lateral ----
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    function showView(viewName) {
        const views = document.querySelectorAll('.view');
        views.forEach(function (view) {
            if (view.id === 'view-' + viewName) {
                view.hidden = false;
            } else {
                view.hidden = true;
            }
        });

        sidebarLinks.forEach(function (link) {
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    sidebarLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            const viewName = link.dataset.view;
            if (viewName) {
                showView(viewName);
            }
        });
    });

    // ---- Equipe ----
    function formatDateToBR(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    function renderTeamMembers() {
        if (!teamTableBody) return;

        teamTableBody.innerHTML = '';

        TEAM_MEMBERS.forEach(function (member, index) {
            const tr = document.createElement('tr');
            tr.dataset.index = String(index);
            tr.innerHTML = `
                <td>${member.name}</td>
                <td>${member.role}</td>
                <td>${member.project}</td>
                <td>
                    <span class="status-badge status-${member.statusClass}">${member.status}</span>
                </td>
                <td>${formatDateToBR(member.joinDate)}</td>
                <td>
                    <button type="button" class="icon-button team-action-edit" title="Editar" aria-label="Editar">📝</button>
                    <button type="button" class="icon-button team-action-delete" title="Excluir" aria-label="Excluir">🗑</button>
                </td>
            `;
            teamTableBody.appendChild(tr);
        });
    }

    renderTeamMembers();

    function openTeamModalForNew() {
        editingTeamIndex = null;
        if (teamForm) {
            teamForm.reset();
        }
        if (teamModal) {
            teamModal.hidden = false;
        }
    }

    function openTeamModalForEdit(index) {
        const member = TEAM_MEMBERS[index];
        if (!member || !teamForm || !teamModal) return;

        editingTeamIndex = index;

        const nameInput = document.getElementById('team-name');
        const roleInput = document.getElementById('team-role');
        const projectInput = document.getElementById('team-project');
        const statusSelect = document.getElementById('team-status');
        const joinDateInput = document.getElementById('team-join-date');

        if (nameInput) nameInput.value = member.name || '';
        if (roleInput) roleInput.value = member.role || '';
        if (projectInput) projectInput.value = member.project || '';
        if (statusSelect) statusSelect.value = member.status || 'Ativo';
        if (joinDateInput) joinDateInput.value = member.joinDate || '';

        teamModal.hidden = false;
    }

    if (openTeamModalBtn && teamModal && teamForm) {
        openTeamModalBtn.addEventListener('click', openTeamModalForNew);
    }

    if (cancelTeamModalBtn && teamModal && teamForm) {
        cancelTeamModalBtn.addEventListener('click', function () {
            teamForm.reset();
            teamModal.hidden = true;
            editingTeamIndex = null;
        });
    }

    if (teamForm) {
        teamForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const nameInput = document.getElementById('team-name');
            const roleInput = document.getElementById('team-role');
            const projectInput = document.getElementById('team-project');
            const statusSelect = document.getElementById('team-status');
            const joinDateInput = document.getElementById('team-join-date');

            const name = nameInput ? nameInput.value.trim() : '';
            const role = roleInput ? roleInput.value.trim() : '';
            const project = projectInput ? projectInput.value.trim() : '';
            const status = statusSelect ? statusSelect.value : 'Ativo';
            const joinDate = joinDateInput ? joinDateInput.value : '';

            if (!name || !joinDate) {
                return;
            }

            const statusClass = status === 'Ativo' ? 'ativo' : 'em-pausa';

            const memberData = {
                name,
                role,
                project,
                status,
                statusClass,
                joinDate,
            };

            if (editingTeamIndex === null) {
                TEAM_MEMBERS.push(memberData);
            } else {
                TEAM_MEMBERS[editingTeamIndex] = memberData;
            }

            saveTeamMembersToStorage();
            renderTeamMembers();

            // Atualiza todos os selects de desenvolvedor já abertos no formulário de projetos
            document.querySelectorAll('select[name="task-dev"]').forEach(function (selectEl) {
                const currentValue = selectEl.value;
                populateDeveloperSelect(selectEl, currentValue);
            });

            teamForm.reset();
            teamModal.hidden = true;
            editingTeamIndex = null;
        });
    }

    if (teamTableBody) {
        teamTableBody.addEventListener('click', function (event) {
            const editBtn = event.target.closest('.team-action-edit');
            const deleteBtn = event.target.closest('.team-action-delete');

            if (editBtn) {
                const row = editBtn.closest('tr');
                if (!row || !row.dataset.index) return;
                const index = parseInt(row.dataset.index, 10);
                if (Number.isNaN(index)) return;
                openTeamModalForEdit(index);
                return;
            }

            if (deleteBtn) {
                const row = deleteBtn.closest('tr');
                if (!row || !row.dataset.index) return;
                const index = parseInt(row.dataset.index, 10);
                if (Number.isNaN(index)) return;

                const confirmed = window.confirm('Deseja realmente remover este membro da equipe?');
                if (!confirmed) return;

                TEAM_MEMBERS.splice(index, 1);
                saveTeamMembersToStorage();
                renderTeamMembers();

                document.querySelectorAll('select[name="task-dev"]').forEach(function (selectEl) {
                    const currentValue = selectEl.value;
                    populateDeveloperSelect(selectEl, currentValue);
                });
                return;
            }
        });
    }

    // ---- Formulário de novo projeto (modal) ----
    const projectForm = document.getElementById('project-form');
    const projectsList = document.querySelector('.projects-list');
    const projectModal = document.getElementById('project-modal');
    const openProjectModalBtn = document.getElementById('open-project-modal');
    const cancelProjectModalBtn = document.getElementById('cancel-project-modal');
    const tasksContainer = document.getElementById('tasks-container');
    const addTaskButton = document.getElementById('add-task-button');

    function populateDeveloperSelect(selectEl, selectedValue = '') {
        if (!selectEl) return;

        selectEl.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = TEAM_MEMBERS.length
            ? 'Selecione um desenvolvedor'
            : 'Cadastre membros da equipe primeiro';
        placeholder.disabled = true;
        placeholder.selected = !selectedValue;
        selectEl.appendChild(placeholder);

        let foundSelected = false;

        TEAM_MEMBERS.forEach(function (member) {
            const opt = document.createElement('option');
            opt.value = member.name;
            opt.textContent = member.name;
            if (selectedValue && selectedValue === member.name) {
                opt.selected = true;
                placeholder.selected = false;
                foundSelected = true;
            }
            selectEl.appendChild(opt);
        });

        if (selectedValue && !foundSelected) {
            const extraOpt = document.createElement('option');
            extraOpt.value = selectedValue;
            extraOpt.textContent = selectedValue + ' (não está mais na equipe)';
            extraOpt.selected = true;
            placeholder.selected = false;
            selectEl.appendChild(extraOpt);
        }
    }

    function addTaskGroup(nameValue = '', devValue = '', progressValue = 0, weightValue = 10) {
        if (!tasksContainer) return;
        const group = document.createElement('div');
        group.className = 'task-form-group';
        group.innerHTML = `
            <div class="project-form-row">
                <label>Nome da tarefa</label>
                <input type="text" name="task-name" required />
            </div>
            <div class="project-form-row">
                <label>Responsável (desenvolvedor)</label>
                <select name="task-dev" required></select>
            </div>
            <div class="project-form-row">
                <label>Progresso (%)</label>
                <input type="number" name="task-progress" min="0" max="100" value="0" required />
            </div>
            <div class="project-form-row">
                <label>Peso da tarefa (%)</label>
                <input type="number" name="task-weight" min="1" max="100" value="10" required />
            </div>
        `;

        const nameInput = group.querySelector('input[name="task-name"]');
        const devSelect = group.querySelector('select[name="task-dev"]');
        const progressInput = group.querySelector('input[name="task-progress"]');
        const weightInput = group.querySelector('input[name="task-weight"]');
        if (nameValue && nameInput) nameInput.value = nameValue;
        if (devSelect) populateDeveloperSelect(devSelect, devValue);
        if (progressInput) progressInput.value = Number.isFinite(progressValue) ? progressValue : 0;
        if (weightInput) weightInput.value = Number.isFinite(weightValue) ? weightValue : 10;

        tasksContainer.appendChild(group);
    }

    function createProjectListItem(project) {
        const li = document.createElement('li');
        li.className = 'project-item';
        if (project._id) {
            li.dataset.id = project._id;
        }

        const tasks = project.tasks || [];

        // cálculo da porcentagem total do projeto (média ponderada pelo peso das tarefas)
        let totalWeight = 0;
        let weightedSum = 0;
        tasks.forEach(function (t) {
            const w = typeof t.weight === 'number' && !isNaN(t.weight) && t.weight > 0 ? t.weight : 1;
            const p = typeof t.progress === 'number' && !isNaN(t.progress) ? t.progress : 0;
            totalWeight += w;
            weightedSum += w * p;
        });
        const projectTotalProgress = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

        const tasksHtml = tasks.map(function (task) {
            const safeWeight = typeof task.weight === 'number' && !isNaN(task.weight) && task.weight > 0 ? task.weight : 1;
            return `
                        <li class="task-item">
                            <div class="task-info">
                                <span class="task-name">${task.name}</span>
                                ${task.dev ? `<span class="task-dev">Desenvolvedor: ${task.dev}</span>` : ''}
                                <span class="task-weight">Peso: ${safeWeight}%</span>
                            </div>
                            <div class="task-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${task.progress || 0}%"></div>
                                </div>
                                <span class="progress-label">${task.progress || 0}%</span>
                            </div>
                        </li>`;
        }).join('');

        li.innerHTML = `
                <div class="project-header">
                    <div class="project-main">
                        <span class="project-name">${project.title}</span>
                    </div>
                    <span class="project-dates">
                        <span>Início: ${project.start}</span>
                        <span>Entrega: ${project.end}</span>
                    </span>
                </div>
                <div class="project-tasks">
                    <h3>Tarefas</h3>
                    <ul class="task-list">
            ${tasksHtml}
                    </ul>
                </div>
                <div class="project-total-progress">
                    <span class="project-total-progress-label">Progresso total do projeto:</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${projectTotalProgress}%"></div>
                    </div>
                    <span class="progress-label">${projectTotalProgress}%</span>
                </div>
                <div class="project-footer">
                    <div class="project-actions">
                        <button class="icon-button edit-item" type="button" title="Editar" aria-label="Editar">📝</button>
                        <button class="icon-button delete-item" type="button" title="Excluir" aria-label="Excluir">🗑</button>
                    </div>
                </div>
            `;

        return li;
    }

    async function loadProjectsFromApi() {
        if (!projectsList) return;
        try {
            const response = await fetch(API_BASE);
            if (!response.ok) {
                throw new Error('Erro ao carregar projetos');
            }
            const projects = await response.json();
            projectsList.innerHTML = '';
            projects.forEach(function (project) {
                const li = createProjectListItem(project);
                projectsList.appendChild(li);
            });
        } catch (error) {
            console.error(error);
        }
    }

    async function saveProjectToApi(project, id = null) {
        const url = id ? `${API_BASE}/${id}` : API_BASE;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(project),
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar projeto');
        }

        return response.json();
    }

    async function deleteProjectFromApi(id) {
        const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (!response.ok && response.status !== 204) {
            throw new Error('Erro ao excluir projeto');
        }
    }

    if (loginForm && loginOverlay && app) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Validação simples de exemplo. Ajuste para sua regra real.
            const isValid = username === 'admin' && password === '123';

            if (isValid) {
                loginError.style.display = 'none';
                loginOverlay.style.display = 'none';
                app.hidden = false;
                showView('projetos');
                loadProjectsFromApi();
            } else {
                loginError.style.display = 'block';
            }
        });
    } else {
        // Se não houver login, tenta carregar direto (caso você remova o login no futuro)
        app.hidden = false;
        showView('projetos');
        loadProjectsFromApi();
    }

    if (addTaskButton && tasksContainer) {
        addTaskButton.addEventListener('click', function () {
            addTaskGroup();
        });
    }

    if (openProjectModalBtn && projectModal) {
        openProjectModalBtn.addEventListener('click', function () {
            editingProjectItem = null;
            if (projectForm) {
                projectForm.reset();
            }
            if (tasksContainer) {
                tasksContainer.innerHTML = '';
                addTaskGroup();
            }
            projectModal.hidden = false;
        });
    }

    if (cancelProjectModalBtn && projectModal && projectForm) {
        cancelProjectModalBtn.addEventListener('click', function () {
            projectForm.reset();
            projectModal.hidden = true;
        });
    }

    if (projectsList) {
        // Delegação de eventos para botões de editar e excluir dentro da lista de projetos
        projectsList.addEventListener('click', function (event) {
            const editButton = event.target.closest('.icon-button.edit-item');
            const deleteButton = event.target.closest('.icon-button.delete-item');

            // --- Editar projeto ---
            if (editButton) {
                const projectItem = editButton.closest('.project-item');
                if (!projectItem || !projectForm || !projectModal) return;

                editingProjectItem = projectItem;

                // Limpa o formulário antes de preencher
                projectForm.reset();
                if (tasksContainer) {
                    tasksContainer.innerHTML = '';
                }

                const titleInput = document.getElementById('project-title');
                const startInput = document.getElementById('project-start');
                const endInput = document.getElementById('project-end');

                const titleEl = projectItem.querySelector('.project-name');
                const taskItems = projectItem.querySelectorAll('.task-item');
                const dateSpans = projectItem.querySelectorAll('.project-dates span');

                if (titleEl && titleInput) {
                    titleInput.value = titleEl.textContent.trim();
                }

                taskItems.forEach(function (taskItem) {
                    const nameEl = taskItem.querySelector('.task-name');
                    const devEl = taskItem.querySelector('.task-dev');
                    const progressLabelEl = taskItem.querySelector('.progress-label');
                    const weightEl = taskItem.querySelector('.task-weight');
                    const nameText = nameEl ? nameEl.textContent.trim() : '';
                    let devText = '';
                    if (devEl) {
                        devText = devEl.textContent.replace('Desenvolvedor:', '').trim();
                    }
                    let progressValue = 0;
                    if (progressLabelEl && progressLabelEl.textContent) {
                        const numeric = parseInt(progressLabelEl.textContent.replace('%', '').trim(), 10);
                        if (!isNaN(numeric)) {
                            progressValue = numeric;
                        }
                    }
                    let weightValue = 10;
                    if (weightEl && weightEl.textContent) {
                        const numericWeight = parseInt(weightEl.textContent.replace('Peso:', '').replace('%', '').trim(), 10);
                        if (!isNaN(numericWeight) && numericWeight > 0) {
                            weightValue = numericWeight;
                        }
                    }
                    addTaskGroup(nameText, devText, progressValue, weightValue);
                });

                if (dateSpans[0] && startInput) {
                    const rawStart = dateSpans[0].textContent.split(':')[1];
                    if (rawStart) startInput.value = rawStart.trim();
                }
                if (dateSpans[1] && endInput) {
                    const rawEnd = dateSpans[1].textContent.split(':')[1];
                    if (rawEnd) endInput.value = rawEnd.trim();
                }

                projectModal.hidden = false;
                return;
            }

            // --- Excluir projeto ---
            if (deleteButton) {
                const projectItem = deleteButton.closest('.project-item');
                if (!projectItem) return;

                const id = projectItem.dataset.id;

                // Se estiver editando esse mesmo projeto, fecha o modal e limpa estado
                if (editingProjectItem === projectItem && projectModal && projectForm) {
                    projectForm.reset();
                    projectModal.hidden = true;
                    editingProjectItem = null;
                }

                if (id) {
                    deleteProjectFromApi(id)
                        .then(function () {
                            projectItem.remove();
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                } else {
                    projectItem.remove();
                }

                return;
            }
        });
    }

    if (projectForm && projectsList && tasksContainer) {
        projectForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const title = document.getElementById('project-title').value.trim();
            const start = document.getElementById('project-start').value;
            const end = document.getElementById('project-end').value;

            const groups = tasksContainer.querySelectorAll('.task-form-group');
            const tasks = [];
            let hasInvalid = false;
            let totalWeight = 0;

            groups.forEach(function (group) {
                const nameInput = group.querySelector('input[name="task-name"]');
                const devSelect = group.querySelector('select[name="task-dev"]');
                const progressInput = group.querySelector('input[name="task-progress"]');
                const weightInput = group.querySelector('input[name="task-weight"]');
                const name = nameInput ? nameInput.value.trim() : '';
                const dev = devSelect ? devSelect.value : '';
                let progress = progressInput ? parseInt(progressInput.value, 10) : 0;
                let weight = weightInput ? parseInt(weightInput.value, 10) : 10;

                if (!name && !dev && !progress && !weight) {
                    return; // ignora linhas totalmente vazias
                }

                if (!name || !dev || isNaN(progress) || isNaN(weight) || weight <= 0) {
                    hasInvalid = true;
                    return;
                }

                if (progress < 0) progress = 0;
                if (progress > 100) progress = 100;

                totalWeight += weight;
                tasks.push({ name, dev, progress, weight });
            });

            if (!title || !start || !end || tasks.length === 0 || hasInvalid) {
                return;
            }

            // validação: soma dos pesos deve ser exatamente 100%
            if (totalWeight !== 100) {
                alert('A soma dos pesos das tarefas deve ser exatamente 100%. Soma atual: ' + totalWeight + '%.');
                return;
            }

            const projectPayload = {
                title,
                start,
                end,
                tasks: tasks,
            };

            const currentId = editingProjectItem ? editingProjectItem.dataset.id : null;

            saveProjectToApi(projectPayload, currentId)
                .then(function (savedProject) {
                    let li = editingProjectItem;
                    if (!li) {
                        li = createProjectListItem(savedProject);
                        projectsList.appendChild(li);
                    } else {
                        // recria o conteúdo e garante que o ID fique atualizado
                        const newLi = createProjectListItem(savedProject);
                        projectsList.replaceChild(newLi, li);
                        li = newLi;
                    }

                    editingProjectItem = null;
                    projectForm.reset();
                    tasksContainer.innerHTML = '';
                    addTaskGroup();
                    if (projectModal) {
                        projectModal.hidden = true;
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        });
    }
});
