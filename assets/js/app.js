/**
 * AyushGangster - Attendance & Bunk Simulator Web App
 * Core Application Engine with Direct Copy-Paste ERP Analysis
 */

(function () {
  'use strict';

  // LocalStorage keys
  const STORAGE_KEY_SUBJECTS = 'ayush_gangster_subjects_v2';
  const STORAGE_KEY_TARGET = 'ayush_gangster_target_v2';
  const STORAGE_KEY_COUNT_HOURS = 'ayush_gangster_count_hours_v2';

  // App State
  const state = {
    target: 75,
    countByHours: true,
    subjects: [],
    filter: 'all', // 'all' | 'safe' | 'danger'
    searchQuery: '',
    sortBy: 'default', // 'default' | 'asc' | 'desc' | 'name'
    globalSimAttend: 0,
    globalSimMiss: 0,
    editingSubjectId: null,
    totalRecordsProcessed: 0
  };

  // DOM Elements cache
  let dom = {};

  document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    loadState();
    bindEvents();
    renderAll();
  });

  function cacheDom() {
    dom = {
      targetSlider: document.getElementById('targetSlider'),
      targetDisplay: document.getElementById('targetDisplay'),
      targetPresetButtons: document.querySelectorAll('.target-preset-btn'),
      
      // Aggregate stats
      aggregatePercentText: document.getElementById('aggregatePercentText'),
      aggregateBasePercentText: document.getElementById('aggregateBasePercentText'),
      aggregateCircle: document.getElementById('aggregateCircle'),
      aggregateStatusBadge: document.getElementById('aggregateStatusBadge'),
      aggregateBunkPlanText: document.getElementById('aggregateBunkPlanText'),
      aggregateAttendedCount: document.getElementById('aggregateAttendedCount'),
      aggregateHeldCount: document.getElementById('aggregateHeldCount'),
      safeSubjectsCount: document.getElementById('safeSubjectsCount'),
      dangerSubjectsCount: document.getElementById('dangerSubjectsCount'),
      
      // Global simulator
      simAttendInput: document.getElementById('simAttendInput'),
      simMissInput: document.getElementById('simMissInput'),
      btnSimAttendPlus: document.getElementById('btnSimAttendPlus'),
      btnSimAttendMinus: document.getElementById('btnSimAttendMinus'),
      btnSimMissPlus: document.getElementById('btnSimMissPlus'),
      btnSimMissMinus: document.getElementById('btnSimMissMinus'),
      btnResetSim: document.getElementById('btnResetSim'),
      simDeltaIndicator: document.getElementById('simDeltaIndicator'),

      // Subjects List
      subjectsContainer: document.getElementById('subjectsContainer'),
      emptyState: document.getElementById('emptyState'),
      searchInput: document.getElementById('searchInput'),
      filterTabs: document.querySelectorAll('.filter-tab'),
      sortSelect: document.getElementById('sortSelect'),
      subjectCountBadge: document.getElementById('subjectCountBadge'),

      // Direct Copy-Paste Section
      pasteTextarea: document.getElementById('pasteTextarea'),
      btnAnalyzePaste: document.getElementById('btnAnalyzePaste'),
      btnLoadAyushReport: document.getElementById('btnLoadAyushReport'),
      btnClearPaste: document.getElementById('btnClearPaste'),
      countByHoursCheckbox: document.getElementById('countByHoursCheckbox'),
      pasteStatusBadge: document.getElementById('pasteStatusBadge'),

      // File upload fallback
      toggleUploadBox: document.getElementById('toggleUploadBox'),
      uploadBoxContent: document.getElementById('uploadBoxContent'),
      dropzone: document.getElementById('dropzone'),
      fileInput: document.getElementById('fileInput'),
      btnBrowseFile: document.getElementById('btnBrowseFile'),

      // Header & Misc buttons
      btnClearAll: document.getElementById('btnClearAll'),
      btnExportReport: document.getElementById('btnExportReport'),

      // Modal
      subjectModal: document.getElementById('subjectModal'),
      modalTitle: document.getElementById('modalTitle'),
      subjectForm: document.getElementById('subjectForm'),
      inputSubCode: document.getElementById('inputSubCode'),
      inputSubName: document.getElementById('inputSubName'),
      inputSubAttended: document.getElementById('inputSubAttended'),
      inputSubHeld: document.getElementById('inputSubHeld'),
      btnOpenAddModal: document.getElementById('btnOpenAddModal'),
      btnCloseModal: document.getElementById('btnCloseModal'),
      btnCancelModal: document.getElementById('btnCancelModal'),

      // Mobile Sticky Footer
      mobileAggregateText: document.getElementById('mobileAggregateText'),
      mobileStatusBadge: document.getElementById('mobileStatusBadge'),
      mobileQuickPlan: document.getElementById('mobileQuickPlan'),

      // Toast
      toast: document.getElementById('toast'),
      toastMessage: document.getElementById('toastMessage')
    };
  }

  function loadState() {
    try {
      const savedTarget = localStorage.getItem(STORAGE_KEY_TARGET);
      if (savedTarget) {
        state.target = parseFloat(savedTarget) || 75;
      }
      if (dom.targetSlider) dom.targetSlider.value = state.target;
      if (dom.targetDisplay) dom.targetDisplay.innerText = state.target + '%';

      const savedCountHours = localStorage.getItem(STORAGE_KEY_COUNT_HOURS);
      if (savedCountHours !== null) {
        state.countByHours = savedCountHours === 'true';
      }
      if (dom.countByHoursCheckbox) dom.countByHoursCheckbox.checked = state.countByHours;

      const savedSubs = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      if (savedSubs) {
        const parsed = JSON.parse(savedSubs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.subjects = parsed.map(s => ({
            ...s,
            simAttendedDiff: 0,
            simHeldDiff: 0
          }));
          return;
        }
      }

      // Default: parse and load the user's authentic 183-row report
      loadDefaultUserReport();

    } catch (e) {
      console.warn("Using default user report", e);
      loadDefaultUserReport();
    }
  }

  function loadDefaultUserReport() {
    if (window.ErpParser && window.ErpParser.getRawUserSampleReport) {
      const raw = window.ErpParser.getRawUserSampleReport();
      const res = window.ErpParser.parsePastedReport(raw, state.countByHours);
      if (res.success) {
        state.subjects = res.subjects.map(s => ({
          ...s,
          simAttendedDiff: 0,
          simHeldDiff: 0
        }));
        state.totalRecordsProcessed = res.totalRows || 183;
        saveSubjects();
        if (dom.pasteTextarea) {
          dom.pasteTextarea.value = raw;
        }
        if (dom.pasteStatusBadge) {
          dom.pasteStatusBadge.innerText = `Analyzed 183 attendance records across 12 subjects`;
        }
      }
    }
  }

  function saveSubjects() {
    try {
      const toSave = state.subjects.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        type: s.type || '',
        faculty: s.faculty || '',
        attended: s.attended,
        held: s.held
      }));
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  function saveTarget() {
    try {
      localStorage.setItem(STORAGE_KEY_TARGET, state.target.toString());
    } catch (e) {
      console.error("Failed to save target", e);
    }
  }

  // Mathematical Calculations
  function calculateSubjectStats(attended, held, target) {
    held = Math.max(0, held);
    attended = Math.max(0, Math.min(attended, held));

    const percent = held > 0 ? (attended / held) * 100 : 0;
    const isSafe = percent >= target;
    const t = target / 100;

    let safeBunks = 0;
    let neededToAttend = 0;

    if (isSafe) {
      if (t > 0) {
        safeBunks = Math.floor((attended - t * held) / t);
        if (safeBunks < 0) safeBunks = 0;
      }
    } else {
      if (t < 1) {
        neededToAttend = Math.ceil((t * held - attended) / (1 - t));
        if (neededToAttend < 0) neededToAttend = 0;
      } else {
        neededToAttend = 999;
      }
    }

    const nextAttendPercent = held > 0 ? ((attended + 1) / (held + 1)) * 100 : 100;
    const nextBunkPercent = (held + 1) > 0 ? (attended / (held + 1)) * 100 : 0;

    return {
      percent: percent,
      formattedPercent: percent.toFixed(2),
      isSafe: isSafe,
      safeBunks: safeBunks,
      neededToAttend: neededToAttend,
      nextAttendPercent: nextAttendPercent.toFixed(1),
      nextBunkPercent: nextBunkPercent.toFixed(1)
    };
  }

  function calculateAggregateStats() {
    let baseAttended = 0;
    let baseHeld = 0;
    let simAttended = 0;
    let simHeld = 0;

    let safeCount = 0;
    let dangerCount = 0;

    state.subjects.forEach(sub => {
      baseAttended += sub.attended;
      baseHeld += sub.held;

      const effAttended = sub.attended + (sub.simAttendedDiff || 0);
      const effHeld = sub.held + (sub.simHeldDiff || 0);

      simAttended += effAttended;
      simHeld += effHeld;

      const subStats = calculateSubjectStats(effAttended, effHeld, state.target);
      if (subStats.isSafe) {
        safeCount++;
      } else {
        dangerCount++;
      }
    });

    // Add global simulator classes
    simAttended += state.globalSimAttend;
    simHeld += state.globalSimAttend + state.globalSimMiss;

    const basePercent = baseHeld > 0 ? (baseAttended / baseHeld) * 100 : 0;
    const currentPercent = simHeld > 0 ? (simAttended / simHeld) * 100 : 0;
    const isSafe = currentPercent >= state.target;
    const t = state.target / 100;

    let safeBunks = 0;
    let neededToAttend = 0;

    if (isSafe) {
      if (t > 0) {
        safeBunks = Math.floor((simAttended - t * simHeld) / t);
        if (safeBunks < 0) safeBunks = 0;
      }
    } else {
      if (t < 1) {
        neededToAttend = Math.ceil((t * simHeld - simAttended) / (1 - t));
        if (neededToAttend < 0) neededToAttend = 0;
      }
    }

    const delta = currentPercent - basePercent;

    return {
      basePercent: basePercent,
      currentPercent: currentPercent,
      delta: delta,
      isSafe: isSafe,
      safeBunks: safeBunks,
      neededToAttend: neededToAttend,
      totalAttended: simAttended,
      totalHeld: simHeld,
      baseAttended: baseAttended,
      baseHeld: baseHeld,
      safeCount: safeCount,
      dangerCount: dangerCount
    };
  }

  // Rendering
  function renderAll() {
    renderAggregate();
    renderSubjects();
    renderGlobalSimulatorUI();
  }

  function renderAggregate() {
    const agg = calculateAggregateStats();

    if (dom.aggregatePercentText) {
      dom.aggregatePercentText.innerText = agg.currentPercent.toFixed(2) + '%';
    }
    if (dom.mobileAggregateText) {
      dom.mobileAggregateText.innerText = agg.currentPercent.toFixed(1) + '%';
    }

    const hasSimulation = state.globalSimAttend > 0 || state.globalSimMiss > 0 || state.subjects.some(s => s.simHeldDiff !== 0);
    if (dom.aggregateBasePercentText) {
      if (hasSimulation) {
        const sign = agg.delta >= 0 ? '+' : '';
        dom.aggregateBasePercentText.innerHTML = `Base: <span class="text-slate-300 font-semibold">${agg.basePercent.toFixed(1)}%</span> (<span class="${agg.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">${sign}${agg.delta.toFixed(2)}%</span>)`;
      } else {
        dom.aggregateBasePercentText.innerText = `Target: ${state.target}% required`;
      }
    }

    // Radial Progress Meter SVG
    if (dom.aggregateCircle) {
      const radius = 62;
      const circumference = 2 * Math.PI * radius;
      dom.aggregateCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      const clampedPct = Math.min(100, Math.max(0, agg.currentPercent));
      const offset = circumference - (clampedPct / 100) * circumference;
      dom.aggregateCircle.style.strokeDashoffset = offset;

      if (agg.isSafe) {
        dom.aggregateCircle.style.stroke = '#10b981';
        dom.aggregateCircle.style.filter = 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))';
      } else {
        dom.aggregateCircle.style.stroke = '#f43f5e';
        dom.aggregateCircle.style.filter = 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.6))';
      }
    }

    // Status Badges
    if (dom.aggregateStatusBadge) {
      if (agg.isSafe) {
        dom.aggregateStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-safe flex items-center gap-1.5 shadow-sm';
        dom.aggregateStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Safe Zone (&ge; ${state.target}%)`;
      } else {
        dom.aggregateStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-danger flex items-center gap-1.5 shadow-sm';
        dom.aggregateStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span> Shortage Alert (&lt; ${state.target}%)`;
      }
    }

    if (dom.mobileStatusBadge) {
      if (agg.isSafe) {
        dom.mobileStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold badge-safe';
        dom.mobileStatusBadge.innerText = 'Safe Zone';
      } else {
        dom.mobileStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold badge-danger';
        dom.mobileStatusBadge.innerText = 'Shortage';
      }
    }

    // Dynamic Plan Alert
    if (dom.aggregateBunkPlanText) {
      if (agg.isSafe) {
        if (agg.safeBunks > 0) {
          dom.aggregateBunkPlanText.innerHTML = `
            <div class="flex items-center gap-2 text-emerald-400 font-semibold">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Chill Zone! You can safely bunk <span class="underline decoration-emerald-400 decoration-2 font-black text-white text-base">${agg.safeBunks}</span> class${agg.safeBunks > 1 ? 'es/hours' : ''} in total without dropping below ${state.target}%.</span>
            </div>
          `;
        } else {
          dom.aggregateBunkPlanText.innerHTML = `
            <div class="flex items-center gap-2 text-amber-300 font-semibold">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span>On the margin! You are right at ${state.target}%. If you miss even 1 class, your aggregate drops into shortage.</span>
            </div>
          `;
        }
      } else {
        dom.aggregateBunkPlanText.innerHTML = `
          <div class="flex items-center gap-2 text-rose-400 font-semibold">
            <svg class="w-5 h-5 flex-shrink-0 text-rose-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Detention Risk! You must attend the next <span class="underline decoration-rose-500 decoration-2 font-black text-white text-base">${agg.neededToAttend}</span> consecutive class${agg.neededToAttend > 1 ? 'es/hours' : ''} to reach ${state.target}%.</span>
          </div>
        `;
      }
    }

    if (dom.mobileQuickPlan) {
      if (agg.isSafe) {
        dom.mobileQuickPlan.innerText = agg.safeBunks > 0 ? `Can bunk ${agg.safeBunks} class${agg.safeBunks > 1 ? 'es' : ''}` : `Borderline ${state.target}%`;
      } else {
        dom.mobileQuickPlan.innerText = `Need +${agg.neededToAttend} classes to reach 75%`;
      }
    }

    if (dom.aggregateAttendedCount) dom.aggregateAttendedCount.innerText = agg.totalAttended;
    if (dom.aggregateHeldCount) dom.aggregateHeldCount.innerText = agg.totalHeld;
    if (dom.safeSubjectsCount) dom.safeSubjectsCount.innerText = agg.safeCount;
    if (dom.dangerSubjectsCount) dom.dangerSubjectsCount.innerText = agg.dangerCount;
  }

  function renderGlobalSimulatorUI() {
    if (dom.simAttendInput) dom.simAttendInput.value = state.globalSimAttend;
    if (dom.simMissInput) dom.simMissInput.value = state.globalSimMiss;

    const agg = calculateAggregateStats();
    if (dom.simDeltaIndicator) {
      if (state.globalSimAttend === 0 && state.globalSimMiss === 0) {
        dom.simDeltaIndicator.innerHTML = `<span class="text-slate-400 text-xs">Simulate upcoming classes to project aggregate %</span>`;
      } else {
        const sign = agg.delta >= 0 ? '+' : '';
        const color = agg.delta >= 0 ? 'text-emerald-400' : 'text-rose-400';
        dom.simDeltaIndicator.innerHTML = `
          <div class="flex items-center gap-2 text-xs font-medium">
            <span class="text-slate-300">Projected: <strong class="text-white font-bold text-sm">${agg.currentPercent.toFixed(2)}%</strong></span>
            <span class="${color} font-bold px-2 py-0.5 rounded bg-white/5">(${sign}${agg.delta.toFixed(2)}%)</span>
          </div>
        `;
      }
    }
  }

  function renderSubjects() {
    if (!dom.subjectsContainer) return;

    let filtered = state.subjects.filter(sub => {
      const q = state.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const effAttended = sub.attended + (sub.simAttendedDiff || 0);
      const effHeld = sub.held + (sub.simHeldDiff || 0);
      const stats = calculateSubjectStats(effAttended, effHeld, state.target);

      if (state.filter === 'safe') return stats.isSafe;
      if (state.filter === 'danger') return !stats.isSafe;
      return true;
    });

    // Sorting
    if (state.sortBy === 'asc') {
      filtered.sort((a, b) => {
        const pA = a.held > 0 ? (a.attended + a.simAttendedDiff) / (a.held + a.simHeldDiff) : 0;
        const pB = b.held > 0 ? (b.attended + b.simAttendedDiff) / (b.held + b.simHeldDiff) : 0;
        return pA - pB;
      });
    } else if (state.sortBy === 'desc') {
      filtered.sort((a, b) => {
        const pA = a.held > 0 ? (a.attended + a.simAttendedDiff) / (a.held + a.simHeldDiff) : 0;
        const pB = b.held > 0 ? (b.attended + b.simAttendedDiff) / (b.held + b.simHeldDiff) : 0;
        return pB - pA;
      });
    } else if (state.sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (dom.subjectCountBadge) {
      dom.subjectCountBadge.innerText = `${filtered.length} of ${state.subjects.length} Subjects`;
    }

    if (filtered.length === 0) {
      dom.subjectsContainer.innerHTML = '';
      if (dom.emptyState) dom.emptyState.classList.remove('hidden');
      return;
    } else {
      if (dom.emptyState) dom.emptyState.classList.add('hidden');
    }

    let html = '';
    filtered.forEach(sub => {
      const effAttended = sub.attended + (sub.simAttendedDiff || 0);
      const effHeld = sub.held + (sub.simHeldDiff || 0);
      const stats = calculateSubjectStats(effAttended, effHeld, state.target);
      const isSimulated = sub.simHeldDiff !== 0;

      // Color scheme classes: Green for Safe (>=75%), Red for Danger (<75%)
      const cardClass = stats.isSafe ? 'card-safe' : 'card-danger';
      const progressBg = stats.isSafe ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-red-500';
      const percentColor = stats.isSafe ? 'text-emerald-400' : 'text-rose-400';

      let statusPillHtml = '';
      if (stats.isSafe) {
        statusPillHtml = `
          <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/25">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>Can Bunk <strong class="text-white">${stats.safeBunks}</strong> Class${stats.safeBunks !== 1 ? 'es' : ''}</span>
          </div>
        `;
      } else {
        statusPillHtml = `
          <div class="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/25 animate-pulse">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>Must Attend <strong class="text-white">${stats.neededToAttend}</strong> More</span>
          </div>
        `;
      }

      let simBadge = '';
      if (isSimulated) {
        simBadge = `
          <div class="flex items-center justify-between text-[11px] px-2 py-1 mb-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              Simulated: +${sub.simAttendedDiff} att / +${sub.simHeldDiff - sub.simAttendedDiff} bunk
            </span>
            <button data-action="reset-sub-sim" data-id="${sub.id}" class="hover:underline font-bold text-amber-200 ml-2">Reset</button>
          </div>
        `;
      }

      html += `
        <div class="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${cardClass}">
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 px-2 py-0.5 rounded bg-white/10 border border-white/15">
                    ${escapeHtml(sub.code || 'COURSE')}
                  </span>
                  ${sub.type ? `<span class="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">${escapeHtml(sub.type)}</span>` : ''}
                </div>
                <h3 class="font-bold text-base sm:text-lg text-white truncate mt-1.5" title="${escapeHtml(sub.name)}">
                  ${escapeHtml(sub.name)}
                </h3>
                ${sub.faculty ? `<p class="text-[11px] text-slate-400 truncate">Faculty: ${escapeHtml(sub.faculty)}</p>` : ''}
              </div>

              <!-- Edit & Delete -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button data-action="edit-sub" data-id="${sub.id}" title="Edit Subject" class="btn-action p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button data-action="delete-sub" data-id="${sub.id}" title="Delete Subject" class="btn-action p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>

            ${simBadge}

            <!-- Percentage Display & Stats -->
            <div class="flex items-baseline justify-between mt-3 mb-2">
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl sm:text-3xl font-black ${percentColor} tracking-tight">
                  ${stats.formattedPercent}%
                </span>
                <span class="text-xs text-slate-400">
                  (${effAttended}/${effHeld})
                </span>
              </div>
              <div>
                ${statusPillHtml}
              </div>
            </div>

            <!-- Progress Bar with 75% tick marker -->
            <div class="w-full bg-slate-800/80 rounded-full h-2.5 mb-3 overflow-hidden border border-white/5 relative">
              <div class="h-2.5 rounded-full progress-bar-fill ${progressBg}" style="width: ${Math.min(100, Math.max(0, stats.percent))}%"></div>
              <div class="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-sm pointer-events-none" style="left: ${state.target}%;" title="Target: ${state.target}%"></div>
            </div>

            <!-- Next Class Impact Helper -->
            <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4 bg-black/25 p-2 rounded-xl border border-white/5">
              <div class="flex flex-col">
                <span class="text-slate-500">If you attend next:</span>
                <span class="font-bold text-emerald-400 text-xs">↗ ${stats.nextAttendPercent}%</span>
              </div>
              <div class="flex flex-col text-right">
                <span class="text-slate-500">If you miss next:</span>
                <span class="font-bold text-rose-400 text-xs">↘ ${stats.nextBunkPercent}%</span>
              </div>
            </div>
          </div>

          <!-- Individual What-If Simulation Buttons -->
          <div class="pt-3 border-t border-white/10 mt-1">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span class="font-semibold text-slate-300">Quick Simulation:</span>
              <span class="text-[10px] text-slate-500">Test impact</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-2 py-1">
                <span class="text-xs font-bold text-emerald-400">Attend</span>
                <div class="flex items-center gap-1">
                  <button data-action="sub-sim-attend-minus" data-id="${sub.id}" class="btn-action w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center hover:bg-emerald-500/30 text-xs font-black disabled:opacity-30" ${sub.simAttendedDiff <= 0 ? 'disabled' : ''}>-</button>
                  <span class="text-xs font-mono font-bold text-white px-1">${sub.simAttendedDiff > 0 ? '+' + sub.simAttendedDiff : '0'}</span>
                  <button data-action="sub-sim-attend-plus" data-id="${sub.id}" class="btn-action w-6 h-6 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center hover:bg-emerald-500/50 text-xs font-black">+</button>
                </div>
              </div>

              <div class="flex items-center justify-between bg-rose-500/10 border border-rose-500/25 rounded-xl px-2 py-1">
                <span class="text-xs font-bold text-rose-400">Bunk</span>
                <div class="flex items-center gap-1">
                  <button data-action="sub-sim-bunk-minus" data-id="${sub.id}" class="btn-action w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center hover:bg-rose-500/30 text-xs font-black disabled:opacity-30" ${(sub.simHeldDiff - sub.simAttendedDiff) <= 0 ? 'disabled' : ''}>-</button>
                  <span class="text-xs font-mono font-bold text-white px-1">${(sub.simHeldDiff - sub.simAttendedDiff) > 0 ? '+' + (sub.simHeldDiff - sub.simAttendedDiff) : '0'}</span>
                  <button data-action="sub-sim-bunk-plus" data-id="${sub.id}" class="btn-action w-6 h-6 rounded-lg bg-rose-500/30 text-rose-300 flex items-center justify-center hover:bg-rose-500/50 text-xs font-black">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    dom.subjectsContainer.innerHTML = html;
  }

  // Event Listeners
  function bindEvents() {
    // Target Slider
    if (dom.targetSlider) {
      dom.targetSlider.addEventListener('input', (e) => {
        state.target = parseFloat(e.target.value) || 75;
        if (dom.targetDisplay) dom.targetDisplay.innerText = state.target + '%';
        saveTarget();
        renderAll();
      });
    }

    // Target Presets
    if (dom.targetPresetButtons) {
      dom.targetPresetButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const val = parseFloat(e.target.dataset.target);
          if (!isNaN(val)) {
            state.target = val;
            if (dom.targetSlider) dom.targetSlider.value = val;
            if (dom.targetDisplay) dom.targetDisplay.innerText = val + '%';
            saveTarget();
            renderAll();
            showToast(`Target adjusted to ${val}%`);
          }
        });
      });
    }

    // Direct Copy-Paste Analysis
    if (dom.btnAnalyzePaste) {
      dom.btnAnalyzePaste.addEventListener('click', handleAnalyzePastedText);
    }

    if (dom.btnLoadAyushReport) {
      dom.btnLoadAyushReport.addEventListener('click', () => {
        const raw = window.ErpParser.getRawUserSampleReport();
        if (dom.pasteTextarea) dom.pasteTextarea.value = raw;
        handleAnalyzePastedText();
      });
    }

    if (dom.btnClearPaste) {
      dom.btnClearPaste.addEventListener('click', () => {
        if (dom.pasteTextarea) dom.pasteTextarea.value = '';
        if (dom.pasteStatusBadge) dom.pasteStatusBadge.innerText = '';
      });
    }

    if (dom.countByHoursCheckbox) {
      dom.countByHoursCheckbox.addEventListener('change', (e) => {
        state.countByHours = e.target.checked;
        localStorage.setItem(STORAGE_KEY_COUNT_HOURS, state.countByHours.toString());
        // If textarea has text, re-analyze
        if (dom.pasteTextarea && dom.pasteTextarea.value.trim()) {
          handleAnalyzePastedText();
        }
      });
    }

    // Toggle File Upload box
    if (dom.toggleUploadBox && dom.uploadBoxContent) {
      dom.toggleUploadBox.addEventListener('click', () => {
        dom.uploadBoxContent.classList.toggle('hidden');
      });
    }

    // Global Simulator Controls
    if (dom.btnSimAttendPlus) {
      dom.btnSimAttendPlus.addEventListener('click', () => {
        state.globalSimAttend++;
        renderAll();
      });
    }
    if (dom.btnSimAttendMinus) {
      dom.btnSimAttendMinus.addEventListener('click', () => {
        if (state.globalSimAttend > 0) {
          state.globalSimAttend--;
          renderAll();
        }
      });
    }
    if (dom.btnSimMissPlus) {
      dom.btnSimMissPlus.addEventListener('click', () => {
        state.globalSimMiss++;
        renderAll();
      });
    }
    if (dom.btnSimMissMinus) {
      dom.btnSimMissMinus.addEventListener('click', () => {
        if (state.globalSimMiss > 0) {
          state.globalSimMiss--;
          renderAll();
        }
      });
    }
    if (dom.btnResetSim) {
      dom.btnResetSim.addEventListener('click', () => {
        state.globalSimAttend = 0;
        state.globalSimMiss = 0;
        state.subjects.forEach(s => {
          s.simAttendedDiff = 0;
          s.simHeldDiff = 0;
        });
        renderAll();
        showToast('Simulation reset to actual attendance.');
      });
    }

    // Search & Filters
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderSubjects();
      });
    }

    if (dom.filterTabs) {
      dom.filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          dom.filterTabs.forEach(t => t.classList.remove('bg-white/15', 'text-white', 'border-white/20'));
          tab.classList.add('bg-white/15', 'text-white', 'border-white/20');
          state.filter = tab.dataset.filter || 'all';
          renderSubjects();
        });
      });
    }

    if (dom.sortSelect) {
      dom.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderSubjects();
      });
    }

    // Subject Card delegated actions
    if (dom.subjectsContainer) {
      dom.subjectsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const subId = btn.dataset.id;
        const sub = state.subjects.find(s => s.id === subId);
        if (!sub) return;

        switch (action) {
          case 'sub-sim-attend-plus':
            sub.simAttendedDiff = (sub.simAttendedDiff || 0) + 1;
            sub.simHeldDiff = (sub.simHeldDiff || 0) + 1;
            renderAll();
            break;

          case 'sub-sim-attend-minus':
            if (sub.simAttendedDiff > 0) {
              sub.simAttendedDiff--;
              sub.simHeldDiff--;
              renderAll();
            }
            break;

          case 'sub-sim-bunk-plus':
            sub.simHeldDiff = (sub.simHeldDiff || 0) + 1;
            renderAll();
            break;

          case 'sub-sim-bunk-minus':
            const currentBunks = (sub.simHeldDiff || 0) - (sub.simAttendedDiff || 0);
            if (currentBunks > 0) {
              sub.simHeldDiff--;
              renderAll();
            }
            break;

          case 'reset-sub-sim':
            sub.simAttendedDiff = 0;
            sub.simHeldDiff = 0;
            renderAll();
            break;

          case 'edit-sub':
            openEditModal(sub);
            break;

          case 'delete-sub':
            if (confirm(`Remove "${sub.name}" from your attendance list?`)) {
              state.subjects = state.subjects.filter(s => s.id !== subId);
              saveSubjects();
              renderAll();
              showToast(`Deleted ${sub.name}`);
            }
            break;
        }
      });
    }

    // Excel File Upload & Drag-and-Drop
    if (dom.btnBrowseFile && dom.fileInput) {
      dom.btnBrowseFile.addEventListener('click', () => dom.fileInput.click());
    }

    if (dom.fileInput) {
      dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleUploadedFile(e.target.files[0]);
          e.target.value = '';
        }
      });
    }

    if (dom.dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dom.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dom.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.dropzone.classList.remove('dragover');
        });
      });

      dom.dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
          handleUploadedFile(files[0]);
        }
      });
    }

    if (dom.btnClearAll) {
      dom.btnClearAll.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all subjects? This cannot be undone.")) {
          state.subjects = [];
          state.globalSimAttend = 0;
          state.globalSimMiss = 0;
          saveSubjects();
          renderAll();
          showToast('All subjects cleared.');
        }
      });
    }

    if (dom.btnExportReport) {
      dom.btnExportReport.addEventListener('click', exportAttendanceReport);
    }

    // Add / Edit Modal
    if (dom.btnOpenAddModal) {
      dom.btnOpenAddModal.addEventListener('click', openAddModal);
    }
    if (dom.btnCloseModal) {
      dom.btnCloseModal.addEventListener('click', closeModal);
    }
    if (dom.btnCancelModal) {
      dom.btnCancelModal.addEventListener('click', closeModal);
    }
    if (dom.subjectModal) {
      dom.subjectModal.addEventListener('click', (e) => {
        if (e.target === dom.subjectModal) closeModal();
      });
    }
    if (dom.subjectForm) {
      dom.subjectForm.addEventListener('submit', handleSubjectFormSubmit);
    }
  }

  // Handle Pasted Text Parsing
  function handleAnalyzePastedText() {
    const raw = dom.pasteTextarea ? dom.pasteTextarea.value.trim() : '';
    if (!raw) {
      alert("Please paste your attendance report into the box first.");
      return;
    }

    const res = window.ErpParser.parsePastedReport(raw, state.countByHours);
    if (!res.success) {
      alert("Attendance Parse Notice:\n" + (res.error || "Could not recognize the attendance records."));
      return;
    }

    state.subjects = res.subjects.map(s => ({
      ...s,
      simAttendedDiff: 0,
      simHeldDiff: 0
    }));
    state.globalSimAttend = 0;
    state.globalSimMiss = 0;
    state.totalRecordsProcessed = res.totalRows || 0;

    saveSubjects();
    renderAll();

    const agg = calculateAggregateStats();
    if (agg.isSafe && window.confetti) {
      window.confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }

    if (dom.pasteStatusBadge) {
      dom.pasteStatusBadge.innerText = `Analyzed ${res.totalRows || state.subjects.length} records across ${state.subjects.length} subjects!`;
    }

    showToast(`Calculated attendance for ${state.subjects.length} subjects!`, 4000);
  }

  // Handle Uploaded File
  async function handleUploadedFile(file) {
    if (!file) return;
    showToast("Analyzing file...", 2000);

    const res = await window.ErpParser.parseFile(file, state.countByHours);
    if (!res.success) {
      alert("File Parse Notice:\n" + (res.error || "Could not read attendance records."));
      return;
    }

    state.subjects = res.subjects.map(s => ({
      ...s,
      simAttendedDiff: 0,
      simHeldDiff: 0
    }));
    state.globalSimAttend = 0;
    state.globalSimMiss = 0;
    saveSubjects();
    renderAll();

    const agg = calculateAggregateStats();
    if (agg.isSafe && window.confetti) {
      window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    if (dom.pasteStatusBadge) {
      dom.pasteStatusBadge.innerText = `Imported from "${file.name}": ${state.subjects.length} subjects`;
    }

    showToast(`Imported ${state.subjects.length} subjects from ${file.name}!`, 4000);
  }

  // Add / Edit Modal
  function openAddModal() {
    state.editingSubjectId = null;
    if (dom.modalTitle) dom.modalTitle.innerText = "Add New Subject";
    if (dom.inputSubCode) dom.inputSubCode.value = "";
    if (dom.inputSubName) dom.inputSubName.value = "";
    if (dom.inputSubAttended) dom.inputSubAttended.value = "";
    if (dom.inputSubHeld) dom.inputSubHeld.value = "";
    if (dom.subjectModal) dom.subjectModal.classList.remove('hidden');
    if (dom.inputSubName) dom.inputSubName.focus();
  }

  function openEditModal(sub) {
    state.editingSubjectId = sub.id;
    if (dom.modalTitle) dom.modalTitle.innerText = "Edit Subject";
    if (dom.inputSubCode) dom.inputSubCode.value = sub.code || "";
    if (dom.inputSubName) dom.inputSubName.value = sub.name || "";
    if (dom.inputSubAttended) dom.inputSubAttended.value = sub.attended;
    if (dom.inputSubHeld) dom.inputSubHeld.value = sub.held;
    if (dom.subjectModal) dom.subjectModal.classList.remove('hidden');
    if (dom.inputSubAttended) dom.inputSubAttended.focus();
  }

  function closeModal() {
    if (dom.subjectModal) dom.subjectModal.classList.add('hidden');
    state.editingSubjectId = null;
  }

  function handleSubjectFormSubmit(e) {
    e.preventDefault();

    const name = (dom.inputSubName.value || '').trim();
    const code = (dom.inputSubCode.value || '').trim();
    let attended = parseInt(dom.inputSubAttended.value, 10);
    let held = parseInt(dom.inputSubHeld.value, 10);

    if (!name) {
      alert("Please enter a subject name.");
      return;
    }
    if (isNaN(held) || held < 0) {
      alert("Please enter a valid number of total classes held.");
      return;
    }
    if (isNaN(attended) || attended < 0) {
      alert("Please enter a valid number of attended classes.");
      return;
    }
    if (attended > held) {
      alert("Attended classes cannot be greater than total classes held.");
      return;
    }

    if (state.editingSubjectId) {
      const sub = state.subjects.find(s => s.id === state.editingSubjectId);
      if (sub) {
        sub.name = name;
        sub.code = code || (sub.name.slice(0, 3).toUpperCase() + '101');
        sub.attended = attended;
        sub.held = held;
        sub.simAttendedDiff = 0;
        sub.simHeldDiff = 0;
        showToast(`Updated ${sub.name}`);
      }
    } else {
      state.subjects.push({
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        name: name,
        code: code || (name.slice(0, 3).toUpperCase() + '101'),
        attended: attended,
        held: held,
        simAttendedDiff: 0,
        simHeldDiff: 0
      });
      showToast(`Added ${name}`);
    }

    saveSubjects();
    closeModal();
    renderAll();
  }

  // Export report to CSV
  function exportAttendanceReport() {
    if (state.subjects.length === 0) {
      alert("No subjects to export.");
      return;
    }

    const agg = calculateAggregateStats();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "AyushGangster Attendance Report\n";
    csvContent += `Target Percentage: ${state.target}%\n`;
    csvContent += `Overall Aggregate: ${agg.currentPercent.toFixed(2)}%\n`;
    csvContent += `Status: ${agg.isSafe ? 'Safe Zone' : 'Shortage Alert'}\n`;
    csvContent += `Total Attended: ${agg.totalAttended}, Total Held: ${agg.totalHeld}\n\n`;

    csvContent += "Subject Code,Subject Name,Classes Attended,Total Conducted,Percentage,Status,Bunk/Attend Recommendation\n";

    state.subjects.forEach(sub => {
      const stats = calculateSubjectStats(sub.attended, sub.held, state.target);
      const advice = stats.isSafe
        ? `Can safely bunk ${stats.safeBunks} classes`
        : `Must attend next ${stats.neededToAttend} consecutive classes`;

      csvContent += `"${sub.code}","${sub.name}",${sub.attended},${sub.held},"${stats.formattedPercent}%","${stats.isSafe ? 'Safe' : 'Shortage'}","${advice}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AyushGangster_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Report exported successfully!");
  }

  // Toast
  let toastTimeout;
  function showToast(msg, duration = 3000) {
    if (!dom.toast || !dom.toastMessage) return;
    dom.toastMessage.innerText = msg;
    dom.toast.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none');
    dom.toast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      dom.toast.classList.remove('opacity-100', 'translate-y-0');
      dom.toast.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
