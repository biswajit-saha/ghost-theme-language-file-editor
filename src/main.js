    const createProjectBtn = document.getElementById('createProjectBtn');
    const projectSelect = document.getElementById('projectSelect');
    const keysEl = document.getElementById('keys');
    const originalEl = document.getElementById('original');
    const translationArea = document.getElementById('translation');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const projectModal = document.getElementById('projectModal');
    const modalProjectName = document.getElementById('modalProjectName');
    const modalLangCode = document.getElementById('modalLangCode');
    const modalFileInput = document.getElementById('modalFileInput');
    const cancelModal = document.getElementById('cancelModal');
    const confirmCreate = document.getElementById('confirmCreate');
    const projectInfoDisplay = document.getElementById('projectInfoDisplay');
    const deleteProjectBtn = document.getElementById('deleteProjectBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    function setTheme(mode) {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.293 14.707A8 8 0 0112 4a8 8 0 106.93 4.07 6 6 0 01-1.637 6.637z" />';
      } else {
        document.documentElement.classList.remove('dark');
        themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m8.66-9h1M3.34 12h1m15.07 5.07l.7.7M4.93 4.93l.7.7m0 13.44l-.7.7M19.07 4.93l-.7.7M12 8a4 4 0 100 8 4 4 0 000-8z" />';
      }
      localStorage.setItem('theme', mode);
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'light' : 'dark');
    });

    let projects = JSON.parse(localStorage.getItem('projects') || '{}');
    let currentProjectKey = localStorage.getItem('lastProject') || '';
    let keysList = [];
    let selectedKey = null;

    function persistProjects() { localStorage.setItem('projects', JSON.stringify(projects)); }

    function updateProjectSelect() {
      const keys = Object.keys(projects);
      projectSelect.innerHTML = '<option value="">— select project —</option>';
      keys.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = projects[k].projectName || k;
        if (k === currentProjectKey) opt.selected = true;
        projectSelect.appendChild(opt);
      });
      projectSelect.style.display = keys.length ? 'inline-block' : 'none';
    }

    function updateInfo() {
      if (!currentProjectKey) { projectInfoDisplay.classList.add('hidden'); deleteProjectBtn.classList.add('hidden'); return; }
      const p = projects[currentProjectKey];
      projectInfoDisplay.classList.remove('hidden'); deleteProjectBtn.classList.remove('hidden');
      const totalKeys = Object.keys(p.originalStrings).length;
      const translatedCount = Object.keys(p.translations).length;
      projectInfoDisplay.innerHTML = `
        <span class="font-semibold">${p.projectName}</span>
        <span class="px-2 text-gray-400">•</span>
        <span>${p.langCode}</span>
        <span class="px-2 text-gray-400">•</span>
        <span>${translatedCount}/${totalKeys} translated</span>
      `;
    }

    function renderKeys() {
      keysEl.innerHTML = '';
      keysList.forEach(k => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-start px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md';
        const dot = document.createElement('span');
        dot.className = `inline-block w-1 h-1 rounded-full mr-2 ${projects[currentProjectKey].translations[k] ? 'bg-green-500' : 'bg-slate-300'}`;
        div.appendChild(dot);
        const label = document.createElement('span');
        label.textContent = k;
        div.appendChild(label);
        div.addEventListener('click', () => selectKey(k, div));
        keysEl.appendChild(div);
      });
    }
    
    function selectKey(key, element) {
      [...keysEl.children].forEach(el => el.classList.remove('bg-slate-100', 'dark:bg-gray-700', 'font-semibold', 'dark:text-white', 'text-gray-800'));
      element.classList.add('bg-slate-100', 'dark:bg-gray-700', 'font-semibold', 'dark:text-white', 'text-gray-800');
      selectedKey = key;
      originalEl.value = projects[currentProjectKey].originalStrings[key] || '';
      translationArea.disabled = false;
      translationArea.value = projects[currentProjectKey].translations[key] || '';
      translationArea.focus();
      updateNavButtons();
    }

    function updateNavButtons() {
      if (!selectedKey) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }
      const idx = keysList.indexOf(selectedKey);
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= keysList.length - 1;
    }

    function navigate(direction) {
      if (!selectedKey) return;
      const idx = keysList.indexOf(selectedKey);
      const newIndex = idx + direction;
      if (newIndex >= 0 && newIndex < keysList.length) {
        selectKey(keysList[newIndex], keysEl.children[newIndex]);
      }
    }

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    translationArea.addEventListener('input', e => {
      if (!selectedKey) return;
      projects[currentProjectKey].translations[selectedKey] = e.target.value;
      persistProjects();
      renderKeys();
      updateInfo();
      downloadBtn.disabled = false;
    });

    projectSelect.addEventListener('change', e => {
      currentProjectKey = e.target.value;
      if (!currentProjectKey) return;
      localStorage.setItem('lastProject', currentProjectKey);
      keysList = Object.keys(projects[currentProjectKey].originalStrings);
      updateInfo();
      renderKeys();
      translationArea.value = '';
      originalEl.value = '';
      translationArea.disabled = true;
      selectedKey = null;
      updateNavButtons();
    });

    deleteProjectBtn.addEventListener('click', () => {
      if (!currentProjectKey) return;
      if (confirm(`Delete project "${projects[currentProjectKey].projectName}"? This cannot be undone.`)) {
        delete projects[currentProjectKey];
        persistProjects();
        currentProjectKey = '';
        localStorage.removeItem('lastProject');
        updateProjectSelect();
        keysEl.innerHTML = '';
        translationArea.value = '';
        originalEl.value = '';
        translationArea.disabled = true;
        selectedKey = null;
        updateInfo();
        downloadBtn.disabled =  Object.keys(projects).length === 0;
      }
    });

    createProjectBtn.addEventListener('click', () => {
      projectModal.classList.remove('hidden');
      modalProjectName.value = '';
      modalLangCode.value = '';
      modalFileInput.value = '';
      confirmCreate.disabled = true;
    });

    cancelModal.addEventListener('click', () => projectModal.classList.add('hidden'));

    function validateModalInputs() {
      confirmCreate.disabled = !(modalProjectName.value.trim() && modalLangCode.value.trim() && modalFileInput.files.length === 1);
    }

    modalProjectName.addEventListener('input', validateModalInputs);
    modalLangCode.addEventListener('input', validateModalInputs);
    modalFileInput.addEventListener('change', validateModalInputs);

    confirmCreate.addEventListener('click', () => {
      const name = modalProjectName.value.trim();
      const lang = modalLangCode.value.trim();
      const file = modalFileInput.files[0];
      if (!name || !lang || !file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid JSON');

          projects[name] = {
            projectName: name,
            langCode: lang,
            originalStrings: data,
            translations: {}
          };
          persistProjects();
          currentProjectKey = name;
          localStorage.setItem('lastProject', currentProjectKey);
          keysList = Object.keys(data);
          updateProjectSelect();
          updateInfo();
          renderKeys();
          translationArea.value = '';
          originalEl.value = '';
          translationArea.disabled = true;
          selectedKey = null;
          updateNavButtons();
          downloadBtn.disabled = true;
          projectModal.classList.add('hidden');
        } catch {
          alert('Invalid JSON file. Please upload a valid en.json file.');
        }
      };
      reader.readAsText(file);
    });

    downloadBtn.addEventListener('click', () => {
      if (!currentProjectKey) return;
      const p = projects[currentProjectKey];
      const result = {};

      // Merge translations with originals
      Object.keys(p.originalStrings).forEach(key => {
        result[key] = p.translations[key] && p.translations[key].trim() !== ''
          ? p.translations[key]
          : p.originalStrings[key];
      });

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.langCode}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    // Initialization
    updateProjectSelect();
    if (currentProjectKey && projects[currentProjectKey]) {
      projectSelect.value = currentProjectKey;
      keysList = Object.keys(projects[currentProjectKey].originalStrings);
      updateInfo();
      renderKeys();
      translationArea.disabled = true;
      selectedKey = null;
      updateNavButtons();
      downloadBtn.disabled = false;
    } else {
      projectSelect.value = '';
      translationArea.disabled = true;
      downloadBtn.disabled = true;
    }