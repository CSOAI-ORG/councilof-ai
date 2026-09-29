      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C27-REDEF-GROUP-REC.
           05  C27-TYPE  PIC X(1).
           05  C27-BODY  PIC X(12).
           05  C27-BODY-A REDEFINES C27-BODY.
               10  C27-A-NAME  PIC X(8).
               10  C27-A-QTY  PIC S9(7) COMP-3.
           05  C27-BODY-B REDEFINES C27-BODY.
               10  C27-B-AMT  PIC S9(9)V9(2) COMP-3.
               10  C27-B-CNT  PIC S9(9) COMP.
               10  FILLER  PIC X(2).
           05  C27-TAIL  PIC X(4).
