#!/usr/bin/env bash
# PostToolUse hook — ejecuta el spec asociado al archivo .ts recién modificado.
# Recibe JSON por stdin: { "tool_input": { "file_path": "..." } }
# Si los tests fallan, inyecta la salida al contexto del modelo.

set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

# Solo procesar archivos .ts que no sean specs ni declaraciones
if [[ -z "$FILE" ]] || [[ "$FILE" != *.ts ]] || [[ "$FILE" == *.spec.ts ]] || [[ "$FILE" == *.d.ts ]]; then
  exit 0
fi

SPEC="${FILE%.ts}.spec.ts"

# Nada que hacer si no existe el spec
if [[ ! -f "$SPEC" ]]; then
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "$FILE")"; git rev-parse --show-toplevel 2>/dev/null || echo ".")"

# Ejecutar solo el spec relacionado
# set -e se desactiva puntualmente para capturar output y exit code juntos
set +e
JEST_OUTPUT=$(cd "$REPO_ROOT" && npx jest "$SPEC" --no-coverage --passWithNoTests --forceExit 2>&1)
JEST_EXIT=$?
set -e

if [[ $JEST_EXIT -ne 0 ]]; then
  # Pasar el fallo al modelo para que pueda corregir
  jq -n --arg out "$JEST_OUTPUT" --arg spec "$SPEC" \
    '{
      "hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "additionalContext": ("Tests fallaron en " + $spec + ":\n\n" + $out)
      }
    }'
fi

# Siempre exit 0 — no bloquear el flujo, los tests son informativos
exit 0
