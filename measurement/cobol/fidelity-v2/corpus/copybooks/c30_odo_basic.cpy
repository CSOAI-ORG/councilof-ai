      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C30-ODO-BASIC-REC.
           05  C30-COUNT  PIC 9(2).
           05  C30-ITEM OCCURS 0 TO 5 TIMES DEPENDING ON C30-COUNT.
               10  C30-CODE  PIC X(3).
               10  C30-AMT  PIC S9(5)V9(2) COMP-3.
           05  C30-TRAILER  PIC X(6).
