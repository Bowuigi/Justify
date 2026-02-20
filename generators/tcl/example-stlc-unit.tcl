# Run with `tclsh example-stlc-unit.tcl`, with `justify.tcl` and this file on the same directory
# Equivalent to the stlc-unit example system
source justify.tcl

justify::system stlc-unit {
  description {Simply-typed lambda calculus with a unit type}
  # The last argument is an array that maps identifiers to their grammar description
  syncat term "Terms" {e} {
    variable {
      description {Variable $x$}
      fixity none
      arg identifier x
    }
    lambda {
      description {Binds the applied term of type $t$ to the variable $x$ in $e$}
      # Alternative syntax (and an example of how Tcl macros can be useful) subsuming arg, part and fixity:
      # > syn {\\lambda x : \\tau .\\, e} \
      # >     {_ x _ t _ e} \
      # >     {_ identifier _ type _ term}
      fixity prefix
      part \\lambda
      arg identifier x
      part :
      arg type t \\tau
      part {.\,}
      arg term e
    }
    apply {
      description {Applies $e_2$ to $e_1$, performing beta reduction}
      fixity infix
      arg term e1 e_1
      part {\;}
      arg term e2 e_2
    }
    star {
      description {The only term of type $\mathbf{1}$}
      fixity none
      part \\star
    }
  }
  syncat type "Types" {\\tau A B} {
    arrow {
      description {A function from $A$ to $B$}
      fixity infix
      arg type t1 A
      part \\rightarrow
      arg type t2 B
    }
    unit {
      description {A type with only one inhabitant, $\star$}
      fixity none
      part {\mathbf{1}}
    }
  }
  syncat context "Contexts" {\\Gamma} {
    empty {
      description {Empty context, empty environment}
      fixity none
      part \\cdot
    }
    extend {
      description {A cons operation for contexts (here, assoc lists)}
      fixity infix
      arg context ctx \\Gamma
      part ,
      arg identifier x
      part :
      arg type t \\tau
    }
  }
  relation judge {
    meta {
      description {Term $e$ has type $\tau$ on context $\Gamma$}

      fixity infix
      arg context ctx \\Gamma
      part \\vdash
      arg term tm e
      part :
      arg type ty \\tau
    }

    rule app App {
      vars {e1 e_1} {e2 e_2} {a A} {b B} {ctx \\Gamma}
      # lits is the same as vars but it works on the `literals` field. Ommiting it should probably work.
      lits

      # => creates premises before the --- (which can have any number of -s) and patterns after the --- bar
      # Note that the relation name is the same as the one being defined
      # Lone identifiers (aside from the relation name, which is the first argument to non-separator `=>`s) are references (ref), `{syncat id args...}` are constructors (con)
      => judge ctx e1 {type arrow a b}
      => judge ctx e2 a
      => ------------------------------
      => judge ctx {term apply e1 e2} b
    }
    rule lam Lam {
      # Passing a list of one value instead of two is equal to using that value for both tex and id
      vars {ctx \\Gamma} x {a A} {b B} e

      => judge {context extend ctx x a} e b
      => ----------------------------------------------
      => judge ctx {term lambda x a e} {type arrow a b}
    }
    rule unit Unit {
      vars {ctx \\Gamma}

      # No `=>`s before the separator means no premises are provided
      => ---------------------------------
      => judge ctx {term star} {type unit}
    }
    rule var Var {
      vars {ctx \\Gamma} x {t \\tau}

      => member x t ctx
      => -----------------------------
      => judge ctx {term variable x} t
    }
  }
  relation member {
  	meta {
  	  description {Identifier $x$ inside context $\Gamma$ has type $\tau$}

  	  fixity infix
  	  arg identifier ident x
  	  part :
  	  arg type ty \\tau
  	  part \\in
  	  arg context ctx \\Gamma
  	}
  	rule found Found {
  	  vars x {t \\tau} {ctx \\Gamma}
  	  => -----------------------------------
  	  => member x t {context extend ctx x t}
  	}
  	rule next Next {
  	  vars x y {t1 \\tau} {t2 \\sigma} {ctx \\Gamma}
  	  => member x t1 ctx
  	  => -------------------------------------
  	  => member x t1 {context extend ctx y t2}
  	}
  }
}
