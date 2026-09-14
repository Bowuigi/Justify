/^export (type|interface)/ {
  typedefs[$3] = FILENAME
}

END {
  for (def in typedefs)
    printf "export type { %s } from \"%s\";\n", def, typedefs[def]
}
