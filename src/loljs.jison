/* lexical grammar */
%lex
%options case-insensitive
%%

"OBTW"[\s\S]+"TLDR"                             /* skip block comment */
"BTW".*                                         /* skip comment */
(\r?\n)+\s*                                     return "NEWLINE"
","                                             return "COMMA"
[^\S\r\n]+                                      /* skip whitespace */
\-?[0-9]+("."[0-9]+)?\b                         return "NUMBER"
\"([^\":]+|\:.)*\"                              return "YARN"
\'([^\']*)\'                                    return "YARN"
"WIN"                                           return "TROOF"
"FAIL"                                          return "TROOF"
"NOOB"                                          return "NOOB"
"HAI"\s*                                        /* skip */
"KTHXBYE"\s*                                    /* skip */
"KTHX"                                          return "KTHX"
"IT"[SZ]                                        return "ITS"
"I"\s+"HAS"\s+"A"                               return "VAR_DEC"
"BIG"G?"R"\s+"THAN"                             return "BIN_OP"
"SMAL"L?"R"\s+"THAN"                            return "BIN_OP"
"SUM"\s+"OF"                                    return "P_BIN_OP"
"DIFF"\s+"OF"                                   return "P_BIN_OP"
"PRODUKT"\s+"OF"                                return "P_BIN_OP"
"QUOSHUNT"\s+"OF"                               return "P_BIN_OP"
"MOD"\s+"OF"                                    return "P_BIN_OP"
"BIGGR"\s+"OF"                                  return "P_BIN_OP"
"SMALLR"\s+"OF"                                 return "P_BIN_OP"
"BOTH"\s+"SAEM"                                 return "P_BIN_OP"
"DIFFRINT"                                      return "P_BIN_OP"
"BOTH"\s+"OF"                                   return "P_BIN_OP"
"EITHER"\s+"OF"                                 return "P_BIN_OP"
"WON"\s+"OF"                                    return "P_BIN_OP"
"NOT"                                           return "NOT"
"ALL"\s+"OF"                                    return "IDENTIFIER"
"ANY"\s+"OF"                                    return "IDENTIFIER"
"AN"                                            return "SEP"
"MKAY"                                          return "MKAY"
"R"                                             return "R"
"O"\s+"RLY"\s*"?"                               return "O_RLY"
"YA"\s+"RLY"                                    return "YA_RLY"
"MEBBE"                                         return "MEBBE"
"OIC"                                           return "OIC"
"NO"\s+"WAI"                                    return "NO_WAI"
"HOW"\s+"DUZ"\s+"I"                             return "HOW_DUZ_I"
"FOUND"\s+"YR"                                  return "FOUND_YR"
"YR"                                            return "YR"
"IF"\s+"U"\s+"SAY"\s+"SO"                       return "IF_U_SAY_SO"
"IM"\s+"IN"\s+"YR"                              return "IM_IN_YR"
"IM"\s+"OUTTA"\s+"YR"                           return "IM_OUTTA_YR"
"O"\s+"NVM"                                     return "O_NVM"
"UPPIN"                                         return "UPPIN"
"NERFIN"                                        return "NERFIN"
"VISIBLE"                                       return "VISIBLE"
"G"[IE]"MMEH"                                   return "GIMMEH"
"TIL"                                           return "TIL"
"WILE"                                          return "WILE"
"GTFO"                                          return "GTFO"
"NUMBR"                                         return "TYPE"
"NUMBAR"                                        return "TYPE"
"TROOF"                                         return "TYPE"
"YARN"                                          return "TYPE"
"NOOB"                                          return "TYPE"
"BUKKIT"                                        return "TYPE"
"MAEK"                                          return "CAST_MAEK"
"IS"\s+"NOW"\s+"A"                              return "CAST_IS_NOW"
"A"                                             return "A"
"PLZ HALP"                                      return "HALP"
[a-zA-Z_]+[a-zA-Z_0-9]*                         return "IDENTIFIER"
"("                                             return "("
")"                                             return ")"
"?"                                             /* skip */
<<EOF>>                                         return "EOF"
.                                               return "INVALID"

/lex

%left "NOT"
%left "P_BIN_OP" "BIN_OP"
%left "BIGGR_THAN" "SMALLR_THAN"

%start root
%% /* language grammar */
%ebnf

root
    : body
        { return $1; }
    | root eol { return $1 }
    ;

eol
    : NEWLINE { $$ = $1 }
    | COMMA { $$ = $1 }
    | EOF { $$ = $1 }
    ;

arg_end
    : MKAY {$$ = $1;}
    | eol
    ;

arg_list
    : simple_exp
        { $$ = new ast.ArgList(@$, [$1]); }
    | arg_list SEP simple_exp
        {
            $1.push($3);
            $$ = $1
        }
    ;

