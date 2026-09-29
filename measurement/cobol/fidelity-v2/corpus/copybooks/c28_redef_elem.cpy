      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C28-REDEF-ELEM-REC.
           05  C28-DATE  PIC 9(8).
           05  C28-DATE-R REDEFINES C28-DATE.
               10  C28-YYYY  PIC 9(4).
               10  C28-MM  PIC 9(2).
               10  C28-DD  PIC 9(2).
           05  C28-AMT-X  PIC X(4).
           05  C28-AMT-P REDEFINES C28-AMT-X  PIC S9(7) COMP-3.
           05  C28-END  PIC X(2).
