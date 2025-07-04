#!/bin/bash

# Test Automation Script for Mobile API Control Pattern
# This bash script provides a wrapper around the Node.js test automation script
# and handles server startup, configuration, and cleanup

set -e  # Exit on any error

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
USERNAME="${USERNAME:-api_user}"
PASSWORD="${PASSWORD:-mobile_api_password}"
SCREENSHOT_DIR="${SCREENSHOT_DIR:-$PROJECT_DIR/test-screenshots}"
REPORT_DIR="${REPORT_DIR:-$PROJECT_DIR/test-reports}"
CONFIG_FILE="${CONFIG_FILE:-$SCRIPT_DIR/test-automation.config}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display help
show_help() {
    cat << EOF
Mobile API Control Pattern - Test Automation Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -u, --url URL           API base URL (default: http://localhost:8080)
    -c, --config FILE       Configuration file path
    -s, --start-server      Start the embedded server before running tests
    -k, --kill-server       Kill any existing server before starting
    -w, --wait SECONDS      Wait time for server startup (default: 30)
    -o, --output DIR        Output directory for reports and screenshots
    -f, --format FORMAT     Screenshot format: png, jpg (default: png)
    -q, --quality QUALITY   Screenshot quality 0.1-1.0 (default: 0.9)
    -v, --verbose           Enable verbose logging
    -d, --dry-run           Show what would be executed without running tests

EXAMPLES:
    $0                      Run tests with default configuration
    $0 -s                   Start server and run tests
    $0 -u http://localhost:3000 -s    Run tests on custom port
    $0 -c custom.config     Use custom configuration file
    $0 -o /tmp/test-output  Save results to custom directory

ENVIRONMENT VARIABLES:
    API_BASE_URL           API server base URL
    USERNAME               API authentication username
    PASSWORD               API authentication password
    SCREENSHOT_DIR         Directory for screenshot output
    REPORT_DIR             Directory for report output
    CONFIG_FILE            Path to configuration file

EOF
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check for required commands
    local deps=("node" "npm" "curl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            print_error "Required dependency '$dep' is not installed"
            exit 1
        fi
    done
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
        print_error "Not in a valid Mobile API project directory"
        exit 1
    fi
    
    # Check if node_modules exists
    if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
        print_warning "node_modules not found, running npm install..."
        cd "$PROJECT_DIR"
        npm install
    fi
    
    print_success "All dependencies satisfied"
}

# Function to kill existing servers
kill_existing_servers() {
    print_status "Checking for existing servers on port 8080..."
    
    # Find and kill processes using port 8080
    local pids=$(lsof -t -i:8080 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        print_warning "Found existing server processes, killing them..."
        echo "$pids" | xargs -r kill -9
        sleep 2
    fi
}

# Function to start the embedded server
start_server() {
    print_status "Starting embedded server..."
    
    cd "$PROJECT_DIR"
    
    # Create or update .env file
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        print_status "Created .env file from template"
    fi
    
    # Start server in background using the demo script
    if [[ -f "demo.js" ]]; then
        node demo.js &
        SERVER_PID=$!
        print_status "Server started with PID: $SERVER_PID"
    else
        print_error "demo.js not found, cannot start server"
        exit 1
    fi
    
    # Wait for server to be ready
    print_status "Waiting for server to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f "$API_BASE_URL/health" > /dev/null 2>&1; then
            print_success "Server is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    print_error "Server failed to start within timeout"
    cleanup_server
    exit 1
}

# Function to cleanup server
cleanup_server() {
    if [[ -n "$SERVER_PID" ]]; then
        print_status "Stopping server (PID: $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    
    # Also kill any remaining processes on port 8080
    local pids=$(lsof -t -i:8080 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        echo "$pids" | xargs -r kill -9 2>/dev/null || true
    fi
}

# Function to run the test automation
run_tests() {
    print_status "Running test automation..."
    
    # Set environment variables
    export API_BASE_URL
    export USERNAME
    export PASSWORD
    export SCREENSHOT_DIR
    export REPORT_DIR
    
    # Run the Node.js test script
    cd "$PROJECT_DIR"
    node "$SCRIPT_DIR/test-automation.js"
}

# Function to generate curl examples
generate_curl_examples() {
    cat << EOF

📋 Manual cURL Examples:

# Health Check
curl -X GET $API_BASE_URL/health

# Login (get token)
curl -X POST $API_BASE_URL/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"$USERNAME","password":"$PASSWORD"}'

# Get State (requires token)
curl -X GET $API_BASE_URL/api/state \\
  -H "Authorization: Bearer <token>"

# Update State (requires token)
curl -X POST $API_BASE_URL/api/state \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"path":"ui.controls.living_room_light.state","value":"on"}'

# Execute Action (requires token)
curl -X POST $API_BASE_URL/api/actions/toggle \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"target":"living_room_light","payload":{"state":"on"}}'

# Capture Screenshot (requires token)
curl -X GET $API_BASE_URL/api/screenshot \\
  -H "Authorization: Bearer <token>" \\
  -o screenshot.png

EOF
}

# Parse command line arguments
START_SERVER=false
KILL_SERVER=false
VERBOSE=false
DRY_RUN=false
WAIT_TIME=30

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            API_BASE_URL="$2"
            shift 2
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -s|--start-server)
            START_SERVER=true
            shift
            ;;
        -k|--kill-server)
            KILL_SERVER=true
            shift
            ;;
        -w|--wait)
            WAIT_TIME="$2"
            shift 2
            ;;
        -o|--output)
            SCREENSHOT_DIR="$2/screenshots"
            REPORT_DIR="$2/reports"
            shift 2
            ;;
        -f|--format)
            SCREENSHOT_FORMAT="$2"
            shift 2
            ;;
        -q|--quality)
            SCREENSHOT_QUALITY="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --curl-examples)
            generate_curl_examples
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    # Trap to ensure cleanup
    trap cleanup_server EXIT
    
    print_status "Mobile API Control Pattern - Test Automation"
    print_status "============================================"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "DRY RUN MODE - No tests will be executed"
        print_status "Configuration:"
        print_status "  API URL: $API_BASE_URL"
        print_status "  Username: $USERNAME"
        print_status "  Screenshot Dir: $SCREENSHOT_DIR"
        print_status "  Report Dir: $REPORT_DIR"
        print_status "  Start Server: $START_SERVER"
        print_status "  Kill Existing: $KILL_SERVER"
        exit 0
    fi
    
    # Load configuration file if it exists
    if [[ -f "$CONFIG_FILE" ]]; then
        print_status "Loading configuration from: $CONFIG_FILE"
        source "$CONFIG_FILE"
    fi
    
    # Check dependencies
    check_dependencies
    
    # Kill existing servers if requested
    if [[ "$KILL_SERVER" == "true" ]]; then
        kill_existing_servers
    fi
    
    # Start server if requested
    if [[ "$START_SERVER" == "true" ]]; then
        start_server
        sleep 2  # Give server a moment to fully initialize
    fi
    
    # Run the tests
    run_tests
    
    print_success "Test automation completed!"
    print_status "Results saved to:"
    print_status "  Screenshots: $SCREENSHOT_DIR"
    print_status "  Reports: $REPORT_DIR"
}

# Execute main function
main "$@"