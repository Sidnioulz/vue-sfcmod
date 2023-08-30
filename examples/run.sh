#!/usr/bin/env bash

# Usage: codemod.sh <Path to transform> <Path(s) to files to modify>

printError() {
  printf "\033[0;31merror\033[0m $1\n" >&2
  exit 1
}

if [ "$#" -eq 0 ]; then
  printError "Usage:\n\t${0} [Path to transformation] [Path to Vue files]\n\tor\n\t${0} [Example folder]"
fi

# Sanitise transform arg
transformPath="${1}"
if [ ! -f "$transformPath" ]; then
  if [ -f "examples/${transformPath}/transformation.cjs" ]; then
    transformPath="examples/${transformPath}/transformation.cjs"
  else
    printError "Transform not found: $transformPath"
  fi
fi

# Examples are used
if [ "$#" -eq 1 ] && [ -d "examples/$1" ]; then
  isExample=true
  inputPaths="examples/$1/Input.*"

# Paths to source files are used
else
  isExample=false
  # Compute all file paths. Vue-codemod doesn't honour --extensions
  # so we do it manually by only keeping js/vue files.
  allFiles=()
  for path in "${@:2}"
  do
    # https://stackoverflow.com/a/63969005
    IFS=$'\n'
    allFiles+=($(find $path -name "*vue"))
    unset IFS
  done

  inputPaths=$(printf '%q ' "${allFiles[@]}")
fi

yarn cli $inputPaths -t $transformPath
yarn format:staged $inputPaths
if [ isExample ]; then
  git diff $inputPaths
fi