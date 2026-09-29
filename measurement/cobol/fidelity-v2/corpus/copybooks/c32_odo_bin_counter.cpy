      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C32-ODO-BIN-COUNTER-REC.
           05  C32-COUNT  PIC S9(4) COMP.
           05  C32-ITEM OCCURS 0 TO 6 TIMES DEPENDING ON C32-COUNT.
               10  C32-VAL  PIC S9(5) COMP-3.
           05  C32-TRAILER  PIC S9(5)V9(2).
