BEGIN {
  on_enum = 0
  handled = 0
}

/\}/ {
  if (on_enum) {
    on_enum = 0
    print ";"
    handled = 1
  }
}

/enum/ {
  on_enum = 1
  print gensub(/^export enum ([^ ]+) \{$/, "export type \\1 =", 1, $0)
  handled = 1
}

/^  / {
  if (on_enum) {
    print "| " gensub(/^  [^ ]+ = ([^ ]+),$/, "\\1", 1, $0)
    handled = 1
  }
}

{
  if (handled) {
    handled = 0
  } else {
    print $0
  }
}
