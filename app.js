// Global variables
let projects = [];
const STORAGE_KEY = 'project_manager_data';

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'Alta': return 'priority-high';
        case 'Media': return 'priority-medium';
        case 'Bassa': return 'priority-low';
        default: return '';
    }
}

function getStateClass(state) {
    switch (state) {
        case 'Completato': return 'state-completed';
        case 'In Corso': return 'state-in-progress';
        case 'Da Iniziare': return 'state-not-started';
        default: return '';
    }
}

// Data management functions
function loadProjects() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            projects = JSON.parse(savedData);
        }
        renderProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
        projects = [];
    }
}

function saveProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects, null, 4));
    } catch (error) {
        console.error('Error saving projects:', error);
        alert('Errore durante il salvataggio dei progetti: ' + error.message);
    }
}

function exportProjects() {
    try {
        const dataStr = JSON.stringify(projects, null, 4);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'projects.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } catch (error) {
        console.error('Error exporting projects:', error);
        alert('Errore durante l\'esportazione dei progetti: ' + error.message);
    }
}

function importProjects(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    if (confirm('Vuoi sovrascrivere i progetti esistenti?')) {
                        projects = importedData;
                        saveProjects();
                        renderProjects();
                        alert('Progetti importati con successo!');
                    }
                } else {
                    throw new Error('Formato file non valido');
                }
            } catch (error) {
                console.error('Error importing projects:', error);
                alert('Errore durante l\'importazione dei progetti: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Rendering functions
function renderProjects() {
    const projectsList = document.getElementById('projectsList');
    const stateFilter = document.getElementById('stateFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    
    // Get selected filters
    const selectedStates = Array.from(stateFilter.selectedOptions).map(option => option.value);
    const selectedPriorities = Array.from(priorityFilter.selectedOptions).map(option => option.value);
    
    // Filter projects
    const filteredProjects = projects.filter(project => {
        const stateMatch = selectedStates.length === 0 || selectedStates.includes(project.stato);
        const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(project.priorità);
        return stateMatch && priorityMatch;
    });
    
    // Clear and render
    projectsList.innerHTML = '';
    filteredProjects.forEach(project => {
        const projectElement = createProjectElement(project);
        projectsList.appendChild(projectElement);
    });
}

function createProjectElement(project) {
    const template = document.getElementById('projectTemplate');
    const projectElement = template.content.cloneNode(true);
    
    const card = projectElement.querySelector('.project-card');
    card.setAttribute('data-project-id', project.id);
    
    // Controlla se il progetto è compattato nel localStorage
    const isCompact = localStorage.getItem(`project_${project.id}_compact`) === 'true';
    if (isCompact) {
        card.classList.add('compact');
        // Modifica solo l'header, ma lascia il resto intatto
        const projectName = card.querySelector('.project-name');
        projectName.textContent = project.nome;
        // Crea la riga compatta
        const compactRow = document.createElement('div');
        compactRow.className = 'compact-row';
        // Stato
        const stateSpan = document.createElement('span');
        stateSpan.className = 'project-state ' + getStateClass(project.stato);
        stateSpan.textContent = project.stato;
        // Priorità
        const prioritySpan = document.createElement('span');
        prioritySpan.className = 'project-priority ' + getPriorityClass(project.priorità);
        prioritySpan.textContent = project.priorità;
        // Azioni
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'project-actions';
        // Toggle compatto
        const compactToggle = document.createElement('input');
        compactToggle.type = 'checkbox';
        compactToggle.className = 'form-check-input compact-project-toggle';
        compactToggle.checked = true;
        compactToggle.addEventListener('change', (e) => {
            toggleCompactProject(project.id, e.target.checked);
        });
        actionsDiv.appendChild(compactToggle);
        // Modifica
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary edit-project';
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.addEventListener('click', () => openEditProjectModal(project));
        actionsDiv.appendChild(editBtn);
        // Elimina
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-outline-danger delete-project';
        delBtn.innerHTML = '<i class="bi bi-trash"></i>';
        delBtn.addEventListener('click', () => deleteProject(project.id));
        actionsDiv.appendChild(delBtn);
        // Assembla la riga
        compactRow.appendChild(stateSpan);
        compactRow.appendChild(prioritySpan);
        compactRow.appendChild(actionsDiv);
        // Sostituisci l'header
        const header = card.querySelector('.project-header');
        header.innerHTML = '';
        header.appendChild(projectName);
        header.appendChild(compactRow);
    } else {
        // Modalità normale
        projectElement.querySelector('.project-name').textContent = project.nome;
        projectElement.querySelector('.project-description').innerHTML = marked.parse(project.descrizione);
        projectElement.querySelector('.project-state').textContent = project.stato;
        projectElement.querySelector('.project-state').classList.add(getStateClass(project.stato));
        projectElement.querySelector('.project-priority').textContent = project.priorità;
        projectElement.querySelector('.project-priority').classList.add(getPriorityClass(project.priorità));
        projectElement.querySelector('.project-start-date').textContent = formatDate(project.data_inizio);
        projectElement.querySelector('.project-end-date').textContent = project.data_fine ? formatDate(project.data_fine) : 'Non specificata';
        // Set up notes section
        const notesList = projectElement.querySelector('.notes-list');
        if (project.note && project.note.length > 0) {
            project.note.forEach(note => {
                const noteElement = createNoteElement(project.id, note);
                notesList.appendChild(noteElement);
            });
        }
        // Set up event listeners
        card.querySelector('.edit-project').addEventListener('click', () => openEditProjectModal(project));
        card.querySelector('.delete-project').addEventListener('click', () => deleteProject(project.id));
        card.querySelector('.add-note').addEventListener('click', () => openNoteModal(project.id));
        card.querySelector('.compact-notes-toggle').addEventListener('change', (e) => toggleCompactNotes(card, e.target.checked));
        // Toggle compatto
        const compactToggle = card.querySelector('.compact-project-toggle');
        if (compactToggle) {
            compactToggle.checked = isCompact;
            compactToggle.addEventListener('change', (e) => {
                toggleCompactProject(project.id, e.target.checked);
            });
        }
    }
    return projectElement;
}

function createNoteElement(projectId, note) {
    const template = document.getElementById('noteTemplate');
    const noteElement = template.content.cloneNode(true);
    
    // Set note details
    noteElement.querySelector('.note-title').textContent = note.titolo || 'Senza titolo';
    noteElement.querySelector('.note-date').textContent = formatDate(note.data);
    noteElement.querySelector('.note-content').innerHTML = marked.parse(note.contenuto);
    
    // Set up event listeners
    const noteItem = noteElement.querySelector('.note-item');
    noteItem.querySelector('.edit-note').addEventListener('click', () => openNoteModal(projectId, note));
    noteItem.querySelector('.delete-note').addEventListener('click', () => deleteNote(projectId, note.data));
    
    return noteElement;
}

// Event handlers
function openEditProjectModal(project) {
    const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    const form = document.getElementById('editProjectForm');
    
    // Fill form with project data
    document.getElementById('editProjectId').value = project.id;
    document.getElementById('editProjectName').value = project.nome;
    document.getElementById('editProjectDescription').value = project.descrizione;
    document.getElementById('editProjectState').value = project.stato;
    document.getElementById('editProjectStartDate').value = project.data_inizio;
    document.getElementById('editProjectEndDate').value = project.data_fine || '';
    document.getElementById('editProjectPriority').value = project.priorità;
    
    modal.show();
}

function openNoteModal(projectId, note = null) {
    const modal = new bootstrap.Modal(document.getElementById('noteModal'));
    const form = document.getElementById('noteForm');
    
    // Fill form with note data if editing
    document.getElementById('noteProjectId').value = projectId;
    if (note) {
        document.getElementById('noteDate').value = note.data;
        document.getElementById('noteTitle').value = note.titolo || '';
        document.getElementById('noteContent').value = note.contenuto;
    } else {
        document.getElementById('noteDate').value = '';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
    }
    
    modal.show();
}

function toggleCompactNotes(projectCard, isCompact) {
    const notes = projectCard.querySelectorAll('.note-item');
    notes.forEach(note => {
        if (isCompact) {
            note.classList.add('compact');
        } else {
            note.classList.remove('compact');
        }
    });
}

function toggleCompactProject(projectId, isCompact) {
    localStorage.setItem(`project_${projectId}_compact`, isCompact);
    renderProjects();
}

// Form submission handlers
document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newProject = {
        id: projects.length + 1,
        nome: document.getElementById('projectName').value,
        descrizione: document.getElementById('projectDescription').value,
        stato: document.getElementById('projectState').value,
        data_inizio: document.getElementById('projectStartDate').value,
        data_fine: document.getElementById('projectEndDate').value || null,
        priorità: document.getElementById('projectPriority').value,
        data_creazione: new Date().toISOString(),
        note: []
    };
    
    projects.push(newProject);
    await saveProjects();
    renderProjects();
    e.target.reset();
});

document.getElementById('saveProjectChanges').addEventListener('click', async () => {
    const projectId = parseInt(document.getElementById('editProjectId').value);
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
        projects[projectIndex] = {
            ...projects[projectIndex],
            nome: document.getElementById('editProjectName').value,
            descrizione: document.getElementById('editProjectDescription').value,
            stato: document.getElementById('editProjectState').value,
            data_inizio: document.getElementById('editProjectStartDate').value,
            data_fine: document.getElementById('editProjectEndDate').value || null,
            priorità: document.getElementById('editProjectPriority').value
        };
        
        await saveProjects();
        renderProjects();
        bootstrap.Modal.getInstance(document.getElementById('editProjectModal')).hide();
    }
});

