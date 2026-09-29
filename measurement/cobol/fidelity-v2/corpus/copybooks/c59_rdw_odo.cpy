      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C59-RDW-ODO-REC.
           05  C59-COUNT  PIC 9(2).
           05  C59-ITEM OCCURS 0 TO 5 TIMES DEPENDING ON C59-COUNT.
               10  C59-CODE  PIC X(3).
               10  C59-AMT  PIC S9(5) COMP-3.
           05  C59-TRAILER  PIC X(4).
