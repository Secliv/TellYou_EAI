# Git Workflow Guide

## Repository
- **URL**: https://github.com/Secliv/Tellyou---EAI.git
- **Branch**: `main`

## Perintah Git Dasar

### Melihat Status
```bash
git status
```

### Menambahkan File
```bash
# Menambahkan semua file yang diubah
git add .

# Menambahkan file tertentu
git add <nama-file>
```

### Commit Perubahan
```bash
git commit -m "Deskripsi perubahan"
```

### Push ke GitHub
```bash
git push origin main
```

### Pull dari GitHub
```bash
git pull origin main
```

### Melihat History
```bash
git log
git log --oneline
```

## Workflow Standar

### 1. Update dari Remote
```bash
git pull origin main
```

### 2. Buat Perubahan
- Edit file yang diperlukan
- Test perubahan

### 3. Commit Perubahan
```bash
git add .
git commit -m "Deskripsi perubahan yang jelas"
```

### 4. Push ke GitHub
```bash
git push origin main
```

## Branch Management (Opsional)

### Membuat Branch Baru
```bash
git checkout -b feature/nama-fitur
```

### Pindah ke Branch
```bash
git checkout main
```

### Merge Branch
```bash
git checkout main
git merge feature/nama-fitur
```

## Troubleshooting

### Conflict saat Pull
```bash
# Pull dengan rebase
git pull --rebase origin main

# Atau resolve conflict manual, lalu:
git add .
git commit
```

### Undo Perubahan Lokal
```bash
# Undo perubahan yang belum di-add
git checkout -- <file>

# Undo semua perubahan
git checkout .
```

### Reset ke Commit Sebelumnya
```bash
# Soft reset (keep changes)
git reset --soft HEAD~1

# Hard reset (discard changes)
git reset --hard HEAD~1
```

## Best Practices

1. **Commit Message yang Jelas**
   - Gunakan format: "feat: tambah endpoint login" atau "fix: perbaiki bug payment"
   - Contoh prefix: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

2. **Commit Sering**
   - Commit perubahan kecil dan sering
   - Jangan commit banyak perubahan sekaligus

3. **Pull Sebelum Push**
   - Selalu pull sebelum push untuk menghindari conflict

4. **Jangan Commit File Sensitif**
   - Pastikan `.env` dan file sensitif lain ada di `.gitignore`

