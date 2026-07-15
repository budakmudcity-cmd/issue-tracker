const API = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { return localStorage.getItem('user'); }

function apiUrl(path) { return `${API}/${path}`; }

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function api(method, path, body) {
  const res = await fetch(apiUrl(path), {
    method,
    headers: apiHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ---- LOGIN PAGE ---- */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  if (getToken()) { window.location.href = '/dashboard'; }
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(apiUrl('login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', data.user.username);
      window.location.href = '/dashboard';
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}

/* ---- DASHBOARD PAGE ---- */
const issuesBody = document.getElementById('issuesBody');
if (issuesBody) {
  if (!getToken()) { window.location.href = '/'; }
  document.getElementById('userDisplay').textContent = getUser();

  // Load users for assignment dropdown
  let users = [];
  async function loadUsers() {
    try { users = await api('GET', 'users'); } catch (_) { users = []; }
  }

  // Render issues
  let allIssues = [];
  function renderIssues() {
    const statusFilter = document.getElementById('filterStatus').value;
    const priorityFilter = document.getElementById('filterPriority').value;
    let filtered = allIssues;
    if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
    if (priorityFilter) filtered = filtered.filter(i => i.priority === priorityFilter);

    if (!filtered.length) {
      issuesBody.innerHTML = '<tr><td colspan="7" class="loading-cell">No issues found</td></tr>';
      return;
    }
    issuesBody.innerHTML = filtered.map(i => {
      const statusClass = `badge-${i.status}`;
      const priorityClass = `badge-${i.priority}`;
      const created = i.created_at ? new Date(i.created_at).toLocaleDateString() : '-';
      const updated = i.updated_at ? new Date(i.updated_at).toLocaleDateString() : '-';
      return `<tr>
        <td><strong>${esc(i.title)}</strong>${i.description ? '<br><small style="color:#6b7280">' + esc(i.description.slice(0,60)) + '</small>' : ''}</td>
        <td><span class="badge ${statusClass}">${i.status.replace('_',' ')}</span></td>
        <td><span class="badge ${priorityClass}">${i.priority}</span></td>
        <td>${esc(i.created_by)}</td>
        <td>${i.assigned_to ? esc(i.assigned_to) : '<span style="color:#9ca3af">-</span>'}</td>
        <td>${updated}</td>
        <td><div class="actions-cell">
          <button class="btn-sm btn-edit" onclick="editIssue('${i.id}')">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteIssue('${i.id}')">Delete</button>
        </div></td>
      </tr>`;
    }).join('');
  }

  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function loadIssues() {
    try {
      allIssues = await api('GET', 'issues');
      renderIssues();
    } catch (err) {
      issuesBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Error: ${err.message}</td></tr>`;
    }
  }

  // Filter change events
  document.getElementById('filterStatus').addEventListener('change', renderIssues);
  document.getElementById('filterPriority').addEventListener('change', renderIssues);

  // Modal
  const modal = document.getElementById('issueModal');
  const modalTitle = document.getElementById('modalTitle');
  const issueId = document.getElementById('issueId');
  const issueTitle = document.getElementById('issueTitle');
  const issueDesc = document.getElementById('issueDesc');
  const issueStatus = document.getElementById('issueStatus');
  const issuePriority = document.getElementById('issuePriority');
  const issueAssigned = document.getElementById('issueAssigned');

  function populateAssigned() {
    issueAssigned.innerHTML = '<option value="">Unassigned</option>';
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.username;
      opt.textContent = u.username;
      issueAssigned.appendChild(opt);
    });
  }

  function openModal(issue) {
    modalTitle.textContent = issue ? 'Edit Issue' : 'New Issue';
    issueId.value = issue ? issue.id : '';
    issueTitle.value = issue ? issue.title : '';
    issueDesc.value = issue ? (issue.description || '') : '';
    issueStatus.value = issue ? issue.status : 'open';
    issuePriority.value = issue ? issue.priority : 'medium';
    issueAssigned.value = issue ? (issue.assigned_to || '') : '';
    populateAssigned();
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.getElementById('issueForm').reset();
    issueId.value = '';
  }

  document.getElementById('createBtn').addEventListener('click', () => openModal(null));
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  window.editIssue = function(id) {
    const issue = allIssues.find(i => i.id === id);
    if (issue) openModal(issue);
  };

  window.deleteIssue = async function(id) {
    if (!confirm('Delete this issue?')) return;
    try {
      await api('DELETE', `issues?id=${id}`);
      await loadIssues();
    } catch (err) {
      alert(err.message);
    }
  };

  document.getElementById('issueForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = issueId.value;
    const body = {
      title: issueTitle.value.trim(),
      description: issueDesc.value.trim(),
      status: issueStatus.value,
      priority: issuePriority.value,
      assigned_to: issueAssigned.value || null
    };
    try {
      if (id) {
        await api('PUT', `issues?id=${id}`, body);
      } else {
        await api('POST', 'issues', body);
      }
      closeModal();
      await loadIssues();
    } catch (err) {
      alert(err.message);
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });

  // Init
  (async () => {
    await loadUsers();
    populateAssigned();
    await loadIssues();
  })();
}
