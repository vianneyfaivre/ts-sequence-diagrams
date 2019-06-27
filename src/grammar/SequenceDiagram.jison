/** js sequence diagrams
 *  https://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2017 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%x title

%%

[\r\n]+           return 'NL';
\s+               /* skip whitespace */
\#[^\r\n]*        /* skip comments */
"participant"     return 'participant';
"left of"         return 'PLACEMENT_LEFTOF';
"right of"        return 'PLACEMENT_RIGHTOF';
"over"            return 'PLACEMENT_OVER';
"note"            return 'note';
"title"           { this.begin('title'); return 'title'; }
<title>[^\r\n]+   { this.popState(); return 'MESSAGE'; }
","               return ',';
[^\->:,\r\n"]+    return 'ACTOR';
\"[^"]+\"         return 'ACTOR';
"--"              return 'RESPONSE';
"-"               return 'REQUEST';
">"               return 'ARROW';
[^\r\n]+         return 'MESSAGE';
<<EOF>>           return 'EOF';
.                 return 'INVALID';

/lex

%start start

%% /* language grammar */

start
	: document 'EOF' { return yy; }
	;

document
	: /* empty */
	| document line
	;

line
	: statement { }
	| 'NL'
	;

statement
	: 'participant' actor_alias { $2; }
	| signal               { yy.addSignal($1); }
	| note_statement       { yy.addSignal($1); }
	| 'title' message      { yy.setTitle($2);  }
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

actor
	: ACTOR { $$ = yy.getActor($1); }
	;

actor_alias
	: ACTOR { $$ = yy.getActor($1); }
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
	: ARROW     { $$ = $1; }
	;

message
	: MESSAGE { $$ = $1.substring(1); }
	;

%%
