#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHELL_DIR="${SCRIPT_DIR}/scripts/shell"

show_menu() {
    cat <<EOF
Egirls Crypto Banhammer Bot — Script Menu

  1) deploy         Fetch + reset, then run update script
  2) update         Git pull, run compose script
  3) compose        Build image and restart container
  4) pull-data      Pull data from production server
  5) run-local      Run bot locally with npm

Usage:
  ./bot.sh          Show this menu
  ./bot.sh <num>    Run script by number
  ./bot.sh <name>   Run script by name (e.g. ./bot.sh compose)

EOF
}

run_compose() { bash "${SHELL_DIR}/compose.sh" "$@"; }
run_deploy()  { bash "${SHELL_DIR}/deploy.sh" "$@"; }
run_update()  { bash "${SHELL_DIR}/update.sh" "$@"; }
run_pull()    { bash "${SHELL_DIR}/pull-data.sh" "$@"; }
run_local()   { bash "${SHELL_DIR}/run-local.sh" "$@"; }

# No args -> show menu
if [[ $# -eq 0 ]]; then
    show_menu
    read -rp "Select [1-5]: " choice
    set -- "$choice"
fi

case "${1}" in
    1|deploy)       run_deploy "${@:2}" ;;
    2|update)       run_update "${@:2}" ;;
    3|compose)      run_compose "${@:2}" ;;
    4|pull-data)    run_pull "${@:2}" ;;
    5|run-local)    run_local "${@:2}" ;;
    *)
        echo "Unknown command: ${1}"
        echo "Run './bot.sh' for usage."
        exit 1
        ;;
esac
