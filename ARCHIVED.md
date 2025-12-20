# Archived Documentation Index

This document provides an index of all archived documentation from completed project phases. These archives are stored in the `delete/` directory to reduce token usage in active development sessions.

## Archive Directory Structure

```
delete/
├── backend-old-docs/          # Pre-November 2025 backend documentation
├── frontend-old-docs/         # Pre-November 2025 frontend documentation
└── build-debug-phase-2025-11/ # November 2025 APK build and debugging phase
```

## Current Archives

### Build & Debug Phase (Nov 2025)
**Location**: `delete/build-debug-phase-2025-11/`

Documentation from the APK build and debugging phase where we:
- Fixed backend connectivity issues (emulator vs physical device URLs)
- Implemented connection testing and error diagnostics
- Built and tested release APKs for Android
- Resolved map view crashes and caching issues

**Archived Files**:
- `BUILD_STATUS.md` (5.5KB) - Detailed build progress tracking with APK versions v0.1.1-v0.1.3
- `DEBUGGING_CHECKLIST.md` (4.4KB) - Data flow verification and testing procedures
- `ERROR_PREVENTION_SYSTEM.md` (5.3KB) - Connection test service and error handling documentation
- `APK_INSTALLATION_GUIDE.md` (6.2KB) - Complete APK installation and testing guide
- `QUICK_APK_SETUP.md` (3.0KB) - Quick 3-step APK testing setup

**When to Reference**:
- Troubleshooting APK build issues
- Setting up local APK testing environment
- Understanding the evolution of error handling system
- Debugging connection issues between app and backend

### Backend Old Docs
**Location**: `delete/backend-old-docs/`

Early backend documentation before the November 2025 reorganization:
- `ANALYSIS.md` - Initial architecture analysis
- `BACKEND_SETUP.md` - Original setup guide
- `DATABASE_SCHEMA.md` - Database design documentation
- `DEPLOYMENT.md` - Early deployment notes
- `FRONTEND_CHANGES.md` - Frontend integration notes
- `PHASE1_COMPLETE.md` - Phase 1 completion summary
- `PROJECT_STATUS.md` - Historical project status
- `README.md` - Original backend README

**When to Reference**:
- Understanding original design decisions
- Reviewing database schema evolution
- Historical project context

### Frontend Old Docs
**Location**: `delete/frontend-old-docs/`

Early frontend documentation:
- `README-DEV.md` - Original development README

**When to Reference**:
- Historical frontend setup information

## Archive Policy

### What Gets Archived
- Phase completion documentation after moving to next phase
- Detailed troubleshooting docs once issues are resolved and patterns are established
- Build-specific documentation after builds are finalized
- Historical status updates and progress tracking

### What Stays Active
- `CLAUDE.md` - Living project memory (current phase only)
- `SECURITY_SETUP.md` - Active security configuration
- `CORS_SECURITY.md` - Current CORS configuration
- `release-docs/` - Future release preparation docs
- Backend/Frontend setup guides in their respective directories

### When to Revisit Archives
- **Debugging similar issues**: Check archived debugging docs for patterns
- **Repeating a process**: APK builds, deployments, etc.
- **Understanding decisions**: Why things were done a certain way
- **Onboarding**: Complete project history for new developers

## Quick Access Commands

```bash
# List all archived documents
find delete/ -name "*.md" -type f

# Search archives for specific content
grep -r "keyword" delete/

# View a specific archived doc
cat "delete/build-debug-phase-2025-11/BUILD_STATUS.md"

# Check archive sizes
du -sh delete/*/
```

## Token Usage Savings

By archiving completed phase documentation:
- **Before**: ~40KB of build/debug docs in every Claude conversation
- **After**: ~1KB reference to ARCHIVED.md
- **Savings**: ~97% reduction for completed phases

The streamlined CLAUDE.md is now **~5KB** (down from **~14KB**), focusing only on current phase essentials.

---

**Archive Maintenance**: When a new phase completes, create a dated subdirectory in `delete/` and move completed phase docs there. Update this index with the new archive section.

**Last Updated**: 2025-12-03
