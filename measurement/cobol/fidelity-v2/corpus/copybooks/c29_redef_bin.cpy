      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C29-REDEF-BIN-REC.
           05  C29-TXT  PIC X(4).
           05  C29-BIN REDEFINES C29-TXT  PIC S9(9) COMP-5.
           05  C29-END  PIC X(2).
