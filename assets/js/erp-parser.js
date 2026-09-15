/**
 * College ERP Attendance Parser for AyushGangster
 * Supports:
 * 1. Summary tables (e.g. Present, OD, Makeup, Absent, Percentage)
 * 2. Summary tables (e.g. Subject, Conducted, Attended, %)
 * 3. Class-by-class session logs (e.g. Date, Time, Hours, Marked P/A)
 * 4. Excel (.xlsx, .xls) and CSV files
 */

const ErpParser = (function () {
  'use strict';

  // Sample report provided by user for instant 1-click loading
  const RAW_USER_SAMPLE_REPORT = `Attendance Report

#	Subject Code	Subject	Subject Type	Present	OD	Makeup	Absent	Percentage
1	CIUL301	Data Structures and Algorithms	Lecture	18	0	1	6	79.17
2	CIUL302	Electronic System for IoT	Lecture	18	0	1	5	82.61
3	CIUL303	Software Engineering and Project Management	Lecture	20	1	0	4	84.00
4	CIUL304	Digital Electronics	Lecture	14	1	0	8	65.22
5	CIUP320	Data Structures and Algorithms Lab	Lab	22	0	0	8	73.33
6	CIUP321	Programming in Java Lab	Lab	24	0	0	8	75.00
7	CIUP322	Electronic System for IoT Lab	Lab	21	0	0	3	87.50
8	CIUP323	Digital Electronics Lab	Lab	15	3	0	6	75.00
9	CIUT330	Industrial Training	Lab	2	0	0	6	25.00
10	HSUL301	Managerial Economics and Financial Accounting	Lecture	6	0	1	1	100.00
11	MAUL301	Statistics and Probability Theory	Lecture	15	1	0	6	72.73
12	NU99.5	Soft Skills Training	Lab	2	0	0	4	33.33`;

  /**
   * Parse raw pasted text into subjects array
   * @param {string} rawText 
   * @param {boolean} countByHours - For session logs, whether to use 'Number of Hours'
   * @returns {{success: boolean, subjects: Array, totalRows?: number, type?: string, error?: string}}
   */
  function parsePastedReport(rawText, countByHours = true) {
    if (!rawText || !rawText.trim()) {
      return { success: false, error: "Pasted text is empty. Please paste your attendance table." };
    }

    // Clean up lines and strip non-table trailing text if appended to the end of a line
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return { success: false, error: "No valid rows found in pasted text." };
    }

    // Determine delimiter
    const sampleLine = lines.find(l => l.includes('\t') || l.includes(',') || l.split(/\s{2,}/).length > 2) || lines[0];
    let delimiter = '\t';
    if (sampleLine.includes('\t')) {
      delimiter = '\t';
    } else if (sampleLine.includes(',')) {
      delimiter = ',';
    } else {
      delimiter = /\s{2,}|\t/;
    }

    // Find table header row
    let headerIdx = -1;
    let headers = [];
    for (let i = 0; i < Math.min(lines.length, 25); i++) {
      const parts = lines[i].split(delimiter).map(c => c.trim().toLowerCase());
      const hasSubject = parts.some(p => /subject|course|paper|code/i.test(p));
      const hasMetric = parts.some(p => /present|attended|absent|marked|percentage|%|held|conducted|hours|od|makeup/i.test(p));
      if (hasSubject && hasMetric) {
        headerIdx = i;
        headers = parts;
        break;
      }
    }

    if (headerIdx === -1) {
      // Fallback: test if line 0 has columns
      const parts0 = lines[0].split(delimiter).map(c => c.trim().toLowerCase());
      if (parts0.length >= 3) {
        headerIdx = 0;
        headers = parts0;
      } else {
        return {
          success: false,
          error: "Could not identify table header columns. Please ensure your report includes Subject, Present/Attended, and Percentage/Total."
        };
      }
    }

    // Identify which type of table this is:
    // A) Class-by-Class session log: has date, time, and Marked P/A
    // B) Summary table: has Present, OD, Makeup, Absent, Percentage, or Conducted/Attended
    const headerStr = headers.join(' ').toLowerCase();
    const hasMarkedCol = /marked|status|p\/a/.test(headerStr);
    const hasDateCol = /date|time/.test(headerStr);
    const hasPresentCol = /present|absent|percentage|%|held|conducted/.test(headerStr);

    const isClassLog = (hasMarkedCol && hasDateCol) || (hasDateCol && !hasPresentCol);

    if (isClassLog) {
      return parseClassByClassLog(lines, headerIdx, delimiter, headers, countByHours);
    } else {
      return parseSummaryTable(lines, headerIdx, delimiter, headers);
    }
  }

  /**
   * Parses summary tables (like Present, OD, Makeup, Absent, Percentage)
   */
  function parseSummaryTable(lines, headerIdx, delimiter, headers) {
    let colCode = -1;
    let colSubject = -1;
    let colType = -1;
    let colFaculty = -1;
    let colPresent = -1;
    let colOD = -1;
    let colMakeup = -1;
    let colAttended = -1;
    let colAbsent = -1;
    let colHeld = -1;
    let colPercent = -1;

    headers.forEach((h, idx) => {
      const clean = h.trim().toLowerCase().replace(/[\r\n\t_]+/g, ' ');
      if (colCode === -1 && /\b(subject\s*code|course\s*code|sub\s*code|code)\b/i.test(clean)) colCode = idx;
      else if (colSubject === -1 && /\b(subject|course|paper|title|name)\b/i.test(clean) && !/code|type/i.test(clean)) colSubject = idx;
      else if (colType === -1 && /\b(type|subject\s*type)\b/i.test(clean)) colType = idx;
      else if (colFaculty === -1 && /\b(faculty|teacher|prof)\b/i.test(clean)) colFaculty = idx;
      else if (colPresent === -1 && /\b(present|pres)\b/i.test(clean)) colPresent = idx;
      else if (colOD === -1 && /\b(od|on\s*duty|duty)\b/i.test(clean)) colOD = idx;
      else if (colMakeup === -1 && /\b(makeup|make\s*up|mu)\b/i.test(clean)) colMakeup = idx;
      else if (colAttended === -1 && /\b(attended|total\s*attended|att)\b/i.test(clean)) colAttended = idx;
      else if (colAbsent === -1 && /\b(absent|abs)\b/i.test(clean)) colAbsent = idx;
      else if (colHeld === -1 && /\b(held|conducted|delivered|total\s*classes|total\s*held|max\s*classes|total)\b/i.test(clean)) colHeld = idx;
      else if (colPercent === -1 && /\b(percentage|percent|att\s*%|%)\b/i.test(clean)) colPercent = idx;
    });

    // Fallbacks if columns weren't detected
    if (colSubject === -1 && colCode !== -1 && headers.length > colCode + 1) colSubject = colCode + 1;
    if (colCode === -1 && colSubject > 1) colCode = colSubject - 1;

    const subjects = [];
    const ignoredKeywords = /^(total|grand total|average|avg|summary|overall|signature|attendance report)/i;

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const cells = line.split(delimiter).map(c => c.trim());
      if (cells.length < 2) continue;

      let code = colCode !== -1 && cells[colCode] ? cells[colCode] : '';
      let name = colSubject !== -1 && cells[colSubject] ? cells[colSubject] : '';

      // If code was not found or is purely numeric row number e.g. "1"
      if (/^\d+$/.test(code) && cells.length > colCode + 1) {
        code = cells[colCode + 1];
        if (cells.length > colCode + 2 && !name) name = cells[colCode + 2];
      }

      if (!name && code) name = code;
      if (!name || ignoredKeywords.test(name) || ignoredKeywords.test(code)) continue;

      // Extract numeric values safely
      const present = colPresent !== -1 ? parseFirstNumber(cells[colPresent]) : 0;
      const od = colOD !== -1 ? parseFirstNumber(cells[colOD]) : 0;
      const makeup = colMakeup !== -1 ? parseFirstNumber(cells[colMakeup]) : 0;
      const absent = colAbsent !== -1 ? parseFirstNumber(cells[colAbsent]) : 0;
      const pct = colPercent !== -1 ? parseFirstFloat(cells[colPercent]) : 0;
      const heldExplicit = colHeld !== -1 ? parseFirstNumber(cells[colHeld]) : 0;
      const attendedExplicit = colAttended !== -1 ? parseFirstNumber(cells[colAttended]) : 0;

      // Compute Attended
      let attended = 0;
      if (colAttended !== -1 && attendedExplicit > 0) {
        attended = attendedExplicit;
        if (colOD !== -1) attended += od;
        if (colMakeup !== -1) attended += makeup;
      } else if (colPresent !== -1) {
        attended = present + od + makeup;
      }

      // Compute Held (Total Conducted)
      let held = 0;
      if (colHeld !== -1 && heldExplicit > 0) {
        held = heldExplicit;
      } else if (pct > 0 && attended > 0) {
        // Precise formula: Held = Math.round((Attended / Pct) * 100)
        held = Math.round((attended / pct) * 100);
      } else if (colAbsent !== -1 && (attended > 0 || absent > 0)) {
        held = attended + absent;
      } else if (pct > 0) {
        held = Math.round(pct);
      }

      // If held is still 0, try searching all numeric cells in row
      if (held === 0 && attended === 0) {
        const nums = cells.map(c => parseFirstNumber(c)).filter(n => n > 0);
        if (nums.length >= 2) {
          attended = nums[0];
          held = nums[1];
        }
      }

      if (held <= 0 && attended <= 0) continue;
      if (attended > held) held = attended;

      subjects.push({
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        code: sanitizeCode(code) || generateShortCode(name),
        name: sanitizeName(name),
        type: (colType !== -1 && cells[colType]) ? cells[colType] : '',
        faculty: (colFaculty !== -1 && cells[colFaculty]) ? cells[colFaculty] : '',
        attended: attended,
        held: held
      });
    }

    if (subjects.length === 0) {
      return {
        success: false,
        error: "Could not extract subjects from the summary table. Please check the columns."
      };
    }

    return {
      success: true,
      subjects: subjects,
      totalRows: subjects.length,
      type: "summary"
    };
  }

  /**
   * Parses class-by-class session logs
   */
  function parseClassByClassLog(lines, headerIdx, delimiter, headers, countByHours) {
    let colCode = -1;
    let colSubject = -1;
    let colType = -1;
    let colFaculty = -1;
    let colHours = -1;
    let colMarked = -1;

    headers.forEach((h, idx) => {
      const clean = h.trim().toLowerCase().replace(/[\r\n\t_]+/g, ' ');
      if (colCode === -1 && /code/i.test(clean)) colCode = idx;
      else if (colSubject === -1 && /subject|course|paper|title/i.test(clean)) colSubject = idx;
      else if (colType === -1 && /type/i.test(clean)) colType = idx;
      else if (colFaculty === -1 && /faculty|teacher|prof/i.test(clean)) colFaculty = idx;
      else if (colHours === -1 && /hour|hrs?|credit|duration/i.test(clean)) colHours = idx;
      else if (colMarked === -1 && /marked|status|p\/a|attend(?!ed)/i.test(clean)) colMarked = idx;
    });

    if (colSubject === -1 && colCode !== -1 && headers.length > colCode + 1) colSubject = colCode + 1;
    if (colCode === -1 && colSubject > 1) colCode = colSubject - 1;

    const subjectMap = {};
    let validRowHits = 0;

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const cells = line.split(delimiter).map(c => c.trim());
      if (cells.length < 3) continue;

      let code = colCode !== -1 && cells[colCode] ? cells[colCode] : '';
      let name = colSubject !== -1 && cells[colSubject] ? cells[colSubject] : '';

      if (/^\d+$/.test(code) && cells.length > colCode + 1) {
        code = cells[colCode + 1];
        if (cells.length > colCode + 2 && !name) name = cells[colCode + 2];
      }

      if (!name && code) name = code;
      if (!name) continue;

      let hours = 1;
      if (countByHours) {
        if (colHours !== -1 && cells[colHours]) {
          const parsedH = parseFirstNumber(cells[colHours]);
          if (parsedH > 0) hours = parsedH;
        }
      }

      let marked = '';
      if (colMarked !== -1 && cells[colMarked]) {
        marked = cells[colMarked].trim().toUpperCase();
      } else {
        const lastCell = cells[cells.length - 1].trim().toUpperCase();
        if (/^(P|PRESENT|A|ABSENT|OD|L|MAKEUP)$/i.test(lastCell)) {
          marked = lastCell;
        }
      }

      if (!marked) {
        for (let c = cells.length - 1; c >= 0; c--) {
          const val = cells[c].trim().toUpperCase();
          if (/^(P|PRESENT|A|ABSENT|OD|L|MAKEUP)$/i.test(val)) {
            marked = val;
            break;
          }
        }
      }

      if (!marked) continue;

      validRowHits++;
      const isPresent = /^(P|PRESENT|OD|MAKEUP|DUTY)$/i.test(marked);
      const groupKey = (code || name).toUpperCase();

      if (!subjectMap[groupKey]) {
        subjectMap[groupKey] = {
          id: 'sub_' + Math.random().toString(36).substr(2, 9),
          code: sanitizeCode(code),
          name: sanitizeName(name),
          type: (colType !== -1 && cells[colType]) ? cells[colType] : '',
          faculty: (colFaculty !== -1 && cells[colFaculty]) ? cells[colFaculty] : '',
          attended: 0,
          held: 0
        };
      }

      subjectMap[groupKey].held += hours;
      if (isPresent) {
        subjectMap[groupKey].attended += hours;
      }
    }

    const subjects = Object.values(subjectMap);
    if (subjects.length === 0 || validRowHits === 0) {
      return {
        success: false,
        error: "Could not find valid class records with P/A status."
      };
    }

    return {
      success: true,
      subjects: subjects,
      totalRows: validRowHits,
      type: "class-by-class"
    };
  }

  async function parseFile(file, countByHours = true) {
    try {
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        return parsePastedReport(text, countByHours);
      }

      const buffer = await file.arrayBuffer();
      if (!window.XLSX) {
        throw new Error("Excel parser (SheetJS) is not loaded.");
      }

      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("The Excel file has no sheets.");
      }

      const targetSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(targetSheet);
      return parsePastedReport(csv, countByHours);
    } catch (err) {
      console.error("File parse error:", err);
      return {
        success: false,
        error: err.message || "Failed to parse file."
      };
    }
  }

  function parseFirstNumber(str) {
    if (!str) return 0;
    const match = String(str).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function parseFirstFloat(str) {
    if (!str) return 0;
    const match = String(str).match(/[0-9]+(?:\.[0-9]+)?/);
    return match ? parseFloat(match[0]) : 0;
  }

  function sanitizeName(name) {
    return String(name || '')
      .replace(/^[\s\-_.:#\d]+/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function sanitizeCode(code) {
    return String(code || '')
      .replace(/[^A-Za-z0-9._-]/g, '')
      .trim();
  }

  function generateShortCode(name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 6).toUpperCase();
    return parts.slice(0, 3).map(p => p[0]).join('').toUpperCase() + '101';
  }

  function getRawUserSampleReport() {
    return RAW_USER_SAMPLE_REPORT;
  }

  return {
    parsePastedReport: parsePastedReport,
    parseFile: parseFile,
    getRawUserSampleReport: getRawUserSampleReport
  };
})();

window.ErpParser = ErpParser;
