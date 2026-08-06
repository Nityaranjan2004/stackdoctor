/**
 * Python Ecosystem Diagnostic Rules
 */
export function runPythonRules(stackNames, dependencies, files) {
  const diagnostics = [];
  const fileNames = new Set(files.map(f => f.path.toLowerCase()));
  const depNames = new Set(dependencies.map(d => d.name.toLowerCase()));

  const isPythonProject = stackNames.has('python') || Array.from(fileNames).some(f => f.endsWith('.py')) || fileNames.has('requirements.txt') || fileNames.has('pyproject.toml');

  if (!isPythonProject) return diagnostics;

  // PY-01: Missing Python dependency file
  const hasDepFile = fileNames.has('requirements.txt') || fileNames.has('pyproject.toml') || fileNames.has('pipfile') || fileNames.has('setup.py');
  if (!hasDepFile) {
    diagnostics.push({
      id: 'PY-01',
      title: 'Missing Python Dependency File',
      description: 'Python files detected, but no requirements.txt, pyproject.toml, or Pipfile found at project root.',
      severity: 'warning',
      category: 'Python',
      file: 'requirements.txt'
    });
  }

  // PY-02: Missing virtual environment check / venv in .gitignore
  if (fileNames.has('requirements.txt')) {
    const reqFile = files.find(f => f.path.toLowerCase() === 'requirements.txt');
    if (reqFile && reqFile.content) {
      // PY-03: Unpinned dependencies check
      const lines = reqFile.content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      const unpinned = lines.filter(l => !l.includes('==') && !l.includes('>=') && !l.includes('~='));
      if (unpinned.length > 0) {
        diagnostics.push({
          id: 'PY-03',
          title: 'Unpinned Python Dependencies',
          description: `${unpinned.length} packages in requirements.txt have unpinned versions (missing ==). Pin exact versions for reproducible builds.`,
          severity: 'warning',
          category: 'Python',
          file: 'requirements.txt'
        });
      }
    }
  }

  // PY-04: Missing Python test suite
  const hasPyTest = fileNames.has('pytest.ini') || fileNames.has('conftest.py') || Array.from(fileNames).some(f => f.includes('test_') || f.endsWith('_test.py')) || depNames.has('pytest') || depNames.has('unittest');
  if (!hasPyTest) {
    diagnostics.push({
      id: 'PY-04',
      title: 'Missing Python Test Suite',
      description: 'No pytest or unittest files detected. Add automated unit tests to verify Python business logic.',
      severity: 'info',
      category: 'Python',
      file: null
    });
  }

  // PY-05: Missing Django secret key check if Django is used
  if (depNames.has('django') || stackNames.has('django')) {
    if (!fileNames.has('manage.py')) {
      diagnostics.push({
        id: 'PY-05',
        title: 'Django Project Missing manage.py',
        description: 'Django framework is detected in dependencies, but manage.py runner script is missing from root directory.',
        severity: 'error',
        category: 'Python',
        file: 'manage.py'
      });
    }
  }

  return diagnostics;
}
