/**
 * Go & Rust Ecosystem Diagnostic Rules
 */
export function runGoRustRules(stackNames, files) {
  const diagnostics = [];
  const fileNames = new Set(files.map(f => f.path.toLowerCase()));

  // ================= GO ECOSYSTEM =================
  const isGoProject = stackNames.has('go') || stackNames.has('golang') || fileNames.has('go.mod') || Array.from(fileNames).some(f => f.endsWith('.go'));

  if (isGoProject) {
    // GO-01: Missing go.mod
    if (!fileNames.has('go.mod')) {
      diagnostics.push({
        id: 'GO-01',
        title: 'Missing go.mod File',
        description: 'Go code detected but no go.mod module definition found. Initialize with "go mod init <module>".',
        severity: 'error',
        category: 'Go',
        file: 'go.mod'
      });
    }

    // GO-02: Missing go.sum lockfile
    if (fileNames.has('go.mod') && !fileNames.has('go.sum')) {
      diagnostics.push({
        id: 'GO-02',
        title: 'Missing go.sum Lockfile',
        description: 'go.mod exists but go.sum checksum lockfile is missing. Run "go mod tidy" to verify dependency hashes.',
        severity: 'warning',
        category: 'Go',
        file: 'go.sum'
      });
    }
  }

  // ================= RUST ECOSYSTEM =================
  const isRustProject = stackNames.has('rust') || fileNames.has('cargo.toml') || Array.from(fileNames).some(f => f.endsWith('.rs'));

  if (isRustProject) {
    // RUST-01: Missing Cargo.toml
    if (!fileNames.has('cargo.toml')) {
      diagnostics.push({
        id: 'RUST-01',
        title: 'Missing Cargo.toml File',
        description: 'Rust files detected but no Cargo.toml manifest exists. Initialize crate with "cargo init".',
        severity: 'error',
        category: 'Rust',
        file: 'Cargo.toml'
      });
    }

    // RUST-02: Missing Cargo.lock lockfile
    if (fileNames.has('cargo.toml') && !fileNames.has('cargo.lock')) {
      diagnostics.push({
        id: 'RUST-02',
        title: 'Missing Cargo.lock Lockfile',
        description: 'Cargo.toml manifest exists but Cargo.lock lockfile is missing. Build binary with "cargo build" to generate lockfile.',
        severity: 'warning',
        category: 'Rust',
        file: 'Cargo.lock'
      });
    }
  }

  return diagnostics;
}
