source justify.tcl

justify::query stlc-unit member {
  max-results 2
  relation member
  vars {ctx \\Gamma} x {t \\tau}
  arg x
  arg t
  arg ctx
}

justify::query stlc-unit judge {
  max-results 5
  relation judge
  vars e t
  arg {context empty}
  arg e
  arg t
}

justify::query stlc-unit judge-apply {
  max-results 1
  relation judge
  vars f x
  arg {context empty}
  arg {term apply f x}
  arg {type unit}
}

justify::query stlc-unit judge-simple {
  max-results 1
  relation judge
  lits x
  arg {context empty}
  arg {term lambda x {type unit} {term variable x}}
  arg {type arrow {type unit} {type unit}}
}
