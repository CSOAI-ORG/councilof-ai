      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C33-OCCURS-NESTED-REC.
           05  C33-ROW OCCURS 2 TIMES.
               10  C33-KEY  PIC X(2).
               10  C33-CELL OCCURS 3 TIMES.
                   15  C33-VAL  PIC S9(3) COMP-3.
           05  C33-END  PIC X(3).
