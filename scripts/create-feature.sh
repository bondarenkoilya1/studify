#!/bin/zsh

if [ -z "$1" ]; then
  echo "Using: ./create-feature.sh <name>"
  exit 1
fi

DIR="../frontend/src/features"
NAME=$(basename "$1")

mkdir -p "$DIR/$1"/{api,model,ui}

touch "$DIR/$1/index.ts"
touch "$DIR/$1/api/$NAME.ts"