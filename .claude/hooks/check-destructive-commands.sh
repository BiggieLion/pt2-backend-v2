#!/usr/bin/env bash
# PreToolUse hook — bloquea comandos Bash destructivos antes de ejecutarlos.
# Recibe JSON por stdin: { "tool_name": "Bash", "tool_input": { "command": "..." } }
# Retorna JSON con continue=false si detecta un patron peligroso.

set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$CMD" ]]; then
  exit 0
fi

CMD_LOWER=$(echo "$CMD" | tr '[:upper:]' '[:lower:]')

block() {
  local reason="$1"
  jq -n --arg r "BLOQUEADO: $reason. Comando rechazado por el hook de seguridad. Si realmente necesitas ejecutarlo, solicita confirmacion explicita." \
    '{"continue": false, "stopReason": $r}'
  exit 0
}

# ─── Eliminacion de archivos ────────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qE 'rm\s+-[a-z]*r[a-z]*f|rm\s+-[a-z]*f[a-z]*r' \
  && block "Eliminacion recursiva forzada (rm -rf / rm -fr)"

# ─── SQL destructivo ────────────────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qiE 'drop\s+(table|database|schema|index|view|sequence)' \
  && block "Comando SQL destructivo: DROP object"

echo "$CMD_LOWER" | grep -qiE 'truncate\s+table' \
  && block "Comando SQL destructivo: TRUNCATE TABLE"

# ─── Git peligroso ──────────────────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qE 'git\s+push\s+.*(-f|--force)' \
  && block "Force push a repositorio remoto (git push --force)"

echo "$CMD_LOWER" | grep -qE 'git\s+reset\s+--hard' \
  && block "git reset --hard descarta cambios no confirmados"

echo "$CMD_LOWER" | grep -qE 'git\s+clean\s+-[a-z]*f' \
  && block "git clean -f elimina archivos no rastreados"

echo "$CMD_LOWER" | grep -qE 'git\s+branch\s+-D' \
  && block "Eliminacion forzada de rama local (git branch -D)"

# ─── Sistema de archivos / SO ───────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qE '\bmkfs\b' \
  && block "Formateo de sistema de archivos (mkfs)"

echo "$CMD_LOWER" | grep -qE '\bdd\s+if=' \
  && block "Escritura directa a disco (dd if=)"

echo "$CMD_LOWER" | grep -qE '\b(shutdown|reboot|halt|poweroff)\b' \
  && block "Comando de apagado/reinicio del sistema"

# ─── Procesos ───────────────────────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qE 'kill\s+-9\s+-1' \
  && block "Terminar todos los procesos del usuario (kill -9 -1)"

echo "$CMD_LOWER" | grep -qE 'killall\s+-9' \
  && block "Terminar todos los procesos con SIGKILL (killall -9)"

# ─── Permisos peligrosos ────────────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qE 'chmod\s+(-R\s+)?777\s+/' \
  && block "Permisos 777 recursivos sobre directorio raiz o del sistema"

# ─── Ejecucion remota sin inspeccion ────────────────────────────────────────
echo "$CMD_LOWER" | grep -qE '(curl|wget).*\|.*(bash|sh)' \
  && block "Ejecutar script remoto sin inspeccion (curl/wget | bash)"

# ─── Fork bomb ──────────────────────────────────────────────────────────────
echo "$CMD" | grep -qF ':(){ :|:' \
  && block "Fork bomb detectado"

# ─── Sobreescribir archivos criticos del sistema ────────────────────────────
echo "$CMD_LOWER" | grep -qE '>\s*/etc/(passwd|shadow|sudoers|hosts)' \
  && block "Sobreescritura de archivo critico del sistema (/etc/...)"

# ─── npm peligroso ──────────────────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qE 'npm\s+unpublish' \
  && block "Eliminar paquete del registro de npm (npm unpublish)"

# Comando seguro — permitir
exit 0
