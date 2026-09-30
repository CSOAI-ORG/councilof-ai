      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.
       01  C48-SYNC-OCCURS-REC.
           05  C48-CODE  PIC X(1).
           05  C48-TABLE OCCURS 3 TIMES.
               10  C48-TYPE  PIC X(1).
               10  C48-PAY  PIC S9(4)V9(2) COMP SYNC.
               10  C48-HOURS  PIC S9(3) COMP SYNC.
               10  C48-NAME  PIC X(5).
           05  C48-END  PIC X(2).
