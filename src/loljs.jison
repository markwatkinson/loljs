/* lexical grammar */
%lex
%options case-insensitive

%%

"BTW".*                                         /* skip comment */
(\r?\n)+                                        return "NEWLINE"
","                                             return "COMMA"
\s+                                             /* skip whitespace */
[0-9]+("."[0-9]+)?\b                            return "NUMBER"
\"([^\"]*)\"                                    return "YARN"
\'([^\']*)\'                                    return "YARN"
"WIN"                                           return "TROOF"
"FAIL"                                          return "TROOF"
"NOOB"                                          return "NOOB"
"HAI"                                           return "HAI"
"KTHXBYE"                                       return "KTHXBYE"
"IT"[SZ]                                        return "ITS"
"I"\s+"HAS"\s+"A"                               return "VAR_DEC"
"SUM"\s+"OF"                                    return "SUM_OF"
"DIFF"\s+"OF"                                   return "DIFF_OF"
"PRODUKT"\s+"OF"                                return "PRODUKT_OF"
"QUOSHUNT"\s+"OF"                               return "QUOSHUNT_OF"
"MOD"\s+"OF"                                    return "MOD_OF"
"BIGGR"\s+"OF"                                  return "BIGGR_OF"
"SMALLR"\s+"OF"                                 return "SMALLR_OF"
"BOTH"\s+"SAEM"                                 return "BOTH_SAEM"
"DIFFRINT"                                      return "DIFFRINT"
"BOTH"\s+"OF"                                   return "BOTH_OF"
"EITHER"\s+"OF"                                 return "EITHER_OF"
"WON"\s+"OF"                                    return "WON_OF"
"NOT"                                           return "NOT"
"ALL"\s+"OF"                                    return "IDENTIFIER"
"ANY"\s+"OF"                                    return "IDENTIFIER"
"AN"                                            return "SEP"
"MKAY"                                          return "MKAY"
\b"R"\b                                         return "R"
"O"\s+"RLY"\s*"?"                               return "O_RLY"
"YA"\s+"RLY"                                    return "YA_RLY"
"MEBBE"                                         return "MEBBE"
"OIC"                                           return "OIC"
"NO"\s+"WAI"                                    return "NO_WAI"
"HOW"\s+"DUZ"\s+"I"\b                           return "HOW_DUZ_I"
"YR"                                            return "YR"
"IF"\s+"U"\s+"SAY"\s+"SO"\b                     return "IF_U_SAY_SO"
[a-zA-Z_]+[a-zA-Z_0-9]*                         return "IDENTIFIER"
"("                                             return "("
")"                                             return ")"
<<EOF>>                                         return "EOF"
.                                               return "INVALID"

/lex


%start root
%% /* language grammar */

root
    : body
        {  return $1; }
    | HAI body KTHXBYE eol
        {  return $2; }
    ;

eol
    : NEWLINE { $$ = $1 }
    | COMMA { $$ = $1 }
    | EOF { $$ = $1 }
    ;

arg_end
    : MKAY {$$ = $1;}
    ;

arg_list
    : simple_exp
        { $$ = new ast.ArgList([$1]); }
    | arg_list SEP simple_exp
        {
            $1.push($3);
            $$ = $1
        }
    ;

function_call
    : IDENTIFIER arg_list arg_end
        { $$ = new ast.FunctionCall($1, $2); }
    ;

function_def_arg_list
    : YR IDENTIFIER { $$ = [$2]; }
    | function_def_arg_list SEP YR IDENTIFIER { $1.push($4); $$ = $1; }
    | /* empty */ {$$ = []; }
    ;
    
function_def
    : HOW_DUZ_I IDENTIFIER function_def_arg_list eol body IF_U_SAY_SO
        { $$ = new ast.FunctionDefinition($2, $3, $5); }
    ;
        

simple_exp
    : SUM_OF simple_exp SEP simple_exp
        {
            var args = new ast.ArgList([$2, $4]);
            $$ = new ast.FunctionCall('SUM OF', args);
        }
    | DIFF_OF simple_exp SEP simple_exp
        {
            var args =  new ast.ArgList([$2, $4]);
            $$ = new ast.FunctionCall('DIFF OF', args);
        }
    | BOTH_SAEM simple_exp SEP simple_exp
        {
            var args = new ast.ArgList([$2, $4]);
            $$ = new ast.FunctionCall('BOTH SAEM', args);
        }
    | IDENTIFIER "R" simple_exp
        { $$ = new ast.Assignment($1, $3); }
    | function_call { $$ = $1; }
    | NUMBER { $$ = new ast.Number($1);  }
    | YARN {  $$ = new ast.Yarn($1);  }
    | TROOF { $$ = new ast.Troof($1.toLowerCase() === 'win');}
    | NOOB { $$ = new ast.Noob(); }
    | IDENTIFIER { $$ = new ast.Identifier($1); }
    | "(" simple_exp ")"
        { $$ = $2 }
    ;

var_dec
    : VAR_DEC IDENTIFIER ITS simple_exp
        {
            $$ = new ast.Declaration($2, $4)
        }
    | VAR_DEC IDENTIFIER
        { $$ = new ast.Declaration($2); }
    ;
conditional
    : O_RLY eol YA_RLY eol body
        { $$ = new ast.If($5); }
    | conditional MEBBE simple_exp eol body
        {
            var elseIf = new ast.If($5);
            elseIf.condition = $3;
            $1.elseIfs.push(elseIf);
            $$ = $1;
        }
    | conditional NO_WAI eol body
        { $1.elseBody = $4; $$ = $1; }
    | conditional OIC { $$ = $1; }
    ;



body
    : line eol
        {
            $$ = new ast.Body();
            $$.push($1);
        }
    | body line eol
        {
            $1.push($2);
            $$ = $1;
        }
    ;

line
    : var_dec
        {
            $$ = $1;
        }
    | simple_exp
        {
            $$ = $1;
        }
    | conditional { $$ = $1; }
    | function_def { $$ = $1; }
    ;