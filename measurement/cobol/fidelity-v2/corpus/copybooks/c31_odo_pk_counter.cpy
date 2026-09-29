      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C31-ODO-PK-COUNTER-REC.
           05  C31-COUNT  PIC S9(3) COMP-3.
           05  C31-ITEM OCCURS 1 TO 4 TIMES DEPENDING ON C31-COUNT.
               10  C31-CODE  PIC X(4).
           05  C31-TRAILER  PIC X(3).
