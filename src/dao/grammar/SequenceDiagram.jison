/** 
 *  Copied from https://bramp.github.io/js-sequence-diagrams/, then updated
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%x title_var
%x loop_var

%%

[\r\n]+           return 'NL';
\s+               /* skip whitespace */
\#[^\r\n]*        /* skip comments */
"destroy"		  return 'destroy';
"participant"     return 'participant';
"left of"         return 'PLACEMENT_LEFTOF';
"right of"        return 'PLACEMENT_RIGHTOF';
"over"            return 'PLACEMENT_OVER';
"note"            return 'note';
"title"           { this.begin('title_var'); return 'title'; }
<title_var>[^\r\n]+   { this.popState(); return 'MESSAGE'; }
"loop"           			{ this.begin('loop_var'); return 'BEGIN_LOOP'; }
<loop_var>[^\r\n]+   		{ this.popState(); return 'MESSAGE'; }
"end"			  { return 'END_LOOP'; }
","               return ',';
[^\->:,\r\n"]+    return 'ACTOR';
\"[^"]+\"         return 'ACTOR';
"--"              return 'RESPONSE';
"-"               return 'REQUEST';
">*"              return 'ACTOR_CREATION';
">"               return 'ARROW';
[^\r\n]+          return 'MESSAGE';
<<EOF>>           return 'EOF';
.                 return 'INVALID';

/lex

%start grammar_start

%% /* language grammar */

grammar_start
	: document 'EOF' { return yy; }
	;

document
	: /* empty */
	| document line
	;

line
	: statement 					{ yy.pushStatement($1) }
	| BEGIN_LOOP message			{ yy.forBlockStart($2) }
	| END_LOOP						{ yy.forBlockEnd() }
	| 'NL'
	;

statement
	: 'participant' actor 		{ $2; }
	| signal               		{ yy.addSignal($1); }
	| note_statement       		{ $1; }
	| 'title' message      		{ yy.setTitle($2);  }
	| 'destroy' actor_destroy 	{ yy.destroyActor($2)}
	;

note_statement
	: 'note' placement actor message   { $$ = yy.createNote($3, $2, $4); }
	| 'note' 'over' actor message { $$ = yy.createNote($3, $2, $4); }
	;

placement
	: 'left_of'   { $$ = "PLACEMENT_LEFTOF"; }
	| 'right_of'  { $$ = "PLACEMENT_RIGHTOF"; }
	;

signal
	: actor signaltype actor message { $$ = yy.createSignal($1, $2, $3, $4); }
	;

actor_destroy
	: ACTOR { $$ = $1 }
	;

actor
	: ACTOR { $$ = $1 }
	;

signaltype
	: linetype arrowtype  { $$ = $1 + '_' + $2; }
	| linetype            { $$ = $1; }
	;

linetype
	: REQUEST      { $$ = $1; }
	| RESPONSE   { $$ = $1; }
	;

arrowtype
    : ACTOR_CREATION	{ $$ = $1; }
	| ARROW     		{ $$ = $1; }
	;

message
	: MESSAGE { $$ = $1.substring(1); }
	;

%%
