#!/bin/bash

# Script to extract React components from generated.tsx and save them into proper files

set -e

INPUT_FILE="generated.tsx"
COMPONENTS_DIR="src/components/ui"
MODULES_DIR="src/components/modules"

mkdir -p "$COMPONENTS_DIR"
mkdir -p "$MODULES_DIR"

echo "🔍 Parsing $INPUT_FILE …"

current_file=""
current_lines=()

while IFS= read -r line || [[ -n "$line" ]]; do
    # Detect start of a component or module
    if [[ "$line" =~ "// GEN_COMPONENT_START:" ]]; then
        name=$(echo "$line" | sed -E 's/.*GEN_COMPONENT_START: *//')
        current_file="$COMPONENTS_DIR/$name.tsx"
        current_lines=("import React from 'react'")
        echo "📝 Extracting component: $name"
    elif [[ "$line" =~ "// GEN_MODULE_START:" ]]; then
        name=$(echo "$line" | sed -E 's/.*GEN_MODULE_START: *//')
        current_file="$MODULES_DIR/$name.tsx"
        current_lines=("import React from 'react'")
        echo "📝 Extracting module: $name"
    elif [[ "$line" =~ "// GEN_COMPONENT_END:" ]] || [[ "$line" =~ "// GEN_MODULE_END:" ]]; then
        if [[ -n "$current_file" ]]; then
            printf "%s\n" "${current_lines[@]}" > "$current_file"
            echo "✅ Wrote $current_file"
            current_file=""
            current_lines=()
        fi
    elif [[ -n "$current_file" ]]; then
        current_lines+=("$line")
    fi
done < "$INPUT_FILE"

echo "🎉 All components and modules extracted!"


#!/bin/bash

# Script to extract React components from generated.tsx and save them into proper files

set -e

INPUT_FILE="generated.tsx"
COMPONENTS_DIR="src/components/ui"
MODULES_DIR="src/components/modules"

mkdir -p "$COMPONENTS_DIR"
mkdir -p "$MODULES_DIR"

echo "🔍 Parsing $INPUT_FILE …"

current_file=""
current_lines=()

while IFS= read -r line || [[ -n "$line" ]]; do
    # Detect start of a component or module
    if [[ "$line" =~ "// GEN_COMPONENT_START:" ]]; then
        name=$(echo "$line" | sed -E 's/.*GEN_COMPONENT_START: *//')
        current_file="$COMPONENTS_DIR/$name.tsx"
        current_lines=("import React from 'react'")
        echo "📝 Extracting component: $name"
    elif [[ "$line" =~ "// GEN_MODULE_START:" ]]; then
        name=$(echo "$line" | sed -E 's/.*GEN_MODULE_START: *//')
        current_file="$MODULES_DIR/$name.tsx"
        current_lines=("import React from 'react'")
        echo "📝 Extracting module: $name"
    elif [[ "$line" =~ "// GEN_COMPONENT_END:" ]] || [[ "$line" =~ "// GEN_MODULE_END:" ]]; then
        if [[ -n "$current_file" ]]; then
            printf "%s\n" "${current_lines[@]}" > "$current_file"
            echo "✅ Wrote $current_file"
            current_file=""
            current_lines=()
        fi
    elif [[ -n "$current_file" ]]; then
        current_lines+=("$line")
    fi
done < "$INPUT_FILE"

echo "🎉 All components and modules extracted!"
