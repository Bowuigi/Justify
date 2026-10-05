/^export (type|interface)/ {
  typedefs[gensub(/^([a-zA-Z0-9_]+).*$/, "\\1", 1, $3)] = FILENAME
}

END {
  for (def in typedefs)
    printf "export type { %s } from \"%s\";\n", def, typedefs[def]
}
