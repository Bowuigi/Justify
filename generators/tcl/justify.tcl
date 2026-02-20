# Requires tclsh and Tcllib (or at least json::write and implementations for everything used here)
# This is not a normal library, but rather a DSL used to create scripts
# This is likely not idiomatic TCL, the code is long and too nested because I wanted to make sure scoping behaved as intended.
package require Tcl 8.5.9
package require json::write

namespace eval justify {
  namespace export system

  proc proc-refs {proc_name proc_args var_names block} {
    uplevel 1 "
      proc {$proc_name} {$proc_args} {
        eval {foreach {v} {$var_names} {upvar 1 \$v \$v}};
        eval {$block}
      }
    "
  }

  proc convert-term {tm} {
    if {[llength $tm] eq 1} {
      return [json::write object-strings is ref to $tm]
    } {
      return [
        json::write object \
          is [json::write string con] \
          from [json::write string [lindex $tm 0]] \
          tag [json::write string [lindex $tm 1]] \
          args [json::write array {*}[lmap {t} [lrange $tm 2 256] {convert-term $t}]]
      ]
    }
  }

  proc process-ident-map {imap} {
    set map [list]
    foreach {id} $imap {
      if {[llength $id] eq 1} {
        lappend map $id [json::write string $id]
      } {
        lappend map [lindex $id 0] [json::write string [lindex $id 1]]
      }
    }
    return [json::write object {*}$map]
  }

  proc syntax-desc {block} {
    # Overriden by functions below
    set syn_description ""
    set syn_fixity ""
    set syn_parts {}
    set syn_args {}
    set syn_rendered_args {}

    proc-refs description {value} {syn_description} {
      set syn_description $value
    }

    proc-refs fixity {value} {syn_fixity} {
      set syn_fixity $value
    }

    proc-refs part {value} {syn_parts} {
      lappend syn_parts $value
    }

    proc-refs arg {other_cat ident {tex ""}} {syn_args syn_rendered_args} {
      if {$tex eq ""} {set tex $ident}
      lappend syn_args [dict create from $other_cat id $ident tex $tex]
      lappend syn_rendered_args [json::write object-strings from $other_cat id $ident tex $tex]
    }

    eval $block

    rename description ""
    rename fixity ""
    rename part ""
    rename arg ""

    set raw [
      dict create \
        description $syn_description \
        tex_parts $syn_parts \
        fixity $syn_fixity \
        arguments $syn_args
    ]
    set rendered [
      dict create \
        description [json::write string $syn_description] \
        tex_parts [json::write array {*}[lmap {p} $syn_parts {json::write string $p}]] \
        fixity [json::write string $syn_fixity] \
        arguments [json::write array {*}$syn_rendered_args]
    ]
    return [dict create raw $raw rendered $rendered]
  }

  proc system {name block} {
    json::write aligned false
    json::write indented true

    # Overriden by functions below
    set sys_description ""
    set sys_syncats {}
    set sys_relations {}

    proc-refs description {value} {sys_description} {
      set sys_description $value
    }
  
    proc-refs syncat {name desc suggestions block_map} {sys_syncats} {
      set cat [list]
      foreach {id block} $block_map {
        set syn [syntax-desc $block]
        lappend cat [json::write object id [json::write string $id] {*}[dict get $syn rendered]]
      }
      lappend sys_syncats $name [
        json::write object \
          description [json::write string $desc] \
          suggestions [json::write array {*}[lmap {s} $suggestions {json::write string $s}]] \
          grammar [json::write array {*}$cat]
      ]
    }

    proc-refs relation {name block} {sys_relations} {
      set rel_meta {}
      set rel_meta_rendered {}
      set rel_rules {}

      proc-refs meta {block} {rel_meta rel_meta_rendered} {
        set syn [syntax-desc $block]
        set rel_meta [dict get $syn raw]
        set rel_meta_rendered [dict get $syn rendered]
      }

      proc-refs rule {id tex block} {rel_rules} {
        set rel_vars "{}"
        set rel_lits "{}"
        set rel_patterns ""
        set rel_premises ""
        set =>-mode premises

        proc-refs vars args {rel_vars} {
          set rel_vars [process-ident-map $args]
        }

        proc-refs lits args {rel_lits} {
          set rel_lits [process-ident-map $args]
        }

        proc-refs => {call args} {=>-mode rel_premises rel_patterns} {
          upvar 2 rel_meta rel_meta
          if {[regexp {^-+$} $call]} {
            set =>-mode conclusion
          } {
            if {${=>-mode} eq "premises"} {
              lappend rel_premises [
                json::write object \
                  relation [json::write string $call] \
                  args [json::write array {*}[lmap {t} $args {convert-term $t}]]
              ]
            } {
              foreach {rel_arg} [dict get $rel_meta arguments] {call_arg} $args {
                lappend rel_patterns [dict get $rel_arg id] [convert-term $call_arg]
              }
            }
          }
        }

        eval $block
        rename vars ""
        rename lits ""
        lappend rel_rules [
          json::write object \
            rule [json::write object-strings id $id tex $tex] \
            variables $rel_vars \
            literals $rel_lits \
            patterns [json::write object {*}$rel_patterns] \
            premises [json::write array {*}$rel_premises]
          ]
      }

      eval $block

      rename meta ""
      rename rule ""

      lappend sys_relations $name [
        json::write object \
          {*}$rel_meta_rendered \
          rules [json::write array {*}$rel_rules]]
    }

    eval $block

    # Already deleted
    # rename description ""
    rename syncat ""
    rename relation ""

    # puts "Name: $name"
    puts [
      json::write object \
        description [json::write string $sys_description] \
        syntax [json::write object {*}$sys_syncats] \
        relations [json::write object {*}$sys_relations]
    ]
  }
}