document.getElementById('saveNote').addEventListener('click', async () => {
    const projectId = parseInt(document.getElementById('noteProjectId').value);
    const noteDate = document.getElementById('noteDate').value;
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
        const note = {
            titolo: document.getElementById('noteTitle').value,
            data: noteDate || new Date().toISOString(),
            contenuto: document.getElementById('noteContent').value
        };
        
        if (noteDate) {
            // Edit existing note
            const noteIndex = projects[projectIndex].note.findIndex(n => n.data === noteDate);
            if (noteIndex !== -1) {
                projects[projectIndex].note[noteIndex] = note;
            }
        } else {
            // Add new note
            if (!projects[projectIndex].note) {
                projects[projectIndex].note = [];
            }
            projects[projectIndex].note.push(note);
        }
        
        await saveProjects();
        renderProjects();
        bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide();
    }
});

// Delete handlers
async function deleteProject(projectId) {
    if (confirm('Sei sicuro di voler eliminare questo progetto?')) {
        projects = projects.filter(p => p.id !== projectId);
        await saveProjects();
        renderProjects();
    }
}

async function deleteNote(projectId, noteDate) {
    if (confirm('Sei sicuro di voler eliminare questa nota?')) {
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            projects[projectIndex].note = projects[projectIndex].note.filter(n => n.data !== noteDate);
            await saveProjects();
            renderProjects();
        }
    }
}