function_call
    : IDENTIFIER arg_list arg_end
        { $$ = new ast.FunctionCall(@$, $1, $2); }
    ;

function_def_arg_list
    : YR IDENTIFIER { $$ = [$2]; }
    | function_def_arg_list SEP YR IDENTIFIER { $1.push($4); $$ = $1; }
    | /* empty */ {$$ = []; }
    ;

function_def
    : HOW_DUZ_I IDENTIFIER function_def_arg_list eol body IF_U_SAY_SO
        { $$ = new ast.FunctionDefinition(@$, $2, $3, $5); }
    ;

loop_operation
    : UPPIN YR IDENTIFIER { $$ = new ast.LoopOperation(@$, 'inc', $3) }
    | NERFIN YR IDENTIFIER { $$ = new ast.LoopOperation(@$, 'dec', $4); }
    ;

loop_condition
    : TIL simple_exp { $$ = new ast.LoopCondition(@$, 'until', $2); }
    | WILE simple_exp { $$ = new ast.LoopCondition(@$, 'while', $2); }
    ;

loop
    : IM_IN_YR IDENTIFIER eol body KTHX
        { $$ = new ast.Loop(@$, $4) }
    | IM_IN_YR IDENTIFIER loop_operation loop_condition eol body IM_OUTTA_YR IDENTIFIER
        {
            $$ = new ast.Loop(@$, $6, $3, $4);
        }
    ;
type
    : TYPE {$$ = $1; }
    | NOOB {$$ = $1; }
    ;
simple_exp
    : simple_exp BIN_OP simple_exp
        {
            var args = new ast.ArgList(@$, [$1, $3]);
            $$ = new ast.FunctionCall(@$, $2, args);
        }
    | P_BIN_OP simple_exp SEP simple_exp
        {
            var args = new ast.ArgList(@$, [$2, $4]);
            $$ = new ast.FunctionCall(@$, $1, args);
        }
    | NOT simple_exp
        {
            var args =  new ast.ArgList(@$, [$2]);
            $$ = new ast.FunctionCall(@$, 'NOT', args);
        }
    | function_call { $$ = $1; }
    | NUMBER { $$ = new ast.Literal(@$, Number($1)); }
    | YARN {  $$ = new ast.Literal(@$, $1);  }
    | TROOF { $$ = new ast.Literal(@$, $1.toLowerCase() === 'win');}
    | NOOB { $$ = new ast.Literal(@$, null); }
    | IDENTIFIER { $$ = new ast.Identifier(@$, $1); }
    | "(" simple_exp ")"
        { $$ = $2 }
    | CAST_MAEK simple_exp "A" type
        { $$ = new ast.Cast(@$, $2, $4); }
    ;

var_dec
    : VAR_DEC IDENTIFIER ITS simple_exp
        { $$ = new ast.Declaration(@$, $2, $4) }
    | VAR_DEC IDENTIFIER
        { $$ = new ast.Declaration(@$, $2) }
    ;

conditional_inner
    : O_RLY eol YA_RLY eol body
        { $$ = new ast.If(@$, $5); }
    | conditional_inner MEBBE simple_exp eol body
        {
            var elseIf = new ast.If(@$, $5);
            elseIf.condition = $3;
            $1.elseIfs.push(elseIf);
            $$ = $1;
        }
    | conditional_inner NO_WAI eol body
        { $1.elseBody = $4; $$ = $1; }
    ;

conditional
    : conditional_inner OIC { $$ = $1; }
    ;



body
    :  eol {$$ = new ast.Body(@$);}
    | line eol
        {
            $$ = new ast.Body(@$);
            $$.push($1);
        }
    | body line eol
        {
            $1.push($2);
            $$ = $1;
        }
    ;

assignment
    : IDENTIFIER "R" simple_exp
        { $$ = new ast.Assignment(@$, $1, $3); }
    ;


line
    : var_dec { $$ = $1; }
    | simple_exp { $$ = $1; }
    | loop { $$ = $1; }
    | O_NVM { $$ = new ast.NoOp(@$); }
    | GTFO { $$ = new ast.Break(@$); }
    | FOUND_YR simple_exp { $$ = new ast.Return(@$, $2); }
    | assignment {$$ = $1; }
    | VISIBLE simple_exp
        { $$ = new ast.Visible(@$, $2); }
    | GIMMEH IDENTIFIER
        { $$ = new ast.Gimmeh(@$, $2); }
    | IDENTIFIER CAST_IS_NOW type
        {
            var ident = new ast.Identifier(@$, $1);
            var cast = $$ = new ast.Cast(@$, ident, $3);
            var assignment = new ast.Assignment(@$, $1, cast);
            $$ = assignment;
        }
    | conditional { $$ = $1; }
    | function_def { $$ = $1; }
    | HALP { $$ = new ast.Breakpoint(@$); }
    ;