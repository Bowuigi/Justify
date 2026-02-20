# Run with `tclsh example-stlc-unit.tcl`, with `justify.tcl` and this file on the same directory
# Equivalent to the nat example system
source justify.tcl

justify::system nat {
  description {Peano arithmetic / natural number arithmetic}
  syncat number "Natural number" {n m k} {
    zero {
      description {Number zero}
      fixity none
      part 0
    }
    succ {
      description {Successor function, equivalent to $n \mapsto n+1$}
      fixity prefix
      part S
      arg number n
    }
  }
  relation equal {
    meta {
      description {Natural number $n$ is syntactically equal to $m$}

      fixity infix
      arg number n
      part {=}
      arg number m
    }
    rule base Base {
      => ---------------------------------
      => equal {number zero} {number zero}
    }
    rule ind Ind {
      vars x y

      => equal x y
      => -------------------------------------
      => equal {number succ x} {number succ y}
    }
  }
  relation add {
    meta {
      description {Natural number $n$ plus $m$ is syntactically equal to $k$}

      fixity infix
      arg number n
      part {+}
      arg number m
      part {=}
      arg number k
    }
    rule base Base {
      vars x

      => -----------------------
      => add x {number zero} x
    }
    rule ind Ind {
      vars x y z

      => add x y z
      => -------------------------------------
      => add x {number succ y} {number succ z}
    }
  }
  relation multiply {
  	meta {
  	  description {Natural number $n$ times $m$ is syntactically equal to $k$}

  	  fixity infix
  	  arg number n
  	  part \\times
  	  arg number m
  	  part {=}
  	  arg number k
  	}
  	rule base Base {
  	  vars x

  	  => --------------------------------------
  	  => multiply x {number zero} {number zero}
  	}
  	rule ind Ind {
  	  vars w x y z

  	  => multiply x y w
  	  => add w x z
  	  => ----------------------------
  	  => multiply x {number succ y} z
  	}
  }
}
