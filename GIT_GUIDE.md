# Git Guide for Quran Recitation Project

## ✅ Initial Commit Complete!

Your project has been successfully committed to Git with all changes.

**Commit Details:**
- Commit Hash: `1a14df2`
- Files: 71 files added
- Lines: 31,027 insertions
- Branch: `main`

---

## 📋 Current Status

```bash
$ git status
On branch main
nothing to commit, working tree clean
```

Everything is committed! ✓

---

## 🔄 Future Git Workflow

### Making New Changes

When you make changes to files, follow these steps:

**1. Check What Changed**
```bash
cd /Users/moescomp/Desktop/Quran\ Recitation\ Project
git status
# Shows modified, added, or deleted files
```

**2. Review Changes**
```bash
# See what changed in all files
git diff

# See changes in specific file
git diff backend/app.py

# See staged changes
git diff --staged
```

**3. Stage Changes**
```bash
# Stage all changes
git add .

# Stage specific file
git add backend/app.py

# Stage multiple files
git add backend/app.py frontend/src/App.js

# Stage all files in a directory
git add backend/
```

**4. Commit Changes**
```bash
# Simple commit
git commit -m "fix: Fixed reciter audio loading issue"

# Detailed commit (opens editor)
git commit

# Multi-line commit
git commit -m "feat: Add new reciter to list

Added Saood Ash-Shuraym to available reciters.
Verified audio works on CDN.
Updated documentation."
```

---

## 📝 Commit Message Best Practices

### Format
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Examples

**Simple:**
```bash
git commit -m "fix: Audio not playing for Husary reciter"
```

**Detailed:**
```bash
git commit -m "feat: Add Riva server health check

Added /health endpoint to check Riva connection status.
Returns server status, model info, and language code.
Helps debug ASR connection issues."
```

**Multiple files:**
```bash
git commit -m "refactor: Improve error handling in backend

- Enhanced RivaClient error messages
- Added logging to streaming analyzer
- Fixed edge cases in audio validation
- Updated documentation"
```

---

## 🌿 Branching (For Future Use)

### Create and Switch to New Branch
```bash
# Create and switch to feature branch
git checkout -b feature/add-new-reciter

# Make changes...
# Commit changes...

# Switch back to main
git checkout main

# Merge feature branch
git merge feature/add-new-reciter

# Delete feature branch
git branch -d feature/add-new-reciter
```

### Common Branch Names
- `feature/add-something` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/improve-code` - Code improvements

---

## 🔍 Viewing History

### See Commit History
```bash
# Brief history
git log --oneline

# Last 5 commits
git log --oneline -5

# Detailed history
git log

# With file changes
git log --stat

# Graphical view
git log --graph --oneline --all
```

### View Specific Commit
```bash
# Show commit details
git show 1a14df2

# Show specific file in commit
git show 1a14df2:backend/app.py
```

---

## ↩️ Undoing Changes

### Before Staging
```bash
# Discard changes to file
git checkout -- backend/app.py

# Discard all changes
git checkout -- .
```

### After Staging
```bash
# Unstage file
git reset backend/app.py

# Unstage all
git reset
```

### After Committing
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit (add more changes)
git add forgotten-file.py
git commit --amend --no-edit
```

---

## 📤 Remote Repository (GitHub/GitLab)

### First Time Setup
```bash
# Add remote repository
git remote add origin https://github.com/yourusername/quran-recitation.git

# Push to remote
git push -u origin main
```

### Regular Push/Pull
```bash
# Push changes
git push

# Pull changes
git pull

# Force push (careful!)
git push --force
```

### Check Remote
```bash
# List remotes
git remote -v

# Change remote URL
git remote set-url origin https://new-url.git
```

---

## 🚨 Common Scenarios

### Scenario 1: Made changes, want to commit
```bash
git add .
git commit -m "feat: Description of changes"
```

### Scenario 2: Want to see what changed
```bash
git status
git diff
```

### Scenario 3: Made mistake, want to undo
```bash
# Before commit
git checkout -- .

# After commit
git reset --soft HEAD~1
```

### Scenario 4: Want to update from remote
```bash
git pull
# Resolve any conflicts
git add .
git commit -m "merge: Resolved conflicts"
```

### Scenario 5: Want to work on new feature safely
```bash
git checkout -b feature/my-feature
# Make changes...
git add .
git commit -m "feat: My feature"
git checkout main
git merge feature/my-feature
```

---

## 🎯 Quick Reference

### Daily Workflow
```bash
# 1. Check status
git status

# 2. Stage changes
git add .

# 3. Commit
git commit -m "type: description"

# 4. Push (if using remote)
git push
```

### See What Changed
```bash
git status          # Files changed
git diff            # Line-by-line changes
git log --oneline   # Commit history
```

### Undo Mistakes
```bash
git checkout -- file.py   # Discard file changes
git reset                 # Unstage all
git reset --soft HEAD~1   # Undo last commit
```

---

## 🔒 Important Files (.gitignore)

Your project already has a `.gitignore` file that excludes:
- `node_modules/` - Frontend dependencies
- `venv/`, `env/` - Python virtual environments
- `__pycache__/`, `*.pyc` - Python cache files
- `*.db` - SQLite database files
- `.env` - Environment secrets
- `.DS_Store` - Mac system files
- IDE files - `.vscode/`, `.idea/`

**Never commit:**
- API keys or passwords
- Large binary files (except your .nemo model which is already in)
- Generated files (can be rebuilt)
- Local configuration

---

## 📚 Useful Git Commands

### Information
```bash
git status              # Current state
git log                 # Commit history
git diff                # Show changes
git show <commit>       # Show commit details
git branch              # List branches
git remote -v           # List remotes
```

### Making Changes
```bash
git add <files>         # Stage changes
git commit -m "msg"     # Commit changes
git push                # Push to remote
git pull                # Pull from remote
```

### Branching
```bash
git branch <name>       # Create branch
git checkout <name>     # Switch branch
git checkout -b <name>  # Create and switch
git merge <branch>      # Merge branch
git branch -d <name>    # Delete branch
```

### Undoing
```bash
git checkout -- <file>  # Discard changes
git reset               # Unstage
git reset --soft HEAD~1 # Undo commit
git revert <commit>     # Create reverse commit
```

---

## 💡 Pro Tips

1. **Commit Often**: Small, focused commits are better than large ones
2. **Write Clear Messages**: Future you will thank you
3. **Use Branches**: Keep main stable, experiment in branches
4. **Pull Before Push**: Always sync before pushing to avoid conflicts
5. **Review Before Commit**: Use `git diff` to see what you're committing
6. **Don't Commit Secrets**: Use `.env` files and keep them in `.gitignore`

---

## 🆘 Need Help?

```bash
# Get help for any command
git help <command>
git help commit

# Quick help
git <command> --help
git commit --help
```

---

## ✅ Your Next Steps

1. **Continue Development**: Make changes to your files
2. **Test Changes**: Run the app and verify everything works
3. **Commit Changes**: Use the workflow above
4. **Optional**: Set up GitHub repo and push
5. **Keep Committing**: Regular commits help track progress

---

## 🎉 You're All Set!

Your project is now under version control. Every change you make can be:
- Tracked
- Reviewed
- Reverted if needed
- Shared with others

Happy coding! 🚀
