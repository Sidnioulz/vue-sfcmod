#!/usr/bin/env bash

# Usage: codemod.sh <Path to transform> <Path(s) to files to modify>

printError() {
  printf "\033[0;31merror\033[0m $1\n" >&2
  exit 1
}

if [ "$#" -eq 0 ]; then
  printError "Usage:\n\n\tpnpm example [example name] [options]\n"
fi

# Sanitise transform arg
transformPath="${1}"
if [ ! -f "$transformPath" ]; then
  if [ -f "examples/${transformPath}/transformation.cjs" ]; then
    transformPath="examples/${transformPath}/transformation.cjs"
  else
    printError "Example not found: $transformPath"
  fi
fi

inputPaths="examples/$1/Input.*"

pnpm cli $inputPaths -t $transformPath ${@:2}
pnpm format:staged $inputPaths
git diff $inputPaths
