#!/bin/bash

# Quick Test Runner Script for Backend Tests
# Usage: ./run_tests.sh [options]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================  ${NC}"
echo -e "${BLUE}  Todo List Backend Test Suite Runner${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${YELLOW}pytest not found. Installing dependencies...${NC}"
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
fi

# Default: Run all tests with coverage
if [ $# -eq 0 ]; then
    echo -e "${GREEN}Running all tests with coverage...${NC}"
    pytest tests/ -v --cov=app --cov-report=term-missing --cov-report=html
    echo ""
    echo -e "${GREEN}✅ Test run complete!${NC}"
    echo -e "${BLUE}📊 Coverage report: open htmlcov/index.html${NC}"
    exit 0
fi

# Handle command line arguments
case "$1" in
    "quick"|"-q")
        echo -e "${GREEN}Running quick tests (no coverage)...${NC}"
        pytest tests/ -v
        ;;
    "list"|"-l")
        echo -e "${GREEN}Running Todo List CRUD tests...${NC}"
        pytest tests/test_list_crud.py -v
        ;;
    "todo"|"-t")
        echo -e "${GREEN}Running Todo Item CRUD tests...${NC}"
        pytest tests/test_todo_crud.py -v
        ;;
    "permission"|"-p")
        echo -e "${GREEN}Running Permission CRUD tests...${NC}"
        pytest tests/test_permission_crud.py -v
        ;;
    "coverage"|"-c")
        echo -e "${GREEN}Running tests with detailed coverage...${NC}"
        pytest tests/ -v --cov=app --cov-report=term-missing:skip-covered --cov-report=html
        echo ""
        echo -e "${BLUE}📊 Open htmlcov/index.html to view coverage${NC}"
        ;;
    "watch"|"-w")
        echo -e "${GREEN}Running tests in watch mode...${NC}"
        pytest-watch tests/
        ;;
    "failed"|"-f")
        echo -e "${GREEN}Re-running only failed tests...${NC}"
        pytest tests/ --lf -v
        ;;
    "help"|"-h")
        echo "Usage: ./run_tests.sh [option]"
        echo ""
        echo "Options:"
        echo "  (none)         Run all tests with coverage report"
        echo "  quick, -q      Run all tests without coverage (fastest)"
        echo "  list, -l       Run only Todo List CRUD tests"
        echo "  todo, -t       Run only Todo Item CRUD tests"
        echo "  permission, -p Run only Permission CRUD tests"
        echo "  coverage, -c   Run with detailed coverage report"
        echo "  watch, -w      Run tests in watch mode (requires pytest-watch)"
        echo "  failed, -f     Re-run only failed tests"
        echo "  help, -h       Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh              # Run all tests with coverage"
        echo "  ./run_tests.sh quick        # Quick test run"
        echo "  ./run_tests.sh list         # Test only list operations"
        echo "  ./run_tests.sh coverage     # Detailed coverage report"
        ;;
    *)
        echo -e "${YELLOW}Unknown option: $1${NC}"
        echo "Use './run_tests.sh help' for usage information"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Done!${NC}"
