#!/bin/bash
# Database Migration Helper Script for VoseMovies Backend
# Wraps Alembic commands for easier database migration management

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/api"

# Activate virtual environment
if [ -f "../venv/bin/activate" ]; then
    source ../venv/bin/activate
else
    echo "❌ Virtual environment not found. Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Parse command
COMMAND="${1:-help}"

case "$COMMAND" in
    "upgrade")
        echo "📊 Applying database migrations..."
        alembic upgrade head
        echo "✅ Migrations applied successfully"
        ;;

    "downgrade")
        STEPS="${2:-1}"
        echo "⏪ Reverting $STEPS migration(s)..."
        alembic downgrade -$STEPS
        echo "✅ Migrations reverted"
        ;;

    "history")
        echo "📜 Migration history:"
        alembic history
        ;;

    "current")
        echo "📍 Current migration:"
        alembic current
        ;;

    "create")
        if [ -z "$2" ]; then
            echo "❌ Please provide a migration message"
            echo "Usage: ./migrate.sh create \"your message here\""
            exit 1
        fi
        echo "🔨 Creating new migration: $2"
        alembic revision --autogenerate -m "$2"
        echo "✅ Migration created in api/alembic/versions/"
        ;;

    "stamp")
        REVISION="${2:-head}"
        echo "🏷️  Stamping database with revision: $REVISION"
        alembic stamp $REVISION
        echo "✅ Database stamped"
        ;;

    "reset")
        echo "⚠️  WARNING: This will reset the database and reapply all migrations"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "🗑️  Downgrading to base..."
            alembic downgrade base
            echo "📊 Applying all migrations..."
            alembic upgrade head
            echo "✅ Database reset complete"
        else
            echo "❌ Reset cancelled"
        fi
        ;;

    "help"|*)
        echo "VoseMovies Database Migration Helper"
        echo "======================================"
        echo ""
        echo "Usage: ./migrate.sh <command> [options]"
        echo ""
        echo "Commands:"
        echo "  upgrade              Apply all pending migrations"
        echo "  downgrade [steps]    Revert migrations (default: 1 step)"
        echo "  history              Show migration history"
        echo "  current              Show current migration state"
        echo "  create \"message\"     Create new migration with autogenerate"
        echo "  stamp [revision]     Mark database as being at a specific revision"
        echo "  reset                Reset database and reapply all migrations"
        echo "  help                 Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./migrate.sh upgrade                        # Apply all migrations"
        echo "  ./migrate.sh create \"add user table\"       # Create new migration"
        echo "  ./migrate.sh downgrade 2                    # Revert last 2 migrations"
        echo "  ./migrate.sh history                        # Show migration history"
        echo ""
        ;;
esac