// Filter handlers
document.getElementById('stateFilter').addEventListener('change', renderProjects);
document.getElementById('priorityFilter').addEventListener('change', renderProjects);

// Add export/import buttons to the UI
document.addEventListener('DOMContentLoaded', () => {
    // Add export/import buttons to the sidebar
    const sidebar = document.querySelector('.sidebar');
    const exportImportDiv = document.createElement('div');
    exportImportDiv.className = 'mt-4';
    exportImportDiv.innerHTML = `
        <h5>Importa/Esporta</h5>
        <div class="d-grid gap-2">
            <button class="btn btn-outline-primary" onclick="exportProjects()">
                <i class="bi bi-download"></i> Esporta Progetti
            </button>
            <div class="input-group">
                <input type="file" class="form-control" id="importFile" accept=".json" onchange="importProjects(event)" style="display: none;">
                <label class="btn btn-outline-primary w-100" for="importFile">
                    <i class="bi bi-upload"></i> Importa Progetti
                </label>
            </div>
        </div>
    `;
    sidebar.appendChild(exportImportDiv);

    // Imposta tutti i progetti in modalità compatta al primo caricamento
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const allProjects = JSON.parse(savedData);
        allProjects.forEach(p => {
            if (localStorage.getItem(`project_${p.id}_compact`) === null) {
                localStorage.setItem(`project_${p.id}_compact`, 'true');
            }
        });
    }

    loadProjects();
}); 