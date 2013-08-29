HAI

OBTW this is an implementation of an interpreter for the
esoteric programming language 'brainfuck',
http://en.wikipedia.org/wiki/Brainfuck

The fact that this interpreter runs implies that this
implementation of LOLCODE is Turing-complete

  The actual program is a hello world example defined
  at the bottom.
TLDR


HOW DUZ I INTERPRET YR PROGRAM

  I HAS A TAPE ITZ GOT NOTHING
  I HAS A COUNTER ITZ 0
  BTW Initialise the tape
  IM IN YR LOOP UPPIN YR COUNTER WILE BOTH SAEM BIGGR OF COUNTER AN 20 AN 20
    TAPE!COUNTER R 0
  IM OUTTA YR LOOP

  I HAS A TAPEPTR ITZ 0
  I HAS A INPUTPTR ITZ 0
  COUNTER R 0



  IM IN YR LOOP UPPIN YR COUNTER WILE BOTH SAEM SMALLR OF COUNTER AN LEN OF PROGRAM AN COUNTER
    I HAS A C ITZ PROGRAM!COUNTER
    C, WTF?
      OMG ">", TAPEPTR R SUM OF TAPEPTR AN 1, GTFO
      OMG "<", TAPEPTR R DIFF OF TAPEPTR AN 1, GTFO
      OMG "+", TAPE!TAPEPTR R SUM OF TAPE!TAPEPTR AN 1, GTFO
      OMG "-", TAPE!TAPEPTR R DIFF OF TAPE!TAPEPTR AN 1, GTFO
      OMG ".", VISIBLE CHR OF TAPE!TAPEPTR , GTFO
      OMG ","
        I HAS A CHAR
        I HAS A NUM
        GIMMEH CHAR
        NUM R ORD OF CHAR
        TAPE!TAPEPTR R NUM
        GTFO
      OMG "["
        NOT BOTH SAEM TAPE!TAPEPTR AN 0, O RLY?
          YA RLY, GTFO
        OIC
      OMG "]"
        BOTH SAEM 0 AN TAPE!TAPEPTR, O RLY?
          YA RLY, GTFO
        OIC

        I HAS A STACK ITZ 0
        I HAS A DIR ITZ 1
        BOTH SAEM C AN "]", O RLY?
          YA RLY, DIR R -1
        OIC

        IM IN YR LOOP

          COUNTER R SUM OF COUNTER AN DIR

          EITHER OF BOTH SAEM COUNTER AN -1 AN BOTH SAEM COUNTER AN LEN OF PROGRAM, O RLY?
            YA RLY
              VISIBLE "YOUR BRACKETS DIDN'T MATCH."
              FOUND YR 0

            MEBBE BOTH SAEM PROGRAM!COUNTER AN C
              STACK R SUM OF STACK AN 1

            MEBBE EITHER OF BOTH SAEM PROGRAM!COUNTER AN "]" AN BOTH SAEM PROGRAM!COUNTER AN "["
              BOTH SAEM STACK AN 0, O RLY?
                YA RLY, GTFO
                NO WAI, STACK R DIFF OF STACK AN 1
              OIC
          OIC
        IM OUTTA YR LOOP
    OIC
  IM OUTTA YR LOOP

IF U SAY SO


I HAS A PROGRAM ITZ "++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>."

INTERPRET PROGRAM MKAY