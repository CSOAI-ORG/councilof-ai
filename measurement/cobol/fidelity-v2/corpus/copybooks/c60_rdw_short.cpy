      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C60-RDW-SHORT-REC.
           05  C60-TYPE  PIC X(1).
           05  C60-BODY-B.
               10  C60-B-NAME  PIC X(20).
               10  C60-B-CNT  PIC S9(9) COMP.
           05  C60-BODY-A REDEFINES C60-BODY-B.
               10  C60-A-CODE  PIC X(4).
               10  C60-A-AMT  PIC S9(5) COMP-3.
